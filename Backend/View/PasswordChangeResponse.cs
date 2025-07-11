namespace cams.Backend.View;

public class PasswordChangeResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; }
}