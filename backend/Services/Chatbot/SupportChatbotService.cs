using System.Collections.Generic;
using System.Text.Json;
using backend.DTOs.Chatbot;
using backend.Services.AI;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace backend.Services.Chatbot;

public class SupportChatbotService : ISupportChatbotService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IGoogleGeminiService _gemini;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SupportChatbotService> _logger;

    public SupportChatbotService(
        IHttpClientFactory httpClientFactory,
        IGoogleGeminiService gemini,
        IConfiguration configuration,
        ILogger<SupportChatbotService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _gemini = gemini;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<GuestChatbotResponse> ReplyGuestAsync(string message, CancellationToken cancellationToken = default)
    {
        var trimmed = message?.Trim() ?? "";
        if (trimmed.Length == 0)
            return new GuestChatbotResponse { Reply = "Xin hãy nhập câu hỏi.", Source = "template" };

        var template = TryTemplateReply(trimmed);
        if (template != null)
            return new GuestChatbotResponse { Reply = template, Source = "template" };

        var provider = (_configuration["Chatbot:Provider"] ?? "auto").Trim().ToLowerInvariant();
        var hasGeminiKey = _gemini.IsConfigured;
        var hasOpenAiKey = !string.IsNullOrWhiteSpace(_configuration["OpenAI:ApiKey"]);

        if (provider == "gemini" || (provider == "auto" && hasGeminiKey))
        {
            if (!hasGeminiKey)
            {
                return new GuestChatbotResponse { Reply = DefaultNoGeminiReply(), Source = "template" };
            }

            try
            {
                var llm = await _gemini.GenerateAsync(ChatbotSystemPrompt, trimmed, cancellationToken: cancellationToken);
                return new GuestChatbotResponse { Reply = llm, Source = "gemini" };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Chatbot Gemini failed, fallback template");
                var msg = ex.Message.Contains("429", StringComparison.Ordinal) ||
                          ex.Message.Contains("quota", StringComparison.OrdinalIgnoreCase)
                    ? "Gemini đang hết quota (429). Thử lại sau vài phút, hoặc tạo API key mới tại Google AI Studio."
                    : DefaultNoGeminiReply();
                return new GuestChatbotResponse { Reply = msg, Source = "template" };
            }
        }

        if (provider == "openai" || (provider == "auto" && hasOpenAiKey))
        {
            if (!hasOpenAiKey)
            {
                return new GuestChatbotResponse { Reply = DefaultNoLlmReply(), Source = "template" };
            }

            try
            {
                var llm = await CallOpenAiAsync(trimmed, cancellationToken);
                return new GuestChatbotResponse { Reply = llm, Source = "llm" };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Chatbot OpenAI LLM failed, fallback template");
                return new GuestChatbotResponse { Reply = DefaultNoLlmReply(), Source = "template" };
            }
        }

        return new GuestChatbotResponse { Reply = DefaultNoGeminiReply(), Source = "template" };
    }

    private static bool ContainsAny(string t, params string[] needles)
    {
        foreach (var n in needles)
        {
            if (t.Contains(n, StringComparison.Ordinal))
                return true;
        }

        return false;
    }

    private static string? TryTemplateReply(string message)
    {
        var t = message.Trim().ToLowerInvariant();

        if (ContainsAny(t, "xin chào", "chào bạn", "chao ban", "chào anh", "chào chị") ||
            t is "hi" or "hello" or "hey" or "chào" or "chao")
            return "Chào bạn! Mình là chatbot YumeGo-ji. Bạn có thể hỏi về JLPT, bài học (/learn), khu game (/play), chat cộng đồng (/chat) hoặc nâng cấp Premium (/upgrade). Đăng ký miễn phí (/register) để học đầy đủ và nhắn điều hành viên khi cần.";

        if (ContainsAny(t, "đăng ký", "dang ky", "đăng kí", "tao tai khoan", "tạo tài khoản", "sign up", "signup"))
            return "Đăng ký miễn phí: mở trang Đăng ký (/register) hoặc nút trên trang chủ. Sau khi có tài khoản bạn vào Học tập (/learn), làm quiz trong bài, chơi game (/play) và dùng Chat (/chat).";

        if (ContainsAny(t, "đăng nhập", "dang nhap", "login", "log in"))
            return "Đăng nhập: /login. Quên mật khẩu: /forgot-password. Chưa có tài khoản: /register.";

        if (ContainsAny(t, "quên mật", "quen mat", "forgot password", "forgot-password", "reset mật", "quên pass"))
            return "Quên mật khẩu: vào /forgot-password, nhập email đã đăng ký và làm theo hướng dẫn trong email (kiểm tra cả mục spam).";

        if (ContainsAny(t, "điều hành viên", "dieu hanh vien", "moderator", "điều hành", "dieu hanh", "staff hỗ trợ", "nói chuyện với người", "chat với admin"))
            return "Khách (chưa đăng nhập) chỉ trò chuyện với chatbot ở đây. Để nhắn trực tiếp điều hành viên: đăng nhập → mở widget này → bấm \"Mở chat với điều hành viên\" (hoặc vào Dashboard).";

        if (ContainsAny(t, "phòng chat", "phong chat", "chat chung", "chat cộng đồng", "chat cong dong", "kênh chat", "kenh chat") ||
            t.Contains("/chat"))
            return "Chat cộng đồng: menu Chat — đường dẫn /chat (cần đăng nhập). Đó là phòng/kênh chung, khác với chat 1-1 với điều hành viên (chỉ sau đăng nhập, qua nút trong widget hoặc hỗ trợ).";

        if (ContainsAny(t, "jlpt", "lộ trình", "lo trinh", " n5", "n5-", "n5 ", "n4 ", "n3 ", "hiragana", "katakana", "bắt đầu học", "bat dau hoc"))
            return "JLPT là kỳ thi năng lực tiếng Nhật (N5 dễ nhất → N1). Trên YumeGo-ji, vào Học tập (/learn) để theo bài/lộ trình; có thể làm bài kiểm tra đầu vào tại /placement-test (sau đăng nhập) để xem gợi ý mức khởi đầu.";

        if (ContainsAny(t, "bài học", "bai hoc", "khóa học", "khoa hoc", "/learn", "mục học", "muc hoc", "học bài", "hoc bai", "lesson", "course"))
            return "Bài học và khóa: mục Học tập — /learn. Đăng nhập để mở bài đầy đủ, làm quiz và lưu tiến độ. Trang chủ và menu \"Học\" là lối vào nhanh.";

        if (ContainsAny(t, "tiếng nhật", "tieng nhat", "hoc nhat", "học nhật") &&
            !ContainsAny(t, "game", "/play", "premium"))
            return "Học tiếng Nhật trên web: đăng ký (/register) rồi vào /learn theo lộ trình. Khu /play có mini game ôn từ và kanji. Bạn cứ hỏi cụ thể (N5, Hiragana, cách ôn…) — nếu hệ thống chưa bật AI, mình vẫn trả lời theo mẫu hoặc gợi ý đường dẫn.";

        if (ContainsAny(t, "game", "trò chơi", "tro choi", "mini game", "minigame", "/play", "chơi game", "choi game"))
            return "Mini game (từ vựng, kanji, thử thách…): vào khu Play — /play. Thường cần đăng nhập để chơi và ghi điểm. Từ Dashboard cũng có lối tắt tới Play.";

        if (ContainsAny(t, "premium", "nâng cấp", "nang cap", "gói trả phí", "goi tra phi", "thanh toán premium", "/upgrade"))
            return "Nâng cấp Premium: sau khi đăng nhập, mở /upgrade để xem gói, QR thanh toán và trạng thái duyệt (theo quy trình trên trang).";

        if (ContainsAny(t, "placement", "test đầu vào", "test dau vao", "kiểm tra đầu vào", "kiem tra dau vao", "bài test đầu vào"))
            return "Bài kiểm tra đầu vào: /placement-test (dùng sau đăng nhập). Giúp gợi ý mức bắt đầu; không thay cho kỳ thi JLPT chính thức.";

        if (ContainsAny(t, "dashboard", "bảng điều khiển", "bang dieu khien", "trang chủ đăng nhập"))
            return "Dashboard (/dashboard): trang sau đăng nhập — tóm tắt tiến độ, lối tắt tới Học tập, Chat, Play.";

        if (ContainsAny(t, "/account", "tài khoản", "tai khoan", "đổi mật khẩu", "doi mat khau", "hồ sơ", "ho so", "email đăng ký"))
            return "Cài đặt tài khoản: /account (sau đăng nhập). Đổi mật khẩu, thông tin hiển thị — tùy mục app đang bật.";

        if (ContainsAny(t, "cảm ơn", "cam on", "thanks", "thank you"))
            return "Không có chi! Chúc bạn học vui — nếu cần người hỗ trợ, đăng nhập và bấm \"Mở chat với điều hành viên\" nhé.";

        if (ContainsAny(t, "giúp mình", "giup minh", "giúp tôi", "giup toi", "help me", "help") && t.Length < 40)
            return "Bạn thử hỏi gợi ý: JLPT/N5, chỗ học bài (/learn), game (/play), chat (/chat), Premium (/upgrade), quên mật khẩu (/forgot-password). Hoặc gõ câu hỏi cụ thể hơn — nếu bật AI, hệ thống sẽ trả lời chi tiết hơn.";

        return null;
    }

    private static string DefaultNoLlmReply() =>
        "Hiện chưa cấu hình AI (OpenAI:ApiKey). Bạn vẫn hỏi được các chủ đề có sẵn: đăng ký/đăng nhập, /learn, /play, /chat, /upgrade, quên mật khẩu (/forgot-password).";

    private static string DefaultNoGeminiReply() =>
        "Chưa cấu hình Google Gemini (Gemini:ApiKey trong appsettings.Secrets.json). Bạn vẫn hỏi được các chủ đề có sẵn: đăng ký, /learn, /play, /chat, /upgrade.";

    private static string ChatbotSystemPrompt =>
        "Bạn là chatbot hỗ trợ YumeGo-ji (nền tảng học tiếng Nhật cho người Việt). Người hỏi có thể là khách hoặc đã đăng nhập. " +
        "Trả lời ngắn gọn, thân thiện, tiếng Việt; ưu tiên gợi ý đúng tính năng sau (đường dẫn gốc site): " +
        "/register đăng ký; /login đăng nhập; /forgot-password quên mật khẩu; /learn học bài và khóa; /play mini game; " +
        "/chat chat cộng đồng (cần đăng nhập); /dashboard bảng điều khiển; /account tài khoản; /upgrade Premium; /placement-test bài kiểm tra đầu vào. " +
        "Chat 1-1 với điều hành viên: chỉ sau đăng nhập (nút trong widget chat hoặc khu hỗ trợ). " +
        "Không bịa giá, hạn duyệt, hoặc chính sách pháp lý cụ thể. Không cam kết chấm bài hay thay giáo viên. " +
        "Nếu không chắc hoặc hỏi ngoài phạm vi web, gợi đăng ký hoặc liên hệ điều hành viên.";

    private async Task<string> CallOpenAiAsync(string userMessage, CancellationToken cancellationToken)
    {
        var model = _configuration["OpenAI:Model"] ?? "gpt-4o-mini";
        var baseUrl = (_configuration["OpenAI:BaseUrl"] ?? "https://api.openai.com/v1").TrimEnd('/');
        var key = _configuration["OpenAI:ApiKey"]!.Trim();

        var client = _httpClientFactory.CreateClient(nameof(SupportChatbotService));
        client.Timeout = TimeSpan.FromSeconds(90);
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", key);

        var payload = new
        {
            model,
            messages = new object[]
            {
                new { role = "system", content = ChatbotSystemPrompt },
                new { role = "user", content = userMessage }
            }
        };

        var json = JsonSerializer.Serialize(payload, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
        using var req = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/chat/completions")
        {
            Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json")
        };

        var resp = await client.SendAsync(req, cancellationToken);
        var respBody = await resp.Content.ReadAsStringAsync(cancellationToken);
        if (!resp.IsSuccessStatusCode)
        {
            _logger.LogWarning("Chatbot OpenAI-compatible error {Status}: {Body}", resp.StatusCode, respBody);
            throw new InvalidOperationException($"LLM HTTP {(int)resp.StatusCode}");
        }

        using var doc = JsonDocument.Parse(respBody);
        var content = doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString();

        if (string.IsNullOrWhiteSpace(content))
            throw new InvalidOperationException("Empty LLM content");

        return content.Trim();
    }
}
