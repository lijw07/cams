using cams.Backend.Enums;

namespace cams.Backend.View
{
    public class EmailMessageResponse
    {
        public int Id { get; set; }
        public string FromEmail { get; set; } = string.Empty;
        public string FromName { get; set; } = string.Empty;
        public string ToEmail { get; set; } = string.Empty;
        public string? ToName { get; set; }
        public string? CcEmails { get; set; }
        public string? BccEmails { get; set; }
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public bool IsHtml { get; set; }
        public EmailPriority Priority { get; set; }
        public EmailStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? SentAt { get; set; }
        public DateTime? DeliveredAt { get; set; }
        public bool IsRead { get; set; }
        public DateTime? ReadAt { get; set; }
        public List<EmailAttachmentResponse> Attachments { get; set; } = new();
    }

    public class EmailAttachmentResponse
    {
        public int Id { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class EmailSummaryResponse
    {
        public int Id { get; set; }
        public string FromEmail { get; set; } = string.Empty;
        public string FromName { get; set; } = string.Empty;
        public string ToEmail { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public EmailStatus Status { get; set; }
        public EmailPriority Priority { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? SentAt { get; set; }
        public bool IsRead { get; set; }
        public bool HasAttachments { get; set; }
    }

    public class SendEmailResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int? EmailId { get; set; }
        public DateTime? SentAt { get; set; }
    }

    public class EmailListResponse
    {
        public List<EmailSummaryResponse> Emails { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    public class EmailStatsResponse
    {
        public int TotalEmails { get; set; }
        public int SentEmails { get; set; }
        public int DraftEmails { get; set; }
        public int FailedEmails { get; set; }
        public int UnreadEmails { get; set; }
        public int TodayEmails { get; set; }
        public int ThisWeekEmails { get; set; }
        public int ThisMonthEmails { get; set; }
    }
}