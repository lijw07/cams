using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using cams.Backend.Services;
using cams.Backend.View;
using cams.Backend.Helpers;
using cams.Backend.Constants;
using cams.Backend.Enums;

namespace cams.Backend.Controller
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class EmailController(
        IEmailMessagingService emailMessagingService,
        ILogger<EmailController> logger,
        ILoggingService loggingService)
        : ControllerBase
    {
        /// <summary>
        /// Send an email
        /// </summary>
        [HttpPost("send")]
        public async Task<IActionResult> SendEmail([FromBody] SendEmailRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return HttpResponseHelper.CreateValidationErrorResponse(
                        ModelState.Where(x => x.Value?.Errors.Count > 0)
                            .ToDictionary(
                                kvp => kvp.Key,
                                kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? Array.Empty<string>()
                            ));
                }

                var userId = UserHelper.GetCurrentUserId(User);
                var result = await emailMessagingService.SendEmailAsync(userId, request);

                if (!result.Success)
                {
                    // Log failed email send attempt
                    await loggingService.LogAuditAsync(
                        userId,
                        AuditAction.Create.ToString(),
                        AuditEntityTypes.EMAIL,
                        description: $"Failed to send email to {request.ToEmail}",
                        ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                        userAgent: Request.Headers.UserAgent.ToString()
                    );

                    return HttpResponseHelper.CreateBadRequestResponse(result.Message);
                }

                // Log successful email send
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.Create.ToString(),
                    AuditEntityTypes.EMAIL,
                    entityId: result.EmailId,
                    description: $"Email sent to {request.ToEmail}",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                logger.LogInformation("User {UserId} sent email {EmailId} to {ToEmail}",
                    userId, result.EmailId, request.ToEmail);

                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error sending email");
                return HttpResponseHelper.CreateErrorResponse("Error sending email");
            }
        }

        /// <summary>
        /// Get list of emails with optional filtering
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetEmails([FromQuery] EmailSearchRequest request)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                var emails = await emailMessagingService.GetEmailsAsync(userId, request);

                // Log audit event for email retrieval
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.Read.ToString(),
                    AuditEntityTypes.EMAIL,
                    description: $"Retrieved emails (Page: {request.Page}, Count: {emails.Emails.Count})",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                logger.LogInformation("User {UserId} retrieved {EmailCount} emails on page {Page}",
                    userId, emails.Emails.Count, request.Page);

                return Ok(emails);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving emails");
                return HttpResponseHelper.CreateErrorResponse("Error retrieving emails");
            }
        }

        /// <summary>
        /// Get a specific email by ID
        /// </summary>
        [HttpGet("{emailId}")]
        public async Task<IActionResult> GetEmail(int emailId)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                var email = await emailMessagingService.GetEmailAsync(userId, emailId);

                if (email == null)
                {
                    return HttpResponseHelper.CreateNotFoundResponse("Email");
                }

                // Automatically mark as read when viewing
                await emailMessagingService.MarkAsReadAsync(userId, emailId);

                // Log audit event for email retrieval
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.Read.ToString(),
                    AuditEntityTypes.EMAIL,
                    entityId: emailId,
                    description: "Retrieved email details",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                return Ok(email);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving email {EmailId}", emailId);
                return HttpResponseHelper.CreateErrorResponse("Error retrieving email");
            }
        }

        /// <summary>
        /// Get sent emails
        /// </summary>
        [HttpGet("sent")]
        public async Task<IActionResult> GetSentEmails([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                var emails = await emailMessagingService.GetSentEmailsAsync(userId, page, pageSize);

                return Ok(emails);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving sent emails");
                return HttpResponseHelper.CreateErrorResponse("Error retrieving sent emails");
            }
        }

        /// <summary>
        /// Get draft emails
        /// </summary>
        [HttpGet("drafts")]
        public async Task<IActionResult> GetDraftEmails([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                var emails = await emailMessagingService.GetDraftEmailsAsync(userId, page, pageSize);

                return Ok(emails);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving draft emails");
                return HttpResponseHelper.CreateErrorResponse("Error retrieving draft emails");
            }
        }

        /// <summary>
        /// Get unread emails
        /// </summary>
        [HttpGet("unread")]
        public async Task<IActionResult> GetUnreadEmails([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                var emails = await emailMessagingService.GetUnreadEmailsAsync(userId, page, pageSize);

                return Ok(emails);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving unread emails");
                return HttpResponseHelper.CreateErrorResponse("Error retrieving unread emails");
            }
        }

        /// <summary>
        /// Save email as draft
        /// </summary>
        [HttpPost("drafts")]
        public async Task<IActionResult> SaveDraft([FromBody] EmailDraftRequest request)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                var draft = await emailMessagingService.SaveDraftAsync(userId, request);

                // Log audit event for draft creation
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.Create.ToString(),
                    AuditEntityTypes.EMAIL,
                    entityId: draft.Id,
                    description: "Email draft saved",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                return Ok(draft);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error saving email draft");
                return HttpResponseHelper.CreateErrorResponse("Error saving email draft");
            }
        }

        /// <summary>
        /// Update email draft
        /// </summary>
        [HttpPut("drafts/{draftId}")]
        public async Task<IActionResult> UpdateDraft(int draftId, [FromBody] EmailDraftRequest request)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                var draft = await emailMessagingService.UpdateDraftAsync(userId, draftId, request);

                // Log audit event for draft update
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.Update.ToString(),
                    AuditEntityTypes.EMAIL,
                    entityId: draftId,
                    description: "Email draft updated",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                return Ok(draft);
            }
            catch (ArgumentException ex)
            {
                return HttpResponseHelper.CreateNotFoundResponse(ex.Message);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error updating email draft {DraftId}", draftId);
                return HttpResponseHelper.CreateErrorResponse("Error updating email draft");
            }
        }

        /// <summary>
        /// Send a draft email
        /// </summary>
        [HttpPost("drafts/{draftId}/send")]
        public async Task<IActionResult> SendDraft(int draftId)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                var result = await emailMessagingService.SendDraftEmailAsync(userId, draftId);

                if (!result.Success)
                {
                    return HttpResponseHelper.CreateBadRequestResponse(result.Message);
                }

                // Log audit event for draft sending
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.Update.ToString(),
                    AuditEntityTypes.EMAIL,
                    entityId: draftId,
                    description: "Draft email sent",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error sending draft email {DraftId}", draftId);
                return HttpResponseHelper.CreateErrorResponse("Error sending draft email");
            }
        }

        /// <summary>
        /// Delete draft email
        /// </summary>
        [HttpDelete("drafts/{draftId}")]
        public async Task<IActionResult> DeleteDraft(int draftId)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                var success = await emailMessagingService.DeleteDraftAsync(userId, draftId);

                if (!success)
                {
                    return HttpResponseHelper.CreateNotFoundResponse("Draft");
                }

                // Log audit event for draft deletion
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.Delete.ToString(),
                    AuditEntityTypes.EMAIL,
                    entityId: draftId,
                    description: "Email draft deleted",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                return Ok(new { message = "Draft deleted successfully" });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error deleting draft email {DraftId}", draftId);
                return HttpResponseHelper.CreateErrorResponse("Error deleting draft email");
            }
        }

        /// <summary>
        /// Mark email as read
        /// </summary>
        [HttpPut("{emailId}/read")]
        public async Task<IActionResult> MarkAsRead(int emailId)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                var success = await emailMessagingService.MarkAsReadAsync(userId, emailId);

                if (!success)
                {
                    return HttpResponseHelper.CreateNotFoundResponse("Email");
                }

                return Ok(new { message = "Email marked as read" });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error marking email as read {EmailId}", emailId);
                return HttpResponseHelper.CreateErrorResponse("Error marking email as read");
            }
        }

        /// <summary>
        /// Mark email as unread
        /// </summary>
        [HttpPut("{emailId}/unread")]
        public async Task<IActionResult> MarkAsUnread(int emailId)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                var success = await emailMessagingService.MarkAsUnreadAsync(userId, emailId);

                if (!success)
                {
                    return HttpResponseHelper.CreateNotFoundResponse("Email");
                }

                return Ok(new { message = "Email marked as unread" });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error marking email as unread {EmailId}", emailId);
                return HttpResponseHelper.CreateErrorResponse("Error marking email as unread");
            }
        }

        /// <summary>
        /// Delete email
        /// </summary>
        [HttpDelete("{emailId}")]
        public async Task<IActionResult> DeleteEmail(int emailId)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                var success = await emailMessagingService.DeleteEmailAsync(userId, emailId);

                if (!success)
                {
                    return HttpResponseHelper.CreateNotFoundResponse("Email");
                }

                // Log audit event for email deletion
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.Delete.ToString(),
                    AuditEntityTypes.EMAIL,
                    entityId: emailId,
                    description: "Email deleted",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                return Ok(new { message = "Email deleted successfully" });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error deleting email {EmailId}", emailId);
                return HttpResponseHelper.CreateErrorResponse("Error deleting email");
            }
        }

        /// <summary>
        /// Delete multiple emails
        /// </summary>
        [HttpDelete("bulk")]
        public async Task<IActionResult> DeleteEmails([FromBody] List<int> emailIds)
        {
            try
            {
                if (emailIds == null || emailIds.Count == 0)
                {
                    return HttpResponseHelper.CreateBadRequestResponse("No email IDs provided");
                }

                var userId = UserHelper.GetCurrentUserId(User);
                var success = await emailMessagingService.DeleteEmailsAsync(userId, emailIds);

                if (!success)
                {
                    return HttpResponseHelper.CreateBadRequestResponse("No emails were deleted");
                }

                // Log audit event for bulk email deletion
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.Delete.ToString(),
                    AuditEntityTypes.EMAIL,
                    description: $"Bulk deleted {emailIds.Count} emails",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                return Ok(new { message = $"Successfully deleted {emailIds.Count} emails" });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error deleting emails in bulk");
                return HttpResponseHelper.CreateErrorResponse("Error deleting emails");
            }
        }

        /// <summary>
        /// Get email statistics
        /// </summary>
        [HttpGet("stats")]
        public async Task<IActionResult> GetEmailStats()
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                var stats = await emailMessagingService.GetEmailStatsAsync(userId);

                return Ok(stats);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving email statistics");
                return HttpResponseHelper.CreateErrorResponse("Error retrieving email statistics");
            }
        }

        /// <summary>
        /// Get attachment information
        /// </summary>
        [HttpGet("attachments/{attachmentId}")]
        public async Task<IActionResult> GetAttachmentInfo(int attachmentId)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                var attachment = await emailMessagingService.GetAttachmentInfoAsync(userId, attachmentId);

                if (attachment == null)
                {
                    return HttpResponseHelper.CreateNotFoundResponse("Attachment");
                }

                return Ok(attachment);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving attachment info {AttachmentId}", attachmentId);
                return HttpResponseHelper.CreateErrorResponse("Error retrieving attachment information");
            }
        }

        /// <summary>
        /// Download attachment
        /// </summary>
        [HttpGet("attachments/{attachmentId}/download")]
        public async Task<IActionResult> DownloadAttachment(int attachmentId)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                var attachmentInfo = await emailMessagingService.GetAttachmentInfoAsync(userId, attachmentId);
                
                if (attachmentInfo == null)
                {
                    return HttpResponseHelper.CreateNotFoundResponse("Attachment");
                }

                var fileData = await emailMessagingService.DownloadAttachmentAsync(userId, attachmentId);
                
                if (fileData == null)
                {
                    return HttpResponseHelper.CreateNotFoundResponse("Attachment data");
                }

                // Log audit event for attachment download
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.Read.ToString(),
                    AuditEntityTypes.EMAIL,
                    description: $"Downloaded attachment: {attachmentInfo.FileName}",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                return File(fileData, attachmentInfo.ContentType, attachmentInfo.FileName);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error downloading attachment {AttachmentId}", attachmentId);
                return HttpResponseHelper.CreateErrorResponse("Error downloading attachment");
            }
        }

        /// <summary>
        /// Validate email address
        /// </summary>
        [HttpPost("validate-email")]
        public async Task<IActionResult> ValidateEmail([FromBody] ValidateEmailRequest request)
        {
            try
            {
                var isValid = await emailMessagingService.ValidateEmailAddressAsync(request.Email);
                
                return Ok(new { 
                    email = request.Email, 
                    isValid, 
                    message = isValid ? "Email address is valid" : "Email address is invalid" 
                });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error validating email address");
                return HttpResponseHelper.CreateErrorResponse("Error validating email address");
            }
        }
    }
}