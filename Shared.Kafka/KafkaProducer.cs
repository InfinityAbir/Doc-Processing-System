using Confluent.Kafka;
using System.Text.Json;
using Shared.Contracts.Events;

namespace Shared.Kafka
{
    public class KafkaProducer
    {
        private readonly IProducer<Null, string> _producer;

        public KafkaProducer()
        {
            var config = new ProducerConfig
            {
                BootstrapServers = "localhost:29092",

                // 🔥 IMPORTANT (improves delivery)
                Acks = Acks.All,
                EnableIdempotence = true
            };

            _producer = new ProducerBuilder<Null, string>(config)
                .SetErrorHandler((_, e) =>
                {
                    Console.WriteLine($"❌ Kafka Producer Error: {e.Reason}");
                })
                .Build();
        }

        // 🔥 Generic sender
        private async Task SendAsync(string topic, object data)
        {
            var json = JsonSerializer.Serialize(data);

            Console.WriteLine($"📤 Producing to topic: {topic}");
            Console.WriteLine($"📦 Payload: {json}");

            var result = await _producer.ProduceAsync(topic, new Message<Null, string>
            {
                Value = json
            });

            Console.WriteLine($"✅ Delivered to: {result.TopicPartitionOffset}");

            // 🔥 FORCE FLUSH (VERY IMPORTANT)
            _producer.Flush(TimeSpan.FromSeconds(5));
        }

        // ✅ Document Uploaded
        public async Task SendDocumentUploadedEvent(DocumentUploadedEvent evt)
        {
            await SendAsync("document-uploaded", evt);
        }

        // ✅ Document Processed
        public async Task SendDocumentProcessedEvent(DocumentProcessedEvent evt)
        {
            await SendAsync("document-processed", evt);
        }
    }
}