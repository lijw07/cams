namespace cams.Backend.View
{
    public class RefreshTokenRequest
    {
        public string Username { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
    }
}