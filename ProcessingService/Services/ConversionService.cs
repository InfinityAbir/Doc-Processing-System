using System.Text;
using System.Diagnostics;
using System.IO;
using System.Text.RegularExpressions;
using System.IO.Compression;

namespace ProcessingService.Services
{
    public class ConversionService
    {
        public async Task<ConvertResult> ConvertToMarkdownAsync(
            string filePath,
            string extension,
            bool enableAI = false)
        {
            if (!File.Exists(filePath))
                throw new Exception("File not found");

            extension = extension.ToLower();
            string content = "";

            if (extension == ".pdf")
                content = await ExtractPdfText(filePath);
            else if (extension == ".docx")
                content = ExtractDocxText(filePath);
            else if (extension == ".txt" || extension == ".md" || extension == ".csv")
                content = await File.ReadAllTextAsync(filePath);
            else
                throw new Exception($"Unsupported file type: {extension}");

            var originalLength = content.Length;

            content = CleanText(content);
            content = NormalizeBrokenLines(content);
            content = FormatMarkdown(content);

            var markdown = new StringBuilder();
            markdown.AppendLine("# Converted Document\n");
            markdown.AppendLine(content);

            return new ConvertResult
            {
                Content = markdown.ToString(),
                Chunks = new List<string> { content },
                OriginalTokens = originalLength,
                CleanedTokens = content.Length,
                TotalPages = EstimatePages(content),
                ProcessedBatches = 1
            };
        }

        // ================= PDF =================
        private async Task<string> ExtractPdfText(string filePath)
        {
            string tempFile = Path.GetTempFileName();

            var process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = "pdftotext",
                    Arguments = $"-layout \"{filePath}\" \"{tempFile}\"",
                    UseShellExecute = false,
                    CreateNoWindow = true
                }
            };

            process.Start();
            await process.WaitForExitAsync();

            var text = await File.ReadAllTextAsync(tempFile);
            File.Delete(tempFile);

            return text;
        }

        // ================= DOCX =================
        private string ExtractDocxText(string filePath)
        {
            try
            {
                using var archive = ZipFile.OpenRead(filePath);
                var entry = archive.GetEntry("word/document.xml");

                if (entry == null) return "";

                using var reader = new StreamReader(entry.Open());
                var xml = reader.ReadToEnd();

                xml = xml.Replace("</w:p>", "\n");

                var text = Regex.Replace(xml, "<.*?>", " ");
                text = Regex.Replace(text, @"[ \t]+", " ");

                return text;
            }
            catch
            {
                return "";
            }
        }

        // ================= CLEAN =================
        private string CleanText(string content)
        {
            content = content.Replace("\r\n", "\n");

            content = Regex.Replace(content, @"[ \t]+", " ");
            content = Regex.Replace(content, @"\n{3,}", "\n\n");

            content = Regex.Replace(content, @"\bPage\s+\d+\b", "", RegexOptions.IgnoreCase);

            return content.Trim();
        }

        // ================= NORMALIZE BROKEN LINES =================
        private string NormalizeBrokenLines(string content)
        {
            // Split big collapsed text into logical lines
            // BUT: Don't split if preceded by a dot (URL protection)
            content = Regex.Replace(content, @"(?<!\.)(?=\b(git|python|pip|npm|node|env|docker|kubectl)\b)", "\n");
            content = Regex.Replace(content, @"(?<=:)\s+", "\n"); // after headings
            content = Regex.Replace(content, @"(?<=\.)\s+(?=[A-Z])", "\n");

            return content;
        }

        // ================= FORMAT MARKDOWN (UNIFIED ENGINE) =================
        private string FormatMarkdown(string content)
        {
            var lines = content.Split('\n');
            var builder = new StringBuilder();

            var codeBuffer = new List<string>();
            bool inCode = false;

            foreach (var raw in lines)
            {
                var line = raw.Trim();

                // ===== FILTER NOISE =====
                if (string.IsNullOrWhiteSpace(line))
                {
                    // If in code block, skip empty lines (don't break grouping)
                    // Otherwise, output empty line
                    if (!inCode)
                        builder.AppendLine();
                    continue;
                }

                // Ignore standalone noise (too short, or just a keyword)
                if (line.Length < 3 || (line.Length < 10 && IsStandaloneKeyword(line)))
                {
                    continue;
                }

                // ===== COMMAND DETECTION =====
                if (IsCommand(line))
                {
                    inCode = true;
                    codeBuffer.Add(line);
                    continue;
                }
                else
                {
                    // Non-command line → flush accumulated commands
                    FlushCode(builder, codeBuffer, ref inCode);
                }

                // ===== HEADING =====
                if (IsHeading(line))
                {
                    builder.AppendLine($"\n## {CleanHeading(line)}\n");
                    continue;
                }

                // ===== BULLET LIST =====
                if (Regex.IsMatch(line, @"^[-*•]\s"))
                {
                    builder.AppendLine($"- {line.Substring(1).Trim()}");
                    continue;
                }

                // ===== NUMBERED LIST =====
                if (Regex.IsMatch(line, @"^\d+\.\s"))
                {
                    builder.AppendLine(line);
                    continue;
                }

                // ===== NORMAL TEXT =====
                builder.AppendLine(line);
            }

            // Final flush
            FlushCode(builder, codeBuffer, ref inCode);

            return builder.ToString();
        }

        // ================= COMMAND DETECTION =================
        private bool IsCommand(string line)
        {
            // Safe regex: matches git, python, pip, npm, node, docker, kubectl, env vars, etc.
            return Regex.IsMatch(line, @"\b(git|python|pip|npm|node|docker|kubectl|env|bash|sh|npm|cargo|make|gcc|clang|yarn|ruby|go|rust|java|dotnet|az|aws|gcloud|terraform|ansible)\b", RegexOptions.IgnoreCase);
        }

        private bool IsStandaloneKeyword(string line)
        {
            // Single keyword with no arguments
            return Regex.IsMatch(line, @"^(git|python|pip|npm|node|docker|kubectl|env|bash)$", RegexOptions.IgnoreCase);
        }

        private void FlushCode(StringBuilder builder, List<string> buffer, ref bool inCode)
        {
            if (!inCode || buffer.Count == 0) return;

            string lang = DetectLanguage(buffer);

            builder.AppendLine($"```{lang}");
            foreach (var line in buffer)
                builder.AppendLine(line);
            builder.AppendLine("```");
            builder.AppendLine();

            buffer.Clear();
            inCode = false;
        }

        private string DetectLanguage(List<string> lines)
        {
            // Detect Python
            if (lines.Any(l => l.Contains("python") || l.Contains("manage.py") || l.Contains("pip install") || l.Contains("venv")))
                return "python";

            // Detect Docker
            if (lines.Any(l => l.Contains("docker")))
                return "dockerfile";

            // Default to bash
            return "bash";
        }

        private bool IsHeading(string line)
        {
            // Line ends with colon, or is short + capitalized + not a command
            return (line.EndsWith(":") && !IsCommand(line)) ||
                   (line.Length < 60 &&
                    char.IsUpper(line[0]) &&
                    !IsCommand(line) &&
                    !line.Contains("://") && // not a URL
                    line.Count(c => c == ' ') >= 2); // at least 2-3 words
        }

        private string CleanHeading(string line)
        {
            return line.TrimEnd(':').Trim();
        }

        private int EstimatePages(string content)
        {
            var words = content.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;
            return Math.Max(1, words / 800);
        }
    }

    public class ConvertResult
    {
        public string Content { get; set; } = "";
        public List<string> Chunks { get; set; } = new();
        public int OriginalTokens { get; set; }
        public int CleanedTokens { get; set; }
        public int TotalPages { get; set; }
        public int ProcessedBatches { get; set; }
    }
}