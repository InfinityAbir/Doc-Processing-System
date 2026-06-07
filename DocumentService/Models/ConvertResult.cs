namespace DocumentService.Models
{
    public class ConvertResult
    {
        public string Content { get; set; } = "";
        public List<string> Chunks { get; set; } = new();

        public int OriginalTokens { get; set; }
        public int CleanedTokens { get; set; }

        // 🔥 ANALYTICS
        public int TokensSaved { get; set; }
        public double ReductionPercent { get; set; }

        // 💰 COST (MULTI-MODEL)
        public double EstimatedCostSavedGPT { get; set; }
        public double EstimatedCostSavedClaude { get; set; }

        public int TotalPages { get; set; }
        public int ProcessedBatches { get; set; }
    }
}