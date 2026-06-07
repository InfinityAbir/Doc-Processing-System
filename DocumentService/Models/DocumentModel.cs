namespace DocumentService.Models
{
    public class DocumentModel
    {
        public string FileName { get; set; }          // ✅ Original file name (for UI)

        public string Status { get; set; }            // Processing / Completed / Failed

        public string Content { get; set; }           // 🔥 Markdown content (VERY IMPORTANT)

        public DateTime UploadedAt { get; set; }      // When file was uploaded

        public DateTime? UpdatedAt { get; set; }      // When processing finished
    }
}