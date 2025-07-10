using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using cams.Backend.Configuration;
using cams.Backend.Model;

namespace cams.Backend.Services
{
    public class EmailService(IOptions<EmailSettings> emailSettings, ILogger<EmailService> logger)
        : IEmailService
    {
        private readonly EmailSettings _emailSettings = emailSettings.Value;

        public async Task SendProfileUpdateEmailAsync(User user, string changedFields)
        {
            var subject = "Profile Information Updated - CAMS";
            var htmlBody = GenerateProfileUpdateEmailHtml(user, changedFields);
            var plainTextBody = GenerateProfileUpdateEmailText(user, changedFields);

            await SendEmailAsync(user.Email, subject, htmlBody, plainTextBody);
            
            logger.LogInformation("Profile update email sent to user {UserId} ({Email})", user.Id, user.Email);
        }

        public async Task SendPasswordChangeEmailAsync(User user)
        {
            var subject = "Password Changed - CAMS";
            var htmlBody = GeneratePasswordChangeEmailHtml(user);
            var plainTextBody = GeneratePasswordChangeEmailText(user);

            await SendEmailAsync(user.Email, subject, htmlBody, plainTextBody);
            
            logger.LogInformation("Password change email sent to user {UserId} ({Email})", user.Id, user.Email);
        }

        public async Task SendEmailChangeNotificationAsync(User user, string oldEmail, string newEmail)
        {
            var subject = "Email Address Changed - CAMS";
            var htmlBody = GenerateEmailChangeNotificationHtml(user, oldEmail, newEmail);
            var plainTextBody = GenerateEmailChangeNotificationText(user, oldEmail, newEmail);

            // Send to both old and new email addresses
            await SendEmailAsync(oldEmail, subject, htmlBody, plainTextBody);
            await SendEmailAsync(newEmail, subject, htmlBody, plainTextBody);
            
            logger.LogInformation("Email change notification sent to user {UserId} (old: {OldEmail}, new: {NewEmail})", 
                user.Id, oldEmail, newEmail);
        }

        public async Task SendAccountDeactivationEmailAsync(User user)
        {
            var subject = "Account Deactivated - CAMS";
            var htmlBody = GenerateAccountDeactivationEmailHtml(user);
            var plainTextBody = GenerateAccountDeactivationEmailText(user);

            await SendEmailAsync(user.Email, subject, htmlBody, plainTextBody);
            
            logger.LogInformation("Account deactivation email sent to user {UserId} ({Email})", user.Id, user.Email);
        }

        public async Task SendEmailAsync(string toEmail, string subject, string htmlBody, string? plainTextBody = null)
        {
            try
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(_emailSettings.FromName, _emailSettings.FromEmail));
                message.To.Add(new MailboxAddress("", toEmail));
                message.Subject = subject;

                var bodyBuilder = new BodyBuilder();
                
                if (!string.IsNullOrEmpty(plainTextBody))
                {
                    bodyBuilder.TextBody = plainTextBody;
                }
                
                bodyBuilder.HtmlBody = htmlBody;
                message.Body = bodyBuilder.ToMessageBody();

                using var client = new SmtpClient();
                
                // Configure security options
                var secureSocketOptions = _emailSettings.EnableSsl 
                    ? SecureSocketOptions.StartTls 
                    : SecureSocketOptions.None;

                await client.ConnectAsync(_emailSettings.SmtpHost, _emailSettings.SmtpPort, secureSocketOptions);

                if (_emailSettings.UseAuthentication)
                {
                    await client.AuthenticateAsync(_emailSettings.SmtpUsername, _emailSettings.SmtpPassword);
                }

                await client.SendAsync(message);
                await client.DisconnectAsync(true);

                logger.LogInformation("Email sent successfully to {Email} with subject: {Subject}", toEmail, subject);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to send email to {Email} with subject: {Subject}", toEmail, subject);
                throw new InvalidOperationException($"Failed to send email: {ex.Message}", ex);
            }
        }

        public async Task<bool> TestEmailServiceAsync()
        {
            try
            {
                var testSubject = "CAMS Email Service Test";
                var testBody = "<p>This is a test email from the CAMS system. If you receive this, email service is working correctly.</p>";
                
                await SendEmailAsync(_emailSettings.FromEmail, testSubject, testBody);
                return true;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Email service test failed");
                return false;
            }
        }

        #region Email Template Generators

        private string GenerateProfileUpdateEmailHtml(User user, string changedFields)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <title>Profile Updated</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #007bff; color: white; padding: 20px; text-align: center; }}
        .content {{ padding: 20px; background-color: #f8f9fa; }}
        .footer {{ padding: 20px; font-size: 12px; color: #666; text-align: center; }}
        .changes {{ background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Profile Information Updated</h1>
        </div>
        <div class='content'>
            <p>Dear {user.FirstName ?? user.Username},</p>
            <p>Your CAMS profile information has been successfully updated.</p>
            <div class='changes'>
                <strong>Fields Changed:</strong><br>
                {changedFields}
            </div>
            <p><strong>Updated on:</strong> {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC</p>
            <p>If you did not make these changes, please contact support immediately.</p>
        </div>
        <div class='footer'>
            <p>This is an automated email from CAMS (Connection & Application Management System)</p>
        </div>
    </div>
</body>
</html>";
        }

        private string GenerateProfileUpdateEmailText(User user, string changedFields)
        {
            return $@"Profile Information Updated - CAMS

Dear {user.FirstName ?? user.Username},

Your CAMS profile information has been successfully updated.

Fields Changed:
{changedFields}

Updated on: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC

If you did not make these changes, please contact support immediately.

---
This is an automated email from CAMS (Connection & Application Management System)";
        }

        private string GeneratePasswordChangeEmailHtml(User user)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <title>Password Changed</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #28a745; color: white; padding: 20px; text-align: center; }}
        .content {{ padding: 20px; background-color: #f8f9fa; }}
        .footer {{ padding: 20px; font-size: 12px; color: #666; text-align: center; }}
        .alert {{ background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Password Successfully Changed</h1>
        </div>
        <div class='content'>
            <p>Dear {user.FirstName ?? user.Username},</p>
            <p>Your CAMS account password has been successfully changed.</p>
            <div class='alert'>
                <strong>Security Notice:</strong> If you did not change your password, please contact support immediately and consider changing your password again.
            </div>
            <p><strong>Changed on:</strong> {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC</p>
            <p><strong>Account:</strong> {user.Email}</p>
        </div>
        <div class='footer'>
            <p>This is an automated email from CAMS (Connection & Application Management System)</p>
        </div>
    </div>
</body>
</html>";
        }

        private string GeneratePasswordChangeEmailText(User user)
        {
            return $@"Password Successfully Changed - CAMS

Dear {user.FirstName ?? user.Username},

Your CAMS account password has been successfully changed.

SECURITY NOTICE: If you did not change your password, please contact support immediately and consider changing your password again.

Changed on: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC
Account: {user.Email}

---
This is an automated email from CAMS (Connection & Application Management System)";
        }

        private string GenerateEmailChangeNotificationHtml(User user, string oldEmail, string newEmail)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <title>Email Address Changed</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #17a2b8; color: white; padding: 20px; text-align: center; }}
        .content {{ padding: 20px; background-color: #f8f9fa; }}
        .footer {{ padding: 20px; font-size: 12px; color: #666; text-align: center; }}
        .email-change {{ background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 15px 0; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Email Address Changed</h1>
        </div>
        <div class='content'>
            <p>Dear {user.FirstName ?? user.Username},</p>
            <p>Your CAMS account email address has been successfully changed.</p>
            <div class='email-change'>
                <strong>Previous Email:</strong> {oldEmail}<br>
                <strong>New Email:</strong> {newEmail}
            </div>
            <p><strong>Changed on:</strong> {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC</p>
            <p>If you did not make this change, please contact support immediately.</p>
        </div>
        <div class='footer'>
            <p>This is an automated email from CAMS (Connection & Application Management System)</p>
        </div>
    </div>
</body>
</html>";
        }

        private string GenerateEmailChangeNotificationText(User user, string oldEmail, string newEmail)
        {
            return $@"Email Address Changed - CAMS

Dear {user.FirstName ?? user.Username},

Your CAMS account email address has been successfully changed.

Previous Email: {oldEmail}
New Email: {newEmail}

Changed on: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC

If you did not make this change, please contact support immediately.

---
This is an automated email from CAMS (Connection & Application Management System)";
        }

        private string GenerateAccountDeactivationEmailHtml(User user)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <title>Account Deactivated</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #dc3545; color: white; padding: 20px; text-align: center; }}
        .content {{ padding: 20px; background-color: #f8f9fa; }}
        .footer {{ padding: 20px; font-size: 12px; color: #666; text-align: center; }}
        .warning {{ background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 15px 0; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Account Deactivated</h1>
        </div>
        <div class='content'>
            <p>Dear {user.FirstName ?? user.Username},</p>
            <p>Your CAMS account has been deactivated as requested.</p>
            <div class='warning'>
                <strong>Important:</strong> Your account is now inactive and you will no longer be able to access the CAMS system.
            </div>
            <p><strong>Account:</strong> {user.Email}</p>
            <p><strong>Deactivated on:</strong> {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC</p>
            <p>If you need to reactivate your account, please contact support.</p>
        </div>
        <div class='footer'>
            <p>This is an automated email from CAMS (Connection & Application Management System)</p>
        </div>
    </div>
</body>
</html>";
        }

        private string GenerateAccountDeactivationEmailText(User user)
        {
            return $@"Account Deactivated - CAMS

Dear {user.FirstName ?? user.Username},

Your CAMS account has been deactivated as requested.

IMPORTANT: Your account is now inactive and you will no longer be able to access the CAMS system.

Account: {user.Email}
Deactivated on: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC

If you need to reactivate your account, please contact support.

---
This is an automated email from CAMS (Connection & Application Management System)";
        }

        #endregion
    }
}