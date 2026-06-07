using Microsoft.AspNetCore.Http;

namespace DocumentService.Services
{
    public class FileService
    {
        private readonly string _uploadPath;

        public FileService()
        {
            _uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");

            if (!Directory.Exists(_uploadPath))
                Directory.CreateDirectory(_uploadPath);
        }

        public async Task<(string FilePath, string FileName, string Extension)> SaveFileAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
                throw new Exception("Invalid file");

            var extension = Path.GetExtension(file.FileName).ToLower();

            // 🔥 Supported document types
            var allowedExtensions = new[]
            {
                ".pdf", ".docx", ".xlsx", ".pptx",
                ".txt", ".md", ".html", ".rtf",
                ".csv", ".odt"
            };

            if (!allowedExtensions.Contains(extension))
                throw new Exception($"Unsupported file type: {extension}");

            // 🔥 Unique filename
            var uniqueFileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(_uploadPath, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return (filePath, uniqueFileName, extension);
        }
    }
}