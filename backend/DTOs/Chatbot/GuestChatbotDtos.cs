namespace backend.DTOs.Chatbot;

/// <summary>Tin nhắn từ khách (hoặc user đã đăng nhập dùng chatbot) — tách khỏi module AI sinh bài.</summary>
public class GuestChatbotRequest
{
    public string? Message { get; set; }
}

/// <summary>Phản hồi chatbot.</summary>
public class GuestChatbotResponse
{
    public string Reply { get; set; } = "";
    /// <summary>gemini | llm (OpenAI) | ollama | template (câu có sẵn)</summary>
    public string Source { get; set; } = "template";
}
