using DocumentService.Models;

namespace DocumentService.Services
{
    public static class DocumentStore
    {
        private static readonly List<DocumentModel> _documents = new();

        // 🔥 GET ALL DOCUMENTS
        public static List<DocumentModel> GetAll()
        {
            return _documents;
        }

        // 🔥 ADD NEW DOCUMENT
        public static void Add(DocumentModel doc)
        {
            _documents.Add(doc);
        }

        // 🔥 UPDATE FULL DOCUMENT (USED AFTER PROCESSING)
        public static void Update(DocumentModel updatedDoc)
        {
            var doc = _documents.FirstOrDefault(d =>
                d.FileName.Trim().ToLower() == updatedDoc.FileName.Trim().ToLower());

            if (doc != null)
            {
                doc.Status = updatedDoc.Status;
                doc.Content = updatedDoc.Content;
                doc.UpdatedAt = DateTime.UtcNow;
            }
        }

        // 🔥 UPDATE ONLY STATUS (OPTIONAL USE)
        public static void UpdateStatus(string fileName, string status)
        {
            var doc = _documents.FirstOrDefault(d =>
                d.FileName.Trim().ToLower() == fileName.Trim().ToLower());

            if (doc != null)
            {
                doc.Status = status;
                doc.UpdatedAt = DateTime.UtcNow;
            }
        }

        // 🔥 UPDATE CONTENT ONLY (OPTIONAL)
        public static void UpdateContent(string fileName, string content)
        {
            var doc = _documents.FirstOrDefault(d =>
                d.FileName.Trim().ToLower() == fileName.Trim().ToLower());

            if (doc != null)
            {
                doc.Content = content;
                doc.UpdatedAt = DateTime.UtcNow;
            }
        }
    }
}