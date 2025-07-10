using cams.Backend.Model;
using cams.Backend.View;
using cams.Backend.Mappers;

namespace cams.Backend.Services
{
    public class UserService : IUserService
    {
        private readonly ILogger<UserService> _logger;
        private readonly IUserMapper _userMapper;
        
        // In a real application, this would be replaced with a database context
        private static readonly List<User> _users = new()
        {
            new User
            {
                Id = 1,
                Username = "admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                Email = "admin@example.com",
                FirstName = "Admin",
                LastName = "User",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true
            },
            new User
            {
                Id = 2,
                Username = "user",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("user123"),
                Email = "user@example.com",
                FirstName = "Regular",
                LastName = "User",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true
            }
        };

        // External data for counting (would be in database in real app)
        private static readonly List<Application> _applications = new();
        private static readonly List<DatabaseConnection> _connections = new();

        public UserService(ILogger<UserService> logger, IUserMapper userMapper)
        {
            _logger = logger;
            _userMapper = userMapper;
        }

        public async Task<UserProfileResponse?> GetUserProfileAsync(int userId)
        {
            await Task.CompletedTask;
            
            var user = _users.FirstOrDefault(u => u.Id == userId && u.IsActive);
            if (user == null)
                return null;

            var applicationCount = _applications.Count(a => a.UserId == userId);
            var connectionCount = _connections.Count(c => c.UserId == userId);

            return _userMapper.MapToProfileResponse(user, applicationCount, connectionCount);
        }

        public async Task<UserProfileSummaryResponse?> GetUserProfileSummaryAsync(int userId)
        {
            await Task.CompletedTask;
            
            var user = _users.FirstOrDefault(u => u.Id == userId && u.IsActive);
            return user != null ? _userMapper.MapToProfileSummaryResponse(user) : null;
        }

        public async Task<UserProfileResponse?> UpdateUserProfileAsync(int userId, UserProfileRequest request)
        {
            await Task.CompletedTask;
            
            var user = _users.FirstOrDefault(u => u.Id == userId && u.IsActive);
            if (user == null)
                return null;

            // Update user properties
            user.FirstName = request.FirstName;
            user.LastName = request.LastName;
            user.PhoneNumber = request.PhoneNumber;
            user.UpdatedAt = DateTime.UtcNow;

            _logger.LogInformation("Updated profile for user {UserId}", userId);

            var applicationCount = _applications.Count(a => a.UserId == userId);
            var connectionCount = _connections.Count(c => c.UserId == userId);

            return _userMapper.MapToProfileResponse(user, applicationCount, connectionCount);
        }

        public async Task<PasswordChangeResponse> ChangePasswordAsync(int userId, ChangePasswordRequest request)
        {
            await Task.CompletedTask;
            
            var user = _users.FirstOrDefault(u => u.Id == userId && u.IsActive);
            if (user == null)
            {
                return new PasswordChangeResponse
                {
                    Success = false,
                    Message = "User not found"
                };
            }

            // Verify current password
            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            {
                _logger.LogWarning("Failed password change attempt for user {UserId} - invalid current password", userId);
                return new PasswordChangeResponse
                {
                    Success = false,
                    Message = "Current password is incorrect"
                };
            }

            // Update password
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;

            _logger.LogInformation("Password changed successfully for user {UserId}", userId);

            return new PasswordChangeResponse
            {
                Success = true,
                Message = "Password changed successfully",
                ChangedAt = DateTime.UtcNow
            };
        }

        public async Task<EmailChangeResponse> ChangeEmailAsync(int userId, ChangeEmailRequest request)
        {
            await Task.CompletedTask;
            
            var user = _users.FirstOrDefault(u => u.Id == userId && u.IsActive);
            if (user == null)
            {
                return new EmailChangeResponse
                {
                    Success = false,
                    Message = "User not found"
                };
            }

            // Verify current password
            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            {
                _logger.LogWarning("Failed email change attempt for user {UserId} - invalid password", userId);
                return new EmailChangeResponse
                {
                    Success = false,
                    Message = "Current password is incorrect"
                };
            }

            // Check if email is already taken
            if (await IsEmailTakenAsync(request.NewEmail, userId))
            {
                return new EmailChangeResponse
                {
                    Success = false,
                    Message = "Email address is already in use"
                };
            }

            // Update email
            user.Email = request.NewEmail;
            user.UpdatedAt = DateTime.UtcNow;

            _logger.LogInformation("Email changed successfully for user {UserId} to {NewEmail}", userId, request.NewEmail);

            return new EmailChangeResponse
            {
                Success = true,
                Message = "Email changed successfully",
                NewEmail = request.NewEmail,
                ChangedAt = DateTime.UtcNow,
                RequiresVerification = false // In real app, this would trigger email verification
            };
        }

        public async Task<bool> DeactivateUserAsync(int userId)
        {
            await Task.CompletedTask;
            
            var user = _users.FirstOrDefault(u => u.Id == userId);
            if (user == null)
                return false;

            user.IsActive = false;
            user.UpdatedAt = DateTime.UtcNow;

            _logger.LogInformation("Deactivated user {UserId}", userId);
            
            return true;
        }

        public async Task<bool> ValidateCurrentPasswordAsync(int userId, string password)
        {
            await Task.CompletedTask;
            
            var user = _users.FirstOrDefault(u => u.Id == userId && u.IsActive);
            return user != null && BCrypt.Net.BCrypt.Verify(password, user.PasswordHash);
        }

        public async Task<bool> IsEmailTakenAsync(string email, int excludeUserId = 0)
        {
            await Task.CompletedTask;
            
            return _users.Any(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase) && 
                                  u.Id != excludeUserId && 
                                  u.IsActive);
        }

        public async Task<bool> IsUsernameTakenAsync(string username, int excludeUserId = 0)
        {
            await Task.CompletedTask;
            
            return _users.Any(u => u.Username.Equals(username, StringComparison.OrdinalIgnoreCase) && 
                                  u.Id != excludeUserId && 
                                  u.IsActive);
        }
    }
}