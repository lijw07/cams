using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using cams.Backend.Configuration;
using cams.Backend.Model;
using cams.Backend.View;

namespace cams.Backend.Services
{
    public class AuthenticationService : IAuthenticationService
    {
        private readonly JwtSettings _jwtSettings;
        private readonly ILogger<AuthenticationService> _logger;
        
        // In a real application, this would be replaced with a database context
        private static readonly List<User> _users = new()
        {
            new User
            {
                Id = 1,
                Username = "platformadmin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                Email = "platformadmin@example.com",
                FirstName = "Platform",
                LastName = "Admin",
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            },
            new User
            {
                Id = 2,
                Username = "admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                Email = "admin@example.com",
                FirstName = "Admin",
                LastName = "User",
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            },
            new User
            {
                Id = 3,
                Username = "user",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("user123"),
                Email = "user@example.com",
                FirstName = "Regular",
                LastName = "User",
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            }
        };

        public AuthenticationService(IOptions<JwtSettings> jwtSettings, ILogger<AuthenticationService> logger)
        {
            _jwtSettings = jwtSettings.Value;
            _logger = logger;
        }

        public async Task<LoginResponse?> AuthenticateAsync(LoginRequest request)
        {
            var user = await ValidateUserAsync(request.Username, request.Password);
            
            if (user == null)
            {
                _logger.LogWarning("Authentication failed for user: {Username}", request.Username);
                return null;
            }

            var token = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken();
            
            // Update user's refresh token
            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays);
            user.LastLoginAt = DateTime.UtcNow;

            _logger.LogInformation("User {Username} authenticated successfully", user.Username);

            return new LoginResponse
            {
                Token = token,
                RefreshToken = refreshToken,
                Expiration = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationMinutes),
                Username = user.Username,
                Email = user.Email
            };
        }

        public async Task<User?> ValidateUserAsync(string username, string password)
        {
            await Task.CompletedTask; // Simulate async database operation
            
            var user = _users.FirstOrDefault(u => 
                u.Username.Equals(username, StringComparison.OrdinalIgnoreCase) && 
                u.IsActive);
            
            if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
            {
                return null;
            }

            return user;
        }

        public string GenerateJwtToken(User user)
        {
            var key = Encoding.ASCII.GetBytes(_jwtSettings.Secret);
            var tokenHandler = new JwtSecurityTokenHandler();
            
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationMinutes),
                Issuer = _jwtSettings.Issuer,
                Audience = _jwtSettings.Audience,
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key), 
                    SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        public string GenerateRefreshToken()
        {
            var randomNumber = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }

        public async Task<bool> ValidateRefreshTokenAsync(string username, string refreshToken)
        {
            await Task.CompletedTask; // Simulate async database operation
            
            var user = _users.FirstOrDefault(u => 
                u.Username.Equals(username, StringComparison.OrdinalIgnoreCase));
            
            return user != null && 
                   user.RefreshToken == refreshToken && 
                   user.RefreshTokenExpiryTime > DateTime.UtcNow;
        }

        public async Task<LoginResponse?> RefreshTokenAsync(string username, string refreshToken)
        {
            await Task.CompletedTask; // Simulate async database operation
            
            var user = _users.FirstOrDefault(u => 
                u.Username.Equals(username, StringComparison.OrdinalIgnoreCase));
            
            if (user == null || user.RefreshToken != refreshToken || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
            {
                _logger.LogWarning("Invalid refresh token for user: {Username}", username);
                return null;
            }

            // Generate new tokens
            var newToken = GenerateJwtToken(user);
            var newRefreshToken = GenerateRefreshToken();
            
            // Update user's refresh token
            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays);
            user.LastLoginAt = DateTime.UtcNow;

            _logger.LogInformation("Token refreshed successfully for user: {Username}", username);

            return new LoginResponse
            {
                Token = newToken,
                RefreshToken = newRefreshToken,
                Expiration = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationMinutes),
                Username = user.Username,
                Email = user.Email,
                UserId = user.Id
            };
        }
    }
}