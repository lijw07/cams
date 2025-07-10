using System.Text.RegularExpressions;
using cams.Backend.Model;
using cams.Backend.View;
using cams.Backend.Enums;

namespace cams.Backend.Services
{
    public class EmailMessagingService(
        IEmailService emailService,
        IUserService userService,
        ILogger<EmailMessagingService> logger)
        : IEmailMessagingService
    {
        // In-memory storage (replace with a database in real implementation)
        private static readonly List<EmailMessage> _emails = new();
        private static readonly List<EmailAttachment> _attachments = new();
        private static int _nextEmailId = 1;
        private static int _nextAttachmentId = 1;

        public async Task<SendEmailResponse> SendEmailAsync(int userId, SendEmailRequest request)
        {
            try
            {
                var user = await userService.GetUserAsync(userId);
                if (user == null)
                {
                    return new SendEmailResponse
                    {
                        Success = false,
                        Message = "User not found"
                    };
                }

                // Validate email addresses
                var invalidEmails = new List<string>();
                if (!await ValidateEmailAddressAsync(request.ToEmail))
                    invalidEmails.Add(request.ToEmail);
                
                if (!string.IsNullOrEmpty(request.CcEmails))
                {
                    var ccInvalid = await ValidateEmailListAsync(request.CcEmails);
                    invalidEmails.AddRange(ccInvalid);
                }
                
                if (!string.IsNullOrEmpty(request.BccEmails))
                {
                    var bccInvalid = await ValidateEmailListAsync(request.BccEmails);
                    invalidEmails.AddRange(bccInvalid);
                }

                if (invalidEmails.Count > 0)
                {
                    return new SendEmailResponse
                    {
                        Success = false,
                        Message = $"Invalid email addresses: {string.Join(", ", invalidEmails)}"
                    };
                }

                // Create email message
                var emailMessage = new EmailMessage
                {
                    Id = _nextEmailId++,
                    SenderId = userId,
                    FromEmail = user.Email,
                    FromName = $"{user.FirstName} {user.LastName}".Trim(),
                    ToEmail = request.ToEmail,
                    ToName = request.ToName,
                    CcEmails = request.CcEmails,
                    BccEmails = request.BccEmails,
                    Subject = request.Subject,
                    Body = request.Body,
                    IsHtml = request.IsHtml,
                    Priority = request.Priority,
                    Status = request.SaveAsDraft ? EmailStatus.Draft : EmailStatus.Queued,
                    CreatedAt = DateTime.UtcNow
                };

                // Handle attachments
                if (request.Attachments?.Count > 0)
                {
                    foreach (var attachmentReq in request.Attachments)
                    {
                        try
                        {
                            var fileData = Convert.FromBase64String(attachmentReq.FileDataBase64);
                            var attachment = new EmailAttachment
                            {
                                Id = _nextAttachmentId++,
                                EmailMessageId = emailMessage.Id,
                                FileName = attachmentReq.FileName,
                                ContentType = attachmentReq.ContentType,
                                FileSize = fileData.Length,
                                FileData = fileData,
                                CreatedAt = DateTime.UtcNow
                            };
                            
                            _attachments.Add(attachment);
                            emailMessage.Attachments.Add(attachment);
                        }
                        catch (Exception ex)
                        {
                            logger.LogWarning(ex, "Failed to process attachment {FileName}", attachmentReq.FileName);
                        }
                    }
                }

                _emails.Add(emailMessage);

                // If saving as draft, don't send
                if (request.SaveAsDraft)
                {
                    return new SendEmailResponse
                    {
                        Success = true,
                        Message = "Email saved as draft",
                        EmailId = emailMessage.Id
                    };
                }

                // Send email
                try
                {
                    emailMessage.Status = EmailStatus.Sending;
                    
                    var plainTextBody = request.IsHtml ? null : request.Body;
                    var htmlBody = request.IsHtml ? request.Body : $"<pre>{request.Body}</pre>";
                    
                    await emailService.SendEmailAsync(request.ToEmail, request.Subject, htmlBody, plainTextBody);
                    
                    emailMessage.Status = EmailStatus.Sent;
                    emailMessage.SentAt = DateTime.UtcNow;
                    
                    logger.LogInformation("Email sent successfully from user {UserId} to {ToEmail}", userId, request.ToEmail);
                    
                    return new SendEmailResponse
                    {
                        Success = true,
                        Message = "Email sent successfully",
                        EmailId = emailMessage.Id,
                        SentAt = emailMessage.SentAt
                    };
                }
                catch (Exception ex)
                {
                    emailMessage.Status = EmailStatus.Failed;
                    emailMessage.ErrorMessage = ex.Message;
                    
                    logger.LogError(ex, "Failed to send email from user {UserId} to {ToEmail}", userId, request.ToEmail);
                    
                    return new SendEmailResponse
                    {
                        Success = false,
                        Message = $"Failed to send email: {ex.Message}",
                        EmailId = emailMessage.Id
                    };
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error processing send email request for user {UserId}", userId);
                return new SendEmailResponse
                {
                    Success = false,
                    Message = "An error occurred while processing the email"
                };
            }
        }

        public async Task<SendEmailResponse> SendDraftEmailAsync(int userId, int draftId)
        {
            var draft = _emails.FirstOrDefault(e => e.Id == draftId && e.SenderId == userId && e.Status == EmailStatus.Draft);
            if (draft == null)
            {
                return new SendEmailResponse
                {
                    Success = false,
                    Message = "Draft not found"
                };
            }

            var request = new SendEmailRequest
            {
                ToEmail = draft.ToEmail,
                ToName = draft.ToName,
                CcEmails = draft.CcEmails,
                BccEmails = draft.BccEmails,
                Subject = draft.Subject,
                Body = draft.Body,
                IsHtml = draft.IsHtml,
                Priority = draft.Priority,
                SaveAsDraft = false
            };

            // Delete the draft and send as new email
            _emails.Remove(draft);
            return await SendEmailAsync(userId, request);
        }

        public async Task<EmailMessageResponse> SaveDraftAsync(int userId, EmailDraftRequest request)
        {
            await Task.CompletedTask;
            
            var user = await userService.GetUserAsync(userId);
            if (user == null)
                throw new ArgumentException("User not found");

            var emailMessage = new EmailMessage
            {
                Id = _nextEmailId++,
                SenderId = userId,
                FromEmail = user.Email,
                FromName = $"{user.FirstName} {user.LastName}".Trim(),
                ToEmail = request.ToEmail ?? string.Empty,
                ToName = request.ToName,
                CcEmails = request.CcEmails,
                BccEmails = request.BccEmails,
                Subject = request.Subject ?? string.Empty,
                Body = request.Body ?? string.Empty,
                IsHtml = request.IsHtml,
                Priority = request.Priority,
                Status = EmailStatus.Draft,
                CreatedAt = DateTime.UtcNow
            };

            _emails.Add(emailMessage);
            
            return MapToEmailResponse(emailMessage);
        }

        public async Task<EmailMessageResponse> UpdateDraftAsync(int userId, int draftId, EmailDraftRequest request)
        {
            await Task.CompletedTask;
            
            var draft = _emails.FirstOrDefault(e => e.Id == draftId && e.SenderId == userId && e.Status == EmailStatus.Draft);
            if (draft == null)
                throw new ArgumentException("Draft not found");

            draft.ToEmail = request.ToEmail ?? string.Empty;
            draft.ToName = request.ToName;
            draft.CcEmails = request.CcEmails;
            draft.BccEmails = request.BccEmails;
            draft.Subject = request.Subject ?? string.Empty;
            draft.Body = request.Body ?? string.Empty;
            draft.IsHtml = request.IsHtml;
            draft.Priority = request.Priority;
            draft.UpdatedAt = DateTime.UtcNow;

            return MapToEmailResponse(draft);
        }

        public async Task<bool> DeleteDraftAsync(int userId, int draftId)
        {
            await Task.CompletedTask;
            
            var draft = _emails.FirstOrDefault(e => e.Id == draftId && e.SenderId == userId && e.Status == EmailStatus.Draft);
            if (draft == null)
                return false;

            _emails.Remove(draft);
            
            // Remove associated attachments
            var attachments = _attachments.Where(a => a.EmailMessageId == draftId).ToList();
            foreach (var attachment in attachments)
            {
                _attachments.Remove(attachment);
            }

            return true;
        }

        public async Task<EmailListResponse> GetEmailsAsync(int userId, EmailSearchRequest request)
        {
            await Task.CompletedTask;
            
            var query = _emails.Where(e => e.SenderId == userId && !e.IsDeleted).AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(request.SearchTerm))
            {
                query = query.Where(e => 
                    e.Subject.Contains(request.SearchTerm, StringComparison.OrdinalIgnoreCase) ||
                    e.Body.Contains(request.SearchTerm, StringComparison.OrdinalIgnoreCase) ||
                    e.ToEmail.Contains(request.SearchTerm, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrEmpty(request.FromEmail))
            {
                query = query.Where(e => e.FromEmail.Contains(request.FromEmail, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrEmpty(request.ToEmail))
            {
                query = query.Where(e => e.ToEmail.Contains(request.ToEmail, StringComparison.OrdinalIgnoreCase));
            }

            if (request.FromDate.HasValue)
            {
                query = query.Where(e => e.CreatedAt >= request.FromDate.Value);
            }

            if (request.ToDate.HasValue)
            {
                query = query.Where(e => e.CreatedAt <= request.ToDate.Value);
            }

            if (request.Status.HasValue)
            {
                query = query.Where(e => e.Status == request.Status.Value);
            }

            if (request.IsRead.HasValue)
            {
                query = query.Where(e => e.IsRead == request.IsRead.Value);
            }

            var totalCount = query.Count();
            var emails = query
                .OrderByDescending(e => e.CreatedAt)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(MapToEmailSummary)
                .ToList();

            return new EmailListResponse
            {
                Emails = emails,
                TotalCount = totalCount,
                Page = request.Page,
                PageSize = request.PageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / request.PageSize)
            };
        }

        public async Task<EmailMessageResponse?> GetEmailAsync(int userId, int emailId)
        {
            await Task.CompletedTask;
            
            var email = _emails.FirstOrDefault(e => e.Id == emailId && e.SenderId == userId && !e.IsDeleted);
            return email != null ? MapToEmailResponse(email) : null;
        }

        public async Task<EmailListResponse> GetSentEmailsAsync(int userId, int page = 1, int pageSize = 20)
        {
            return await GetEmailsAsync(userId, new EmailSearchRequest 
            { 
                Status = EmailStatus.Sent, 
                Page = page, 
                PageSize = pageSize 
            });
        }

        public async Task<EmailListResponse> GetDraftEmailsAsync(int userId, int page = 1, int pageSize = 20)
        {
            return await GetEmailsAsync(userId, new EmailSearchRequest 
            { 
                Status = EmailStatus.Draft, 
                Page = page, 
                PageSize = pageSize 
            });
        }

        public async Task<EmailListResponse> GetUnreadEmailsAsync(int userId, int page = 1, int pageSize = 20)
        {
            return await GetEmailsAsync(userId, new EmailSearchRequest 
            { 
                IsRead = false, 
                Page = page, 
                PageSize = pageSize 
            });
        }

        public async Task<bool> MarkAsReadAsync(int userId, int emailId)
        {
            await Task.CompletedTask;
            
            var email = _emails.FirstOrDefault(e => e.Id == emailId && e.SenderId == userId);
            if (email == null)
                return false;

            email.IsRead = true;
            email.ReadAt = DateTime.UtcNow;
            return true;
        }

        public async Task<bool> MarkAsUnreadAsync(int userId, int emailId)
        {
            await Task.CompletedTask;
            
            var email = _emails.FirstOrDefault(e => e.Id == emailId && e.SenderId == userId);
            if (email == null)
                return false;

            email.IsRead = false;
            email.ReadAt = null;
            return true;
        }

        public async Task<bool> DeleteEmailAsync(int userId, int emailId)
        {
            await Task.CompletedTask;
            
            var email = _emails.FirstOrDefault(e => e.Id == emailId && e.SenderId == userId);
            if (email == null)
                return false;

            email.IsDeleted = true;
            return true;
        }

        public async Task<bool> DeleteEmailsAsync(int userId, List<int> emailIds)
        {
            await Task.CompletedTask;
            
            var count = 0;
            foreach (var emailId in emailIds)
            {
                var email = _emails.FirstOrDefault(e => e.Id == emailId && e.SenderId == userId);
                if (email != null)
                {
                    email.IsDeleted = true;
                    count++;
                }
            }

            return count > 0;
        }

        public async Task<EmailAttachmentResponse?> GetAttachmentInfoAsync(int userId, int attachmentId)
        {
            await Task.CompletedTask;
            
            var attachment = _attachments.FirstOrDefault(a => a.Id == attachmentId);
            if (attachment == null)
                return null;

            var email = _emails.FirstOrDefault(e => e.Id == attachment.EmailMessageId && e.SenderId == userId);
            if (email == null)
                return null;

            return new EmailAttachmentResponse
            {
                Id = attachment.Id,
                FileName = attachment.FileName,
                ContentType = attachment.ContentType,
                FileSize = attachment.FileSize,
                CreatedAt = attachment.CreatedAt
            };
        }

        public async Task<byte[]?> DownloadAttachmentAsync(int userId, int attachmentId)
        {
            await Task.CompletedTask;
            
            var attachment = _attachments.FirstOrDefault(a => a.Id == attachmentId);
            if (attachment == null)
                return null;

            var email = _emails.FirstOrDefault(e => e.Id == attachment.EmailMessageId && e.SenderId == userId);
            if (email == null)
                return null;

            return attachment.FileData;
        }

        public async Task<EmailStatsResponse> GetEmailStatsAsync(int userId)
        {
            await Task.CompletedTask;
            
            var userEmails = _emails.Where(e => e.SenderId == userId && !e.IsDeleted).ToList();
            var today = DateTime.UtcNow.Date;
            var weekStart = today.AddDays(-(int)today.DayOfWeek);
            var monthStart = new DateTime(today.Year, today.Month, 1);

            return new EmailStatsResponse
            {
                TotalEmails = userEmails.Count,
                SentEmails = userEmails.Count(e => e.Status == EmailStatus.Sent),
                DraftEmails = userEmails.Count(e => e.Status == EmailStatus.Draft),
                FailedEmails = userEmails.Count(e => e.Status == EmailStatus.Failed),
                UnreadEmails = userEmails.Count(e => !e.IsRead && e.Status != EmailStatus.Draft),
                TodayEmails = userEmails.Count(e => e.CreatedAt.Date == today),
                ThisWeekEmails = userEmails.Count(e => e.CreatedAt.Date >= weekStart),
                ThisMonthEmails = userEmails.Count(e => e.CreatedAt.Date >= monthStart)
            };
        }

        public async Task<bool> ValidateEmailAddressAsync(string email)
        {
            await Task.CompletedTask;
            
            if (string.IsNullOrWhiteSpace(email))
                return false;

            var emailRegex = new Regex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.IgnoreCase);
            return emailRegex.IsMatch(email);
        }

        public async Task<List<string>> ValidateEmailListAsync(string emailList)
        {
            var invalidEmails = new List<string>();
            
            if (string.IsNullOrWhiteSpace(emailList))
                return invalidEmails;

            var emails = emailList.Split(',', ';')
                .Select(e => e.Trim())
                .Where(e => !string.IsNullOrEmpty(e))
                .ToList();

            foreach (var email in emails)
            {
                if (!await ValidateEmailAddressAsync(email))
                {
                    invalidEmails.Add(email);
                }
            }

            return invalidEmails;
        }

        private EmailMessageResponse MapToEmailResponse(EmailMessage email)
        {
            var attachments = _attachments
                .Where(a => a.EmailMessageId == email.Id)
                .Select(a => new EmailAttachmentResponse
                {
                    Id = a.Id,
                    FileName = a.FileName,
                    ContentType = a.ContentType,
                    FileSize = a.FileSize,
                    CreatedAt = a.CreatedAt
                })
                .ToList();

            return new EmailMessageResponse
            {
                Id = email.Id,
                FromEmail = email.FromEmail,
                FromName = email.FromName,
                ToEmail = email.ToEmail,
                ToName = email.ToName,
                CcEmails = email.CcEmails,
                BccEmails = email.BccEmails,
                Subject = email.Subject,
                Body = email.Body,
                IsHtml = email.IsHtml,
                Priority = email.Priority,
                Status = email.Status,
                CreatedAt = email.CreatedAt,
                SentAt = email.SentAt,
                DeliveredAt = email.DeliveredAt,
                IsRead = email.IsRead,
                ReadAt = email.ReadAt,
                Attachments = attachments
            };
        }

        private EmailSummaryResponse MapToEmailSummary(EmailMessage email)
        {
            var hasAttachments = _attachments.Any(a => a.EmailMessageId == email.Id);

            return new EmailSummaryResponse
            {
                Id = email.Id,
                FromEmail = email.FromEmail,
                FromName = email.FromName,
                ToEmail = email.ToEmail,
                Subject = email.Subject,
                Status = email.Status,
                Priority = email.Priority,
                CreatedAt = email.CreatedAt,
                SentAt = email.SentAt,
                IsRead = email.IsRead,
                HasAttachments = hasAttachments
            };
        }
    }
}