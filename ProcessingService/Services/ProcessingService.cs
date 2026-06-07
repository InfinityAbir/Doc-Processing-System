namespace ProcessingService.Services
{
    public class FileProcessingService
    {
        public string Process(string filePath)
        {
            // For now simple logic
            return $"Processed file: {filePath}";
        }
    }
}