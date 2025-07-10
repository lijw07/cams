using System.ComponentModel.DataAnnotations;
using cams.Backend.Enums;

namespace cams.Backend.View
{
    public class SendEmailRequest
    {
        [Required]
        [EmailAddress]
        public string ToEmail { get; set; } = string.Empty;
        
        public string? ToName { get; set; }
        
        public string? CcEmails { get; set; }
        
        public string? BccEmails { get; set; }
        
        [Required]
        [StringLength(255, MinimumLength = 1)]
        public string Subject { get; set; } = string.Empty;
        
        [Required]
        public string Body { get; set; } = string.Empty;
        
        public bool IsHtml { get; set; } = true;
        
        public EmailPriority Priority { get; set; } = EmailPriority.Normal;
        
        public bool SaveAsDraft { get; set; } = false;
        
        public List<AttachmentRequest>? Attachments { get; set; }
    }

    public class AttachmentRequest
    {
        [Required]
        public string FileName { get; set; } = string.Empty;
        
        [Required]
        public string ContentType { get; set; } = string.Empty;
        
        [Required]
        public string FileDataBase64 { get; set; } = string.Empty;
    }

    public class EmailDraftRequest
    {
        public string? ToEmail { get; set; }
        
        public string? ToName { get; set; }
        
        public string? CcEmails { get; set; }
        
        public string? BccEmails { get; set; }
        
        public string? Subject { get; set; }
        
        public string? Body { get; set; }
        
        public bool IsHtml { get; set; } = true;
        
        public EmailPriority Priority { get; set; } = EmailPriority.Normal;
    }

    public class EmailSearchRequest
    {
        public string? SearchTerm { get; set; }
        
        public string? FromEmail { get; set; }
        
        public string? ToEmail { get; set; }
        
        public DateTime? FromDate { get; set; }
        
        public DateTime? ToDate { get; set; }
        
        public EmailStatus? Status { get; set; }
        
        public bool? IsRead { get; set; }
        
        public int Page { get; set; } = 1;
        
        public int PageSize { get; set; } = 20;
    }
}