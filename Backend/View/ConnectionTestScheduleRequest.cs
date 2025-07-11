using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View
{
    /// <summary>
    /// Request model for creating or updating a connection test schedule
    /// </summary>
    public class ConnectionTestScheduleRequest
    {
        [Required(ErrorMessage = "Application ID is required")]
        public Guid ApplicationId { get; set; }

        [Required(ErrorMessage = "Cron expression is required")]
        [StringLength(100, ErrorMessage = "Cron expression cannot exceed 100 characters")]
        public string CronExpression { get; set; } = string.Empty;

        public bool IsEnabled { get; set; } = true;
    }
}