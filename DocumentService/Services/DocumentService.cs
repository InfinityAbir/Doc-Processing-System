using Microsoft.AspNetCore.Http;
using DocumentService.Services;
using Shared.Contracts.Events;
using Shared.Kafka;

namespace DocumentService.Services
{
    public class DocumentService
    {
        private readonly FileService _fileService;
        private readonly ConversionService _conversionService;
        private readonly KafkaProducer _kafkaProducer;

        public DocumentService(
            FileService fileService,
            ConversionService conversionService,
            KafkaProducer kafkaProducer)
        {
            _fileService = fileService;
            _conversionService = conversionService;
            _kafkaProducer = kafkaProducer;
        }

        public async Task ProcessDocumentAsync(IFormFile file)
        {
            // ✅ 1. Save file
            var fileResult = await _fileService.SaveFileAsync(file);

            // ❌ DO NOT CONVERT HERE (this is ProcessingService job)

            // ✅ 2. Send UPLOAD event
            var evt = new DocumentUploadedEvent
            {
                FileName = file.FileName,
                FilePath = fileResult.FilePath,
                UploadedAt = DateTime.UtcNow
            };

            await _kafkaProducer.SendDocumentUploadedEvent(evt);

            Console.WriteLine("📤 Sent document-uploaded event");
        }
    }
}