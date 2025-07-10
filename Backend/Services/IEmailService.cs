using cams.Backend.Model;

namespace cams.Backend.Services
{
    public interface IEmailService
    {
        /// <summary>
        /// Sends an email for profile information changes
        /// </summary>
        Task SendProfileUpdateEmailAsync(User user, string changedFields);
        
        /// <summary>
        /// Sends an email for password changes
        /// </summary>
        Task SendPasswordChangeEmailAsync(User user);
        
        /// <summary>
        /// Sends an email for email address changes
        /// </summary>
        Task SendEmailChangeNotificationAsync(User user, string oldEmail, string newEmail);
        
        /// <summary>
        /// Sends an email for account deactivation
        /// </summary>
        Task SendAccountDeactivationEmailAsync(User user);
        
        /// <summary>
        /// Sends a generic email
        /// </summary>
        Task SendEmailAsync(string toEmail, string subject, string htmlBody, string? plainTextBody = null);
        
        /// <summary>
        /// Tests the email service configuration
        /// </summary>
        Task<bool> TestEmailServiceAsync();
    }
}