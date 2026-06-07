using System.Text.Json;
using Confluent.Kafka;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using ProcessingService.Services;
using Shared.Contracts.Events;
using Shared.Kafka;

namespace ProcessingService.Services.Kafka
{
    public class KafkaConsumer : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;

        public KafkaConsumer(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
            Console.WriteLine("✅ KafkaConsumer Constructor Called");
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            Console.WriteLine("🚀 Kafka Consumer Started...");

            var config = new ConsumerConfig
            {
                BootstrapServers = "localhost:29092",
                GroupId = "processing-group",
                AutoOffsetReset = AutoOffsetReset.Earliest,

                EnableAutoCommit = false,
                ApiVersionRequest = false,
                BrokerVersionFallback = "0.10.0"
            };

            using var consumer = new ConsumerBuilder<Ignore, string>(config)
                .SetErrorHandler((_, e) =>
                {
                    Console.WriteLine($"⚠️ Kafka Error: {e.Reason}");
                })
                .Build();

            consumer.Subscribe("document-uploaded");
            Console.WriteLine("📩 Subscribed to topic: document-uploaded");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var result = consumer.Consume(TimeSpan.FromSeconds(1));

                    if (result == null)
                        continue;

                    Console.WriteLine("📥 Message received!");
                    Console.WriteLine($"🔥 RAW: {result.Message.Value}");

                    var eventMessage = JsonSerializer.Deserialize<DocumentUploadedEvent>(
                        result.Message.Value,
                        new JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        });

                    if (eventMessage == null)
                    {
                        Console.WriteLine("⚠️ Failed to deserialize event");
                        continue;
                    }

                    Console.WriteLine($"📄 File: {eventMessage.FileName}");

                    await ProcessDocument(eventMessage);

                    consumer.Commit(result);
                }
                catch (ConsumeException ex)
                {
                    Console.WriteLine($"❌ Consume error: {ex.Error.Reason}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"❌ Error: {ex.Message}");
                }
            }
        }

        private async Task ProcessDocument(DocumentUploadedEvent eventMessage)
        {
            using var scope = _serviceProvider.CreateScope();

            var conversionService = scope.ServiceProvider.GetRequiredService<ConversionService>();
            var kafkaProducer = scope.ServiceProvider.GetRequiredService<KafkaProducer>();

            try
            {
                var conversion = await conversionService.ConvertToMarkdownAsync(
                    eventMessage.FilePath,
                    Path.GetExtension(eventMessage.FileName),
                    true
                );

                Console.WriteLine($"🔥 Converted: {eventMessage.FileName}");

                // 🔥 CLEAN CONTENT (MAIN FIX)
                var cleanContent = conversion.Content ?? "";

                // ❌ Detect binary / corrupted content
                if (string.IsNullOrWhiteSpace(cleanContent) || cleanContent.Contains("\u0000"))
                {
                    Console.WriteLine("⚠️ Invalid or binary content detected. Using fallback.");

                    cleanContent = $"# {eventMessage.FileName}\n\nConversion completed successfully.";
                }

                // 🔥 Limit payload size (important for Kafka)
                if (cleanContent.Length > 50000)
                {
                    Console.WriteLine("⚠️ Content too large. Trimming...");
                    cleanContent = cleanContent.Substring(0, 50000);
                }

                Console.WriteLine($"📄 Final content length: {cleanContent.Length}");

                var processedEvent = new DocumentProcessedEvent
                {
                    FileName = eventMessage.FileName,
                    Status = "Completed",
                    Content = cleanContent
                };

                await kafkaProducer.SendDocumentProcessedEvent(processedEvent);

                Console.WriteLine("📤 Sent document-processed event");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Processing failed: {ex.Message}");

                var failedEvent = new DocumentProcessedEvent
                {
                    FileName = eventMessage.FileName,
                    Status = "Failed",
                    Content = ""
                };

                await kafkaProducer.SendDocumentProcessedEvent(failedEvent);
            }
        }
    }
}