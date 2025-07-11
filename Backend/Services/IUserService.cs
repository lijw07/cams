using cams.Backend.Model;
using cams.Backend.View;

namespace cams.Backend.Services
{
    public interface IUserService
    {
        Task<UserProfileResponse?> GetUserProfileAsync(Guid userId);
        Task<UserProfileSummaryResponse?> GetUserProfileSummaryAsync(Guid userId);
        Task<User?> GetUserAsync(Guid userId);
        Task<UserProfileResponse?> UpdateUserProfileAsync(Guid userId, UserProfileRequest request);
        Task<PasswordChangeResponse> ChangePasswordAsync(Guid userId, ChangePasswordRequest request);
        Task<EmailChangeResponse> ChangeEmailAsync(Guid userId, ChangeEmailRequest request);
        Task<bool> DeactivateUserAsync(Guid userId);
        Task<bool> ValidateCurrentPasswordAsync(Guid userId, string password);
        Task<bool> IsEmailTakenAsync(string email, Guid? excludeUserId = null);
        Task<bool> IsUsernameTakenAsync(string username, Guid? excludeUserId = null);
    }
}