using Confluent.Kafka;
using System.Text.Json;
using Shared.Contracts.Events;

namespace AuditService.Services.Kafka
{
    public class KafkaAuditConsumer : BackgroundService
    {
        protected override Task ExecuteAsync(CancellationToken stoppingToken)
        {
            Task.Run(() =>
            {
                var config = new ConsumerConfig
                {
                    BootstrapServers = "localhost:29092",
                    GroupId = "audit-group", // 🔥 DIFFERENT GROUP
                    AutoOffsetReset = AutoOffsetReset.Earliest
                };

                using var consumer = new ConsumerBuilder<Ignore, string>(config).Build();

                consumer.Subscribe("document-uploaded");

                Console.WriteLine("🧾 Audit Service Started...");
                Console.WriteLine("📡 Listening to document-uploaded...");

                while (!stoppingToken.IsCancellationRequested)
                {
                    try
                    {
                        var result = consumer.Consume(stoppingToken);

                        var eventMessage = JsonSerializer.Deserialize<DocumentUploadedEvent>(result.Message.Value);

                        if (eventMessage != null)
                        {
                            Console.WriteLine("🧾 AUDIT LOG:");
                            Console.WriteLine($"📁 File: {eventMessage.FileName}");
                            Console.WriteLine($"📍 Path: {eventMessage.FilePath}");
                            Console.WriteLine($"⏰ Time: {eventMessage.UploadedAt}");
                            Console.WriteLine("--------------------------------------------------");
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"❌ Audit Error: {ex.Message}");
                    }
                }
            }, stoppingToken);

            return Task.CompletedTask;
        }
    }
}