using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace backend.Services.AI;

public interface IGoogleGeminiService
{
    bool IsConfigured { get; }

    Task<string> GenerateAsync(
        string systemPrompt,
        string userMessage,
        string? model = null,
        bool jsonMode = false,
        CancellationToken cancellationToken = default);

    Task<string> GenerateChatAsync(
        string systemPrompt,
        IReadOnlyList<GeminiChatMessage> messages,
        IReadOnlyList<GeminiImagePart>? images = null,
        string? model = null,
        bool jsonMode = false,
        CancellationToken cancellationToken = default);
}

public sealed class GeminiChatMessage
{
    public required string Role { get; init; }
    public required string Content { get; init; }
}

public sealed class GeminiImagePart
{
    public required string MimeType { get; init; }
    public required string Base64Data { get; init; }
}

public class GoogleGeminiService : IGoogleGeminiService
{
    private readonly IHttpClientFactory _httpFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GoogleGeminiService> _logger;

    public GoogleGeminiService(
        IHttpClientFactory httpFactory,
        IConfiguration configuration,
        ILogger<GoogleGeminiService> logger)
    {
        _httpFactory = httpFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(ResolveApiKey());

    public Task<string> GenerateAsync(
        string systemPrompt,
        string userMessage,
        string? model = null,
        bool jsonMode = false,
        CancellationToken cancellationToken = default)
    {
        return GenerateChatAsync(
            systemPrompt,
            new[] { new GeminiChatMessage { Role = "user", Content = userMessage } },
            null,
            model,
            jsonMode,
            cancellationToken);
    }

    public async Task<string> GenerateChatAsync(
        string systemPrompt,
        IReadOnlyList<GeminiChatMessage> messages,
        IReadOnlyList<GeminiImagePart>? images = null,
        string? model = null,
        bool jsonMode = false,
        CancellationToken cancellationToken = default)
    {
        var apiKey = ResolveApiKey();
        if (string.IsNullOrWhiteSpace(apiKey))
            throw new InvalidOperationException("Chưa cấu hình Gemini:ApiKey (appsettings.Secrets.json).");

        model ??= ResolveChatModel();
        var baseUrl = ResolveBaseUrl();
        var url = $"{baseUrl}/models/{Uri.EscapeDataString(model)}:generateContent?key={Uri.EscapeDataString(apiKey)}";

        var contents = BuildContents(messages, images);
        var payload = new Dictionary<string, object?>
        {
            ["systemInstruction"] = new Dictionary<string, object?>
            {
                ["parts"] = new object[] { new Dictionary<string, string> { ["text"] = systemPrompt } }
            },
            ["contents"] = contents
        };

        if (jsonMode)
        {
            payload["generationConfig"] = new Dictionary<string, object?>
            {
                ["responseMimeType"] = "application/json"
            };
        }

        var client = _httpFactory.CreateClient(nameof(GoogleGeminiService));
        client.Timeout = TimeSpan.FromMinutes(6);

        using var content = new StringContent(
            JsonSerializer.Serialize(payload, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }),
            Encoding.UTF8,
            "application/json");

        HttpResponseMessage resp;
        try
        {
            resp = await client.PostAsync(url, content, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Gemini HTTP failed");
            throw new InvalidOperationException("Không kết nối được Google Gemini. Kiểm tra mạng và Gemini:ApiKey.", ex);
        }

        using (resp)
        {
            var body = await resp.Content.ReadAsStringAsync(cancellationToken);
            if (!resp.IsSuccessStatusCode)
            {
                _logger.LogWarning("Gemini HTTP {Status}: {Body}", (int)resp.StatusCode, body.Length > 800 ? body[..800] : body);
                if ((int)resp.StatusCode == 429)
                {
                    throw new InvalidOperationException(
                        "Google Gemini hết quota free tier (429). Đợi vài phút hoặc tạo API key mới tại https://aistudio.google.com/apikey và cập nhật Gemini:ApiKey.");
                }

                throw new InvalidOperationException(
                    $"Google Gemini trả lỗi HTTP {(int)resp.StatusCode}. Kiểm tra ApiKey và model ({model}).");
            }

            return ExtractText(body);
        }
    }

    private string ResolveApiKey() => _configuration["Gemini:ApiKey"]?.Trim() ?? "";

    private string ResolveBaseUrl() =>
        (_configuration["Gemini:BaseUrl"] ?? "https://generativelanguage.googleapis.com/v1beta").TrimEnd('/');

    private string ResolveChatModel() =>
        _configuration["Gemini:ChatModel"]?.Trim() ?? "gemini-2.0-flash";

    private static List<Dictionary<string, object?>> BuildContents(
        IReadOnlyList<GeminiChatMessage> messages,
        IReadOnlyList<GeminiImagePart>? images)
    {
        var contents = new List<Dictionary<string, object?>>();
        var imageList = images ?? Array.Empty<GeminiImagePart>();
        var imageAttached = false;

        for (var i = 0; i < messages.Count; i++)
        {
            var m = messages[i];
            var geminiRole = m.Role.Equals("assistant", StringComparison.OrdinalIgnoreCase) ? "model" : "user";
            if (geminiRole != "user")
            {
                contents.Add(new Dictionary<string, object?>
                {
                    ["role"] = geminiRole,
                    ["parts"] = new object[] { new Dictionary<string, string> { ["text"] = m.Content.Trim() } }
                });
                continue;
            }

            var parts = new List<object> { new Dictionary<string, string> { ["text"] = m.Content.Trim() } };
            var isLastUser = i == messages.Count - 1 ||
                             !messages.Skip(i + 1).Any(x => x.Role.Equals("user", StringComparison.OrdinalIgnoreCase));

            if (!imageAttached && isLastUser && imageList.Count > 0)
            {
                foreach (var img in imageList)
                {
                    parts.Add(new Dictionary<string, object?>
                    {
                        ["inline_data"] = new Dictionary<string, string>
                        {
                            ["mime_type"] = img.MimeType,
                            ["data"] = img.Base64Data
                        }
                    });
                }

                imageAttached = true;
            }

            contents.Add(new Dictionary<string, object?>
            {
                ["role"] = "user",
                ["parts"] = parts
            });
        }

        return contents;
    }

    private static string ExtractText(string body)
    {
        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        if (root.TryGetProperty("promptFeedback", out var feedback) &&
            feedback.TryGetProperty("blockReason", out var blockReason))
        {
            throw new InvalidOperationException($"Gemini chặn prompt: {blockReason.GetString()}");
        }

        if (!root.TryGetProperty("candidates", out var candidates) || candidates.GetArrayLength() == 0)
            throw new InvalidOperationException("Gemini không trả candidate.");

        var first = candidates[0];
        if (!first.TryGetProperty("content", out var contentEl) ||
            !contentEl.TryGetProperty("parts", out var partsEl) ||
            partsEl.GetArrayLength() == 0)
            throw new InvalidOperationException("Gemini trả về rỗng.");

        var sb = new StringBuilder();
        foreach (var part in partsEl.EnumerateArray())
        {
            if (part.TryGetProperty("text", out var textEl))
            {
                var t = textEl.GetString();
                if (!string.IsNullOrEmpty(t))
                    sb.Append(t);
            }
        }

        var result = sb.ToString().Trim();
        if (string.IsNullOrEmpty(result))
            throw new InvalidOperationException("Gemini trả về rỗng.");

        return result;
    }
}
