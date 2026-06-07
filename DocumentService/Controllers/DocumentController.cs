using Microsoft.AspNetCore.Mvc;
using DocumentService.Services;
using Shared.Contracts.Events;
using DocumentService.Models;
using Shared.Kafka;

[ApiController]
[Route("api/documents")]
public class DocumentController : ControllerBase
{
    private readonly FileService _fileService;
    private readonly KafkaProducer _kafkaProducer;

    public DocumentController(FileService fileService, KafkaProducer kafkaProducer)
    {
        _fileService = fileService;
        _kafkaProducer = kafkaProducer;
    }

    // 🔥 UPLOAD DOCUMENT
    [HttpPost]
    public async Task<IActionResult> Upload([FromForm] DocumentRequest request)
    {
        if (request.File == null)
            return BadRequest("No file uploaded");

        // ✅ Save file
        var fileResult = await _fileService.SaveFileAsync(request.File);

        var filePath = fileResult.FilePath;

        // 🔥 IMPORTANT: use ORIGINAL name (not GUID)
        var originalFileName = request.File.FileName;

        // ✅ Add to in-memory store
        DocumentStore.Add(new DocumentModel
        {
            FileName = originalFileName, // ✅ FIXED
            Status = "Processing",
            Content = null, // initially empty
            UploadedAt = DateTime.UtcNow
        });

        // 🔥 Send Kafka event
        var eventMessage = new DocumentUploadedEvent
        {
            FileName = originalFileName, // ✅ send original name
            FilePath = filePath,
            UploadedAt = DateTime.UtcNow
        };

        await _kafkaProducer.SendDocumentUploadedEvent(eventMessage);

        return Ok(new
        {
            message = "File uploaded and sent to processing",
            fileName = originalFileName
        });
    }

    // 🔥 GET ALL DOCUMENTS (FOR FRONTEND)
    [HttpGet]
    public IActionResult GetAll()
    {
        var docs = DocumentStore.GetAll();

        // 🔥 IMPORTANT: include content
        var result = docs.Select(d => new
        {
            fileName = d.FileName,
            status = d.Status,
            content = d.Content, // ✅ FIXED (this enables download)
            uploadedAt = d.UploadedAt,
            updatedAt = d.UpdatedAt
        });

        return Ok(result);
    }
}