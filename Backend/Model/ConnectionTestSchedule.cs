using System.ComponentModel.DataAnnotations;
using cams.Backend.Model;

namespace cams.Backend.Model
{
    /// <summary>
    /// Entity for managing connection test scheduling
    /// </summary>
    public class ConnectionTestSchedule
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid ApplicationId { get; set; }

        [Required]
        [StringLength(100, ErrorMessage = "Cron expression cannot exceed 100 characters")]
        public string CronExpression { get; set; } = string.Empty;

        public bool IsEnabled { get; set; } = true;

        public DateTime? LastRunTime { get; set; }

        public DateTime? NextRunTime { get; set; }

        [StringLength(20)]
        public string? LastRunStatus { get; set; } // 'success', 'failed', 'running'

        [StringLength(1000)]
        public string? LastRunMessage { get; set; }

        public TimeSpan? LastRunDuration { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public virtual Application Application { get; set; } = null!;
    }
}