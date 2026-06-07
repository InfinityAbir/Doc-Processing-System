using Microsoft.AspNetCore.Http;
using System.Diagnostics;
using System.Text;
using System.Text.RegularExpressions;
using DocumentService.Models;

namespace DocumentService.Services
{
    public class ConversionService
    {
        private readonly string _uploadPath;

        public ConversionService()
        {
            _uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");

            if (!Directory.Exists(_uploadPath))
                Directory.CreateDirectory(_uploadPath);
        }

        public async Task<ConvertResult> ConvertToMarkdownAsync(string filePath, string extension, bool enableAICompression = true)
        {
            extension = extension.ToLower();

            if (extension == ".pdf")
                return await ConvertPdfAsync(filePath, enableAICompression);

            var pandocSupported = new[]
            {
                ".docx", ".xlsx", ".pptx",
                ".txt", ".md", ".html",
                ".rtf", ".csv", ".odt"
            };

            if (pandocSupported.Contains(extension))
                return await ConvertWithPandocAsync(filePath, enableAICompression);

            throw new Exception($"Unsupported file type: {extension}");
        }

        // ================= PDF =================

        private async Task<ConvertResult> ConvertPdfAsync(string inputPath, bool enableAICompression)
        {
            int totalPages = await GetTotalPages(inputPath);
            int batchSize = 10;

            var finalBuilder = new StringBuilder();
            int originalTokens = 0;

            for (int i = 1; i <= totalPages; i += batchSize)
            {
                int end = Math.Min(i + batchSize - 1, totalPages);

                string extractedText = await ExtractPages(inputPath, i, end);

                originalTokens += CountTokens(extractedText);

                string cleaned = CleanText(extractedText);

                if (enableAICompression)
                    cleaned = AICompress(cleaned);

                finalBuilder.AppendLine(cleaned);
                finalBuilder.AppendLine();
            }

            string finalContent = finalBuilder.ToString().Trim();
            int cleanedTokens = CountTokens(finalContent);

            // 🔥 COST CALCULATION
            var (tokensSaved, reductionPercent, gptCost, claudeCost) =
                CalculateCost(originalTokens, cleanedTokens);

            return new ConvertResult
            {
                Content = finalContent,
                Chunks = ChunkText(finalContent, 300),

                OriginalTokens = originalTokens,
                CleanedTokens = cleanedTokens,

                TokensSaved = tokensSaved,
                ReductionPercent = reductionPercent,
                EstimatedCostSavedGPT = gptCost,
                EstimatedCostSavedClaude = claudeCost,

                TotalPages = totalPages,
                ProcessedBatches = (int)Math.Ceiling((double)totalPages / batchSize)
            };
        }

        // ================= PANDOC =================

        private async Task<ConvertResult> ConvertWithPandocAsync(string inputPath, bool enableAICompression)
        {
            string outputPath = Path.ChangeExtension(inputPath, ".md");

            var process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = "pandoc",
                    Arguments = $"-f docx -t gfm \"{inputPath}\" -o \"{outputPath}\"",
                    RedirectStandardError = true,
                    RedirectStandardOutput = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                }
            };

            process.Start();

            await process.StandardOutput.ReadToEndAsync();
            await process.StandardError.ReadToEndAsync();

            await process.WaitForExitAsync();

            if (!File.Exists(outputPath))
                throw new Exception("Pandoc failed: No output file");

            var content = await File.ReadAllTextAsync(outputPath);

            if (content.StartsWith("PK"))
                throw new Exception("Invalid conversion: DOCX binary detected");

            int originalTokens = CountTokens(content);

            content = CleanText(content);

            if (enableAICompression)
                content = AICompress(content);

            int cleanedTokens = CountTokens(content);

            // 🔥 COST CALCULATION
            var (tokensSaved, reductionPercent, gptCost, claudeCost) =
                CalculateCost(originalTokens, cleanedTokens);

            return new ConvertResult
            {
                Content = content,
                Chunks = ChunkText(content, 300),

                OriginalTokens = originalTokens,
                CleanedTokens = cleanedTokens,

                TokensSaved = tokensSaved,
                ReductionPercent = reductionPercent,
                EstimatedCostSavedGPT = gptCost,
                EstimatedCostSavedClaude = claudeCost,

                TotalPages = 1,
                ProcessedBatches = 1
            };
        }

        // ================= COST LOGIC =================

        private (int tokensSaved, double reductionPercent, double gptCost, double claudeCost)
            CalculateCost(int originalTokens, int cleanedTokens)
        {
            int tokensSaved = originalTokens - cleanedTokens;

            double reductionPercent = originalTokens == 0
                ? 0
                : Math.Round((double)tokensSaved / originalTokens * 100, 2);

            // 💰 Pricing (approx)
            double gptCostPer1K = 0.03;     // GPT-4
            double claudeCostPer1K = 0.015; // Claude (cheaper)

            double gptCost = Math.Round((tokensSaved / 1000.0) * gptCostPer1K, 4);
            double claudeCost = Math.Round((tokensSaved / 1000.0) * claudeCostPer1K, 4);

            return (tokensSaved, reductionPercent, gptCost, claudeCost);
        }

        // ================= EXISTING =================

        private async Task<int> GetTotalPages(string filePath)
        {
            var process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = "pdfinfo",
                    Arguments = $"\"{filePath}\"",
                    RedirectStandardOutput = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                }
            };

            process.Start();
            string output = await process.StandardOutput.ReadToEndAsync();
            await process.WaitForExitAsync();

            var match = Regex.Match(output, @"Pages:\s+(\d+)");
            if (!match.Success)
                throw new Exception("Could not determine total pages.");

            return int.Parse(match.Groups[1].Value);
        }

        private async Task<string> ExtractPages(string filePath, int start, int end)
        {
            string tempFile = Path.Combine(_uploadPath, $"{Guid.NewGuid()}.txt");

            var process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = "pdftotext",
                    Arguments = $"-f {start} -l {end} \"{filePath}\" \"{tempFile}\"",
                    UseShellExecute = false,
                    CreateNoWindow = true
                }
            };

            process.Start();
            await process.WaitForExitAsync();

            if (!File.Exists(tempFile))
                return "";

            string text = await File.ReadAllTextAsync(tempFile);
            File.Delete(tempFile);

            return text;
        }

        private string CleanText(string content)
        {
            content = content.Replace("\r\n", "\n");
            content = Regex.Replace(content, @"[ \t]+", " ");
            content = Regex.Replace(content, @"\n{3,}", "\n\n");

            content = Regex.Replace(content, @"\bPage\s+\d+\b", "", RegexOptions.IgnoreCase);
            content = Regex.Replace(content, @"(?i)references[\s\S]*$", "");

            return content.Trim();
        }

        private string AICompress(string content)
        {
            content = Regex.Replace(content,
                @"\b(very|really|basically|actually|in order to)\b",
                "",
                RegexOptions.IgnoreCase);

            return content;
        }

        private int CountTokens(string text)
        {
            return text.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;
        }

        private List<string> ChunkText(string text, int size)
        {
            var words = text.Split(' ');
            var chunks = new List<string>();

            for (int i = 0; i < words.Length; i += size)
            {
                chunks.Add(string.Join(" ", words.Skip(i).Take(size)));
            }

            return chunks;
        }
    }
}