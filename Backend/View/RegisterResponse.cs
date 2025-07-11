namespace cams.Backend.View;

public class RegisterResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public UserProfileResponse? User { get; set; }
    public DateTime CreatedAt { get; set; }
}