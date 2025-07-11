using System.ComponentModel.DataAnnotations;

namespace cams.Backend.Model
{
    public class PerformanceLog
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(100)]
        public string Operation { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? Controller { get; set; }

        [MaxLength(100)]
        public string? Action { get; set; }

        [MaxLength(200)]
        public string? RequestPath { get; set; }

        [MaxLength(10)]
        public string? HttpMethod { get; set; }

        public Guid? UserId { get; set; }

        [Required]
        public TimeSpan Duration { get; set; }

        public TimeSpan? DatabaseTime { get; set; }

        public TimeSpan? ExternalServiceTime { get; set; }

        public long? MemoryUsedMB { get; set; }

        public int? CpuUsagePercent { get; set; }

        public int StatusCode { get; set; }

        public long? RequestSizeBytes { get; set; }

        public long? ResponseSizeBytes { get; set; }

        [Required]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [MaxLength(45)]
        public string? IpAddress { get; set; }

        [MaxLength(500)]
        public string? UserAgent { get; set; }

        [MaxLength(100)]
        public string? CorrelationId { get; set; }

        [MaxLength(50)]
        public string PerformanceLevel { get; set; } = "Normal";

        public bool IsSlowQuery { get; set; } = false;

        public int? DatabaseQueryCount { get; set; }

        public int? CacheHitCount { get; set; }

        public int? CacheMissCount { get; set; }

        [MaxLength(1000)]
        public string? Metadata { get; set; }

        [MaxLength(500)]
        public string? AlertTrigger { get; set; }

        public virtual User? User { get; set; }
    }
}