using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using backend.DTOs.Learning;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace backend.Services.AI;

public class LearnOllamaAssistantService : ILearnOllamaAssistantService
{
    private const int MaxMessages = 24;
    private const int MaxContentLength = 65000;
    private const int MaxImages = 4;
    private const int MaxImageBase64Length = 2_500_000;

    private static readonly string SystemPrompt =
        "Bạn là \"AI dùm tôi\" — trợ lý học tiếng Nhật trong ứng dụng Yumegoji. " +
        "Trả lời bằng tiếng Việt (trừ khi người dùng yêu cầu ví dụ tiếng Nhật). " +
        "Giải thích rõ ràng, ngắn gọn khi có thể; nếu có ảnh chụp bài tập, tài liệu hoặc kanji, hãy đọc và phân tích nội dung. " +
        "Không bịa đặt nguồn; nếu không đọc được ảnh, hãy nói thẳng.";

    private readonly IGoogleGeminiService _gemini;
    private readonly IConfiguration _configuration;
    private readonly ILogger<LearnOllamaAssistantService> _logger;

    public LearnOllamaAssistantService(
        IGoogleGeminiService gemini,
        IConfiguration configuration,
        ILogger<LearnOllamaAssistantService> logger)
    {
        _gemini = gemini;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<LearnAiChatResponse> ChatAsync(LearnAiChatRequest request, CancellationToken cancellationToken = default)
    {
        if (request.Messages == null || request.Messages.Count == 0)
            throw new ArgumentException("Cần ít nhất một tin nhắn.");

        if (request.Messages.Count > MaxMessages)
            throw new ArgumentException($"Tối đa {MaxMessages} tin nhắn mỗi lần gửi.");

        foreach (var m in request.Messages)
        {
            if (string.IsNullOrWhiteSpace(m.Role) || string.IsNullOrWhiteSpace(m.Content))
                throw new ArgumentException("Mỗi tin nhắn cần role và nội dung.");
            if (m.Content.Length > MaxContentLength)
                throw new ArgumentException($"Nội dung một tin nhắn tối đa {MaxContentLength} ký tự.");
        }

        var images = request.ImagesBase64 ?? new List<string>();
        if (images.Count > MaxImages)
            throw new ArgumentException($"Tối đa {MaxImages} ảnh mỗi lần.");

        foreach (var img in images)
        {
            if (string.IsNullOrWhiteSpace(img) || img.Length > MaxImageBase64Length)
                throw new ArgumentException("Ảnh base64 không hợp lệ hoặc quá lớn.");
        }

        if (!_gemini.IsConfigured)
            throw new InvalidOperationException("Chưa cấu hình Gemini:ApiKey trong appsettings.Secrets.json.");

        var textModel = _configuration["Gemini:ChatModel"] ?? "gemini-2.0-flash";
        var visionModel = _configuration["Gemini:VisionModel"] ?? textModel;
        var model = images.Count > 0 ? visionModel : textModel;

        var chatMessages = request.Messages
            .Where(m => !string.Equals(m.Role, "system", StringComparison.OrdinalIgnoreCase))
            .Select(m => new GeminiChatMessage { Role = m.Role, Content = m.Content.Trim() })
            .ToList();

        var imageParts = images.Select(ParseImagePart).Where(x => x != null).Cast<GeminiImagePart>().ToList();

        try
        {
            var messageText = await _gemini.GenerateChatAsync(
                SystemPrompt,
                chatMessages,
                imageParts.Count > 0 ? imageParts : null,
                model,
                cancellationToken: cancellationToken);

            return new LearnAiChatResponse
            {
                Message = string.IsNullOrWhiteSpace(messageText) ? "(Không có nội dung trả về)" : messageText.Trim(),
                Model = model
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Learn AI Gemini failed");
            throw new InvalidOperationException(
                "Không gọi được Google Gemini. Kiểm tra Gemini:ApiKey và model.", ex);
        }
    }

    private static GeminiImagePart? ParseImagePart(string raw)
    {
        var s = raw.Trim();
        var mime = "image/jpeg";
        var data = s;

        if (s.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
        {
            var semi = s.IndexOf(';');
            var comma = s.IndexOf("base64,", StringComparison.OrdinalIgnoreCase);
            if (semi > 5 && comma > semi)
            {
                mime = s[5..semi];
                data = s[(comma + 7)..];
            }
            else if (comma >= 0)
            {
                data = s[(comma + 7)..];
            }
        }

        if (string.IsNullOrWhiteSpace(data))
            return null;

        return new GeminiImagePart { MimeType = mime, Base64Data = data };
    }
}
