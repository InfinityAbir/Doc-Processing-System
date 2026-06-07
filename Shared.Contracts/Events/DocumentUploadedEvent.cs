namespace Shared.Contracts.Events
{
    public class DocumentUploadedEvent
    {
        public string FilePath { get; set; }
        public DateTime UploadedAt { get; set; }
        public string FileName { get; set; }
        public string Status { get; set; }
    }
}