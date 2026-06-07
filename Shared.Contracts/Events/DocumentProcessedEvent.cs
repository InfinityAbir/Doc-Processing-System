namespace Shared.Contracts.Events
{
    public class DocumentProcessedEvent
    {
        public string FileName { get; set; }   // ✅ FIXED
        public string Status { get; set; }     // ✅ FIXED
        public string Content { get; set; }
    }
}