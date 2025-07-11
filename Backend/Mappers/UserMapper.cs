using cams.Backend.Model;
using cams.Backend.View;

namespace cams.Backend.Mappers
{
    public interface IUserMapper
    {
        LoginResponse MapToLoginResponse(User user, string token, string refreshToken);
        User MapToEntity(CreateUserRequest request);
        UserResponse MapToResponse(User entity);
        UserProfileResponse MapToProfileResponse(User user, int applicationCount, int connectionCount);
        UserProfileSummaryResponse MapToProfileSummaryResponse(User user);
    }

    public class UserMapper : IUserMapper
    {
        public LoginResponse MapToLoginResponse(User user, string token, string refreshToken)
        {
            return new LoginResponse
            {
                Token = token,
                RefreshToken = refreshToken,
                Expiration = DateTime.UtcNow.AddMinutes(60), // This should come from configuration
                Username = user.Username,
                Email = user.Email
            };
        }

        public User MapToEntity(CreateUserRequest request)
        {
            return new User
            {
                Username = request.Username,
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                PhoneNumber = request.PhoneNumber,
                PasswordHash = string.Empty, // Will be set by service
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true
            };
        }

        public UserResponse MapToResponse(User entity)
        {
            return new UserResponse
            {
                Id = entity.Id,
                Username = entity.Username,
                Email = entity.Email,
                FirstName = entity.FirstName ?? string.Empty,
                LastName = entity.LastName ?? string.Empty,
                PhoneNumber = entity.PhoneNumber,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt,
                LastLoginAt = entity.LastLoginAt,
                IsActive = entity.IsActive
            };
        }

        public UserProfileResponse MapToProfileResponse(User user, int applicationCount, int connectionCount)
        {
            return new UserProfileResponse
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneNumber = user.PhoneNumber,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt,
                LastLoginAt = user.LastLoginAt,
                IsActive = user.IsActive,
                ApplicationCount = applicationCount,
                DatabaseConnectionCount = connectionCount,
                Roles = user.UserRoles
                    .Where(ur => ur.IsActive && ur.Role.IsActive)
                    .Select(ur => ur.Role.Name)
                    .ToList()
            };
        }

        public UserProfileSummaryResponse MapToProfileSummaryResponse(User user)
        {
            return new UserProfileSummaryResponse
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                LastLoginAt = user.LastLoginAt,
                IsActive = user.IsActive
            };
        }
    }

    // Additional DTOs that might be needed
    public class CreateUserRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
    }

    public class UserResponse
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public bool IsActive { get; set; }
    }
}