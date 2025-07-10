using cams.Backend.Model;
using cams.Backend.View;

namespace cams.Backend.Services
{
    public interface IUserService
    {
        Task<UserProfileResponse?> GetUserProfileAsync(int userId);
        Task<UserProfileSummaryResponse?> GetUserProfileSummaryAsync(int userId);
        Task<User?> GetUserAsync(int userId);
        Task<UserProfileResponse?> UpdateUserProfileAsync(int userId, UserProfileRequest request);
        Task<PasswordChangeResponse> ChangePasswordAsync(int userId, ChangePasswordRequest request);
        Task<EmailChangeResponse> ChangeEmailAsync(int userId, ChangeEmailRequest request);
        Task<bool> DeactivateUserAsync(int userId);
        Task<bool> ValidateCurrentPasswordAsync(int userId, string password);
        Task<bool> IsEmailTakenAsync(string email, int excludeUserId = 0);
        Task<bool> IsUsernameTakenAsync(string username, int excludeUserId = 0);
    }
}