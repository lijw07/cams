using cams.Backend.Model;
using cams.Backend.View;

namespace cams.Backend.Services
{
    public interface IAuthenticationService
    {
        Task<LoginResponse?> AuthenticateAsync(LoginRequest request);
        Task<User?> ValidateUserAsync(string username, string password);
        Task<RegisterResponse?> RegisterAsync(RegisterRequest request);
        string GenerateJwtToken(User user);
        string GenerateRefreshToken();
        Task<bool> ValidateRefreshTokenAsync(string username, string refreshToken);
        Task<LoginResponse?> RefreshTokenAsync(string username, string refreshToken);
    }
}