using System.ComponentModel.DataAnnotations;
using cams.Backend.Enums;

namespace cams.Backend.Model
{
    public class EmailMessage
    {
        public int Id { get; set; }
        
        public int SenderId { get; set; }
        
        [Required]
        [EmailAddress]
        public string FromEmail { get; set; } = string.Empty;
        
        [Required]
        public string FromName { get; set; } = string.Empty;
        
        [Required]
        [EmailAddress]
        public string ToEmail { get; set; } = string.Empty;
        
        public string? ToName { get; set; }
        
        public string? CcEmails { get; set; }
        
        public string? BccEmails { get; set; }
        
        [Required]
        [StringLength(255)]
        public string Subject { get; set; } = string.Empty;
        
        [Required]
        public string Body { get; set; } = string.Empty;
        
        public string? PlainTextBody { get; set; }
        
        public bool IsHtml { get; set; } = true;
        
        public EmailPriority Priority { get; set; } = EmailPriority.Normal;
        
        public EmailStatus Status { get; set; } = EmailStatus.Draft;
        
        public DateTime CreatedAt { get; set; }
        
        public DateTime UpdatedAt { get; set; }
        
        public DateTime? SentAt { get; set; }
        
        public DateTime? DeliveredAt { get; set; }
        
        public string? ErrorMessage { get; set; }
        
        public int RetryCount { get; set; } = 0;
        
        public bool IsDeleted { get; set; } = false;
        
        public bool IsRead { get; set; } = false;
        
        public DateTime? ReadAt { get; set; }
        
        // Navigation properties
        public virtual User Sender { get; set; } = null!;
        
        public virtual ICollection<EmailAttachment> Attachments { get; set; } = new List<EmailAttachment>();
    }
}