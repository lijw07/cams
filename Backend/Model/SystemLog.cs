using System.ComponentModel.DataAnnotations;

namespace cams.Backend.Model
{
    public class SystemLog
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string EventType { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Level { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Source { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string Message { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Details { get; set; }

        [MaxLength(2000)]
        public string? StackTrace { get; set; }

        [MaxLength(100)]
        public string? CorrelationId { get; set; }

        public int? UserId { get; set; }

        [MaxLength(45)]
        public string? IpAddress { get; set; }

        [MaxLength(100)]
        public string? RequestPath { get; set; }

        [MaxLength(10)]
        public string? HttpMethod { get; set; }

        public int? StatusCode { get; set; }

        public TimeSpan? Duration { get; set; }

        [Required]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [MaxLength(100)]
        public string? MachineName { get; set; }

        [MaxLength(100)]
        public string? ProcessId { get; set; }

        [MaxLength(100)]
        public string? ThreadId { get; set; }

        [MaxLength(1000)]
        public string? Metadata { get; set; }

        public bool IsResolved { get; set; } = false;

        public DateTime? ResolvedAt { get; set; }

        [MaxLength(500)]
        public string? ResolutionNotes { get; set; }

        public virtual User? User { get; set; }
    }
}