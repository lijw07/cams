using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using cams.Backend.Configuration;
using cams.Backend.Model;
using cams.Backend.View;
using cams.Backend.Data;
using cams.Backend.Mappers;
using Backend.Helpers;

namespace cams.Backend.Services
{
    public class AuthenticationService(
        IOptions<JwtSettings> jwtSettings, 
        ILogger<AuthenticationService> logger,
        ApplicationDbContext context,
        IUserMapper userMapper)
        : IAuthenticationService
    {
        private readonly JwtSettings _jwtSettings = jwtSettings.Value;
        private readonly ApplicationDbContext _context = context;
        private readonly IUserMapper _userMapper = userMapper;

        public async Task<LoginResponse?> AuthenticateAsync(LoginRequest request)
        {
            var user = await ValidateUserAsync(request.Username, request.Password);
            
            if (user == null)
            {
                logger.LogWarning("Authentication failed for user: {Username}", LoggingHelper.Sanitize(request.Username));
                return null;
            }

            var token = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken();
            
            // Update user's refresh token
            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays);
            user.LastLoginAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;
            
            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            logger.LogInformation("User {Username} authenticated successfully", user.Username);

            return new LoginResponse
            {
                Token = token,
                RefreshToken = refreshToken,
                Expiration = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationMinutes),
                Username = user.Username,
                Email = user.Email,
                UserId = user.Id
            };
        }

        public async Task<User?> ValidateUserAsync(string username, string password)
        {
            var user = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Username == username && u.IsActive);
                
            if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
            {
                return null;
            }

            return user;
        }
        
        public async Task<RegisterResponse?> RegisterAsync(RegisterRequest request)
        {
            // Validate request
            if (string.IsNullOrWhiteSpace(request.Username) || 
                string.IsNullOrWhiteSpace(request.Email) || 
                string.IsNullOrWhiteSpace(request.Password))
            {
                return new RegisterResponse
                {
                    Success = false,
                    Message = "Username, email, and password are required"
                };
            }
            
            if (request.Password != request.ConfirmPassword)
            {
                return new RegisterResponse
                {
                    Success = false,
                    Message = "Passwords do not match"
                };
            }
            
            // Check if username or email already exists
            if (await _context.Users.AnyAsync(u => u.Username == request.Username && u.IsActive))
            {
                return new RegisterResponse
                {
                    Success = false,
                    Message = "Username is already taken"
                };
            }
            
            if (await _context.Users.AnyAsync(u => u.Email == request.Email && u.IsActive))
            {
                return new RegisterResponse
                {
                    Success = false,
                    Message = "Email is already registered"
                };
            }
            
            // Create new user
            var newUser = new User
            {
                Username = request.Username,
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                FirstName = request.FirstName,
                LastName = request.LastName,
                PhoneNumber = request.PhoneNumber,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true
            };
            
            // Add user to database
            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();
            
            // Get the default User role
            var userRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "User" && r.IsActive);
            if (userRole != null)
            {
                // Assign default User role
                var newUserRole = new UserRole
                {
                    UserId = newUser.Id,
                    RoleId = userRole.Id,
                    IsActive = true,
                    AssignedAt = DateTime.UtcNow
                };
                
                _context.UserRoles.Add(newUserRole);
                await _context.SaveChangesAsync();
                
                // Load the user with roles for return
                newUser.UserRoles = new List<UserRole> { newUserRole };
                newUserRole.Role = userRole;
            }
            
            logger.LogInformation("User {Username} registered successfully with ID {UserId}", 
                newUser.Username, newUser.Id);
            
            // Map to profile response for return
            var userProfile = _userMapper.MapToProfileResponse(newUser, 0, 0);
            
            return new RegisterResponse
            {
                Success = true,
                Message = "User registered successfully",
                User = userProfile,
                CreatedAt = newUser.CreatedAt
            };
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
            
            // Add role claims
            foreach (var userRole in user.UserRoles.Where(ur => ur.IsActive && ur.Role.IsActive))
            {
                claims.Add(new Claim(ClaimTypes.Role, userRole.Role.Name));
            }

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
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == username && u.IsActive);
            
            return user != null && 
                   user.RefreshToken == refreshToken && 
                   user.RefreshTokenExpiryTime > DateTime.UtcNow;
        }

        public async Task<LoginResponse?> RefreshTokenAsync(string username, string refreshToken)
        {
            var user = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Username == username && u.IsActive);
            
            if (user == null || user.RefreshToken != refreshToken || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
            {
                logger.LogWarning("Invalid refresh token for user: {Username}", username);
                return null;
            }

            // Generate new tokens
            var newToken = GenerateJwtToken(user);
            var newRefreshToken = GenerateRefreshToken();
            
            // Update user's refresh token
            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays);
            user.LastLoginAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;
            
            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            logger.LogInformation("Token refreshed successfully for user: {Username}", username);

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