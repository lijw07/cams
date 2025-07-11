using cams.Backend.Model;
using cams.Backend.View;
using cams.Backend.Mappers;
using cams.Backend.Data;
using Backend.Helpers;
using Microsoft.EntityFrameworkCore;

namespace cams.Backend.Services
{
    public class UserService(ILogger<UserService> logger, IUserMapper userMapper, ApplicationDbContext context)
        : IUserService
    {
        public async Task<UserProfileResponse?> GetUserProfileAsync(Guid userId)
        {
            var user = await context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);
                
            if (user == null)
                return null;

            var applicationCount = await context.Applications.CountAsync(a => a.UserId == userId);
            var connectionCount = await context.DatabaseConnections.CountAsync(c => c.UserId == userId);

            return userMapper.MapToProfileResponse(user, applicationCount, connectionCount);
        }

        public async Task<UserProfileSummaryResponse?> GetUserProfileSummaryAsync(Guid userId)
        {
            var user = await context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);
                
            return user != null ? userMapper.MapToProfileSummaryResponse(user) : null;
        }

        public async Task<User?> GetUserAsync(Guid userId)
        {
            return await context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);
        }

        public async Task<UserProfileResponse?> UpdateUserProfileAsync(Guid userId, UserProfileRequest request)
        {
            var user = await context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);
                
            if (user == null)
                return null;

            // Update user properties
            user.FirstName = request.FirstName;
            user.LastName = request.LastName;
            user.PhoneNumber = request.PhoneNumber;
            user.UpdatedAt = DateTime.UtcNow;

            context.Users.Update(user);
            await context.SaveChangesAsync();

            logger.LogInformation("Updated profile for user {UserId}", userId);

            var applicationCount = await context.Applications.CountAsync(a => a.UserId == userId);
            var connectionCount = await context.DatabaseConnections.CountAsync(c => c.UserId == userId);

            return userMapper.MapToProfileResponse(user, applicationCount, connectionCount);
        }

        public async Task<PasswordChangeResponse> ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
        {
            var user = await context.Users.FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);
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
                logger.LogWarning("Failed password change attempt for user {UserId} - invalid current password", userId);
                return new PasswordChangeResponse
                {
                    Success = false,
                    Message = "Current password is incorrect"
                };
            }

            // Update password
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;

            context.Users.Update(user);
            await context.SaveChangesAsync();

            logger.LogInformation("Password changed successfully for user {UserId}", userId);

            return new PasswordChangeResponse
            {
                Success = true,
                Message = "Password changed successfully",
                ChangedAt = DateTime.UtcNow
            };
        }

        public async Task<EmailChangeResponse> ChangeEmailAsync(Guid userId, ChangeEmailRequest request)
        {
            var user = await context.Users.FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);
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
                logger.LogWarning("Failed email change attempt for user {UserId} - invalid password", userId);
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

            context.Users.Update(user);
            await context.SaveChangesAsync();

            logger.LogInformation("Email changed successfully for user {UserId} to {NewEmail}", userId, LoggingHelper.Sanitize(request.NewEmail));

            return new EmailChangeResponse
            {
                Success = true,
                Message = "Email changed successfully",
                NewEmail = request.NewEmail,
                ChangedAt = DateTime.UtcNow,
                RequiresVerification = false // In real app, this would trigger email verification
            };
        }

        public async Task<bool> DeactivateUserAsync(Guid userId)
        {
            var user = await context.Users.FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);
            if (user == null)
                return false;

            user.IsActive = false;
            user.UpdatedAt = DateTime.UtcNow;

            context.Users.Update(user);
            await context.SaveChangesAsync();

            logger.LogInformation("Deactivated user {UserId}", userId);
            
            return true;
        }

        public async Task<bool> ValidateCurrentPasswordAsync(Guid userId, string password)
        {
            var user = await context.Users.FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);
            return user != null && BCrypt.Net.BCrypt.Verify(password, user.PasswordHash);
        }

        public async Task<bool> IsEmailTakenAsync(string email, Guid? excludeUserId = null)
        {
            return await context.Users.AnyAsync(u => u.Email.ToLower() == email.ToLower() && (excludeUserId == null || u.Id != excludeUserId) && u.IsActive);
        }

        public async Task<bool> IsUsernameTakenAsync(string username, Guid? excludeUserId = null)
        {
            return await context.Users.AnyAsync(u => u.Username.ToLower() == username.ToLower() && (excludeUserId == null || u.Id != excludeUserId) && u.IsActive);
        }
    }
}