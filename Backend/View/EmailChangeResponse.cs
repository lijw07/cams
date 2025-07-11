namespace cams.Backend.View;

public class EmailChangeResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? NewEmail { get; set; }
    public DateTime ChangedAt { get; set; }
    public bool RequiresVerification { get; set; }
}