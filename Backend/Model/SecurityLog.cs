using System.ComponentModel.DataAnnotations;

namespace cams.Backend.Model
{
    public class SecurityLog
    {
        [Key]
        public int Id { get; set; }

        public int? UserId { get; set; }

        [MaxLength(100)]
        public string? Username { get; set; }

        [Required]
        [MaxLength(50)]
        public string EventType { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        [Required]
        [MaxLength(45)]
        public string IpAddress { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? UserAgent { get; set; }

        [MaxLength(100)]
        public string? SessionId { get; set; }

        [MaxLength(100)]
        public string? Resource { get; set; }

        [MaxLength(1000)]
        public string? Metadata { get; set; }

        [Required]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [MaxLength(20)]
        public string Severity { get; set; } = "Information";

        public int? FailureCount { get; set; }

        public bool RequiresAction { get; set; } = false;

        [MaxLength(500)]
        public string? FailureReason { get; set; }

        public virtual User? User { get; set; }
    }
}