using Confluent.Kafka;
using System.Text.Json;
using Microsoft.Extensions.Hosting;
using Shared.Contracts.Events;
using Microsoft.AspNetCore.SignalR;
using DocumentService.Hubs;
using System.IO;
using DocumentService.Models;
using DocumentService.Services;

namespace DocumentService.Services.Kafka
{
    public class DocumentProcessedConsumer : BackgroundService
    {
        private readonly IHubContext<DocumentHub> _hubContext;
        private IConsumer<Ignore, string>? _consumer;

        public DocumentProcessedConsumer(IHubContext<DocumentHub> hubContext)
        {
            _hubContext = hubContext;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            Console.WriteLine("🚀 DocumentProcessedConsumer Started...");

            var config = new ConsumerConfig
            {
                BootstrapServers = "localhost:29092",
                GroupId = "document-processing-service",
                AutoOffsetReset = AutoOffsetReset.Latest,
                EnableAutoCommit = false,

                ReconnectBackoffMs = 100,
                ReconnectBackoffMaxMs = 10000,

                ApiVersionRequest = false,
                BrokerVersionFallback = "0.10.0"
            };

            try
            {
                _consumer = new ConsumerBuilder<Ignore, string>(config)
                    .SetErrorHandler((_, e) =>
                    {
                        Console.WriteLine($"⚠️ Kafka Error: {e.Reason}");
                    })
                    .Build();

                _consumer.Subscribe("document-processed");
                Console.WriteLine("📩 Subscribed to topic: document-processed");

                while (!stoppingToken.IsCancellationRequested)
                {
                    try
                    {
                        var result = _consumer.Consume(TimeSpan.FromSeconds(1));

                        if (result == null)
                            continue;

                        Console.WriteLine("📥 Event received!");
                        Console.WriteLine("🔥 RAW: " + result.Message.Value);

                        DocumentProcessedEvent? processedEvent;

                        try
                        {
                            processedEvent = JsonSerializer.Deserialize<DocumentProcessedEvent>(
                                result.Message.Value,
                                new JsonSerializerOptions
                                {
                                    PropertyNameCaseInsensitive = true
                                });
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"❌ JSON Error: {ex.Message}");
                            continue;
                        }

                        if (processedEvent == null)
                        {
                            Console.WriteLine("⚠️ Failed to deserialize event");
                            continue;
                        }

                        // ✅ Clean filename
                        var cleanFileName = Path.GetFileName(processedEvent.FileName ?? "").Trim();
                        var status = processedEvent.Status?.Trim() ?? "";
                        var content = processedEvent.Content ?? "";

                        if (string.IsNullOrWhiteSpace(cleanFileName) || string.IsNullOrWhiteSpace(status))
                        {
                            Console.WriteLine("❌ Invalid data, skipping...");
                            continue;
                        }

                        // 🔥 MAIN FIX: CLEAN CONTENT
                        if (string.IsNullOrWhiteSpace(content) || content.Contains("\u0000"))
                        {
                            Console.WriteLine("⚠️ Corrupted content detected. Fixing...");

                            content = $"# {cleanFileName}\n\nDocument processed successfully.";
                        }

                        // 🔥 LIMIT SIZE (important for UI + SignalR)
                        if (content.Length > 50000)
                        {
                            Console.WriteLine("⚠️ Content too large. Trimming...");
                            content = content.Substring(0, 50000);
                        }

                        Console.WriteLine($"📋 File: {cleanFileName}");
                        Console.WriteLine($"📋 Status: {status}");
                        Console.WriteLine($"📄 Final content length: {content.Length}");

                        // ✅ Update store
                        DocumentStore.Update(new DocumentModel
                        {
                            FileName = cleanFileName,
                            Status = status,
                            Content = content
                        });

                        Console.WriteLine("✅ Store fully updated");

                        // 🔥 Send clean data to SignalR
                        try
                        {
                            await _hubContext.Clients.All.SendAsync(
                                "ReceiveDocument",
                                new
                                {
                                    fileName = cleanFileName,
                                    status = status,
                                    content = content
                                },
                                cancellationToken: stoppingToken
                            );

                            Console.WriteLine("📡 SignalR sent");
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"❌ SignalR error: {ex.Message}");
                        }

                        _consumer.Commit(result);
                    }
                    catch (ConsumeException ex)
                    {
                        Console.WriteLine($"❌ Consume error: {ex.Error.Reason}");
                    }
                    catch (OperationCanceledException)
                    {
                        Console.WriteLine("🛑 Cancellation requested");
                        break;
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"❌ Unexpected error: {ex.Message}");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Fatal error: {ex.Message}");
            }
            finally
            {
                try
                {
                    _consumer?.Close();
                    _consumer?.Dispose();
                }
                catch { }

                Console.WriteLine("🛑 Consumer stopped");
            }
        }
    }
}