using cams.Backend.View;

namespace cams.Backend.Services
{
    public interface IEmailMessagingService
    {
        // Send operations
        Task<SendEmailResponse> SendEmailAsync(int userId, SendEmailRequest request);
        Task<SendEmailResponse> SendDraftEmailAsync(int userId, int draftId);
        
        // Draft operations
        Task<EmailMessageResponse> SaveDraftAsync(int userId, EmailDraftRequest request);
        Task<EmailMessageResponse> UpdateDraftAsync(int userId, int draftId, EmailDraftRequest request);
        Task<bool> DeleteDraftAsync(int userId, int draftId);
        
        // Retrieve operations
        Task<EmailListResponse> GetEmailsAsync(int userId, EmailSearchRequest request);
        Task<EmailMessageResponse?> GetEmailAsync(int userId, int emailId);
        Task<EmailListResponse> GetSentEmailsAsync(int userId, int page = 1, int pageSize = 20);
        Task<EmailListResponse> GetDraftEmailsAsync(int userId, int page = 1, int pageSize = 20);
        Task<EmailListResponse> GetUnreadEmailsAsync(int userId, int page = 1, int pageSize = 20);
        
        // Email management
        Task<bool> MarkAsReadAsync(int userId, int emailId);
        Task<bool> MarkAsUnreadAsync(int userId, int emailId);
        Task<bool> DeleteEmailAsync(int userId, int emailId);
        Task<bool> DeleteEmailsAsync(int userId, List<int> emailIds);
        
        // Attachments
        Task<EmailAttachmentResponse?> GetAttachmentInfoAsync(int userId, int attachmentId);
        Task<byte[]?> DownloadAttachmentAsync(int userId, int attachmentId);
        
        // Statistics
        Task<EmailStatsResponse> GetEmailStatsAsync(int userId);
        
        // Email validation
        Task<bool> ValidateEmailAddressAsync(string email);
        Task<List<string>> ValidateEmailListAsync(string emailList);
    }
}