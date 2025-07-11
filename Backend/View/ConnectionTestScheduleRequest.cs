using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View
{
    /// <summary>
    /// Request model for creating or updating a connection test schedule
    /// </summary>
    public class ConnectionTestScheduleRequest
    {
        [Required(ErrorMessage = "Application ID is required")]
        public int ApplicationId { get; set; }
        
        [Required(ErrorMessage = "Cron expression is required")]
        [StringLength(100, ErrorMessage = "Cron expression cannot exceed 100 characters")]
        public string CronExpression { get; set; } = string.Empty;
        
        public bool IsEnabled { get; set; } = true;
    }
    
    /// <summary>
    /// Request model for updating an existing connection test schedule
    /// </summary>
    public class ConnectionTestScheduleUpdateRequest : ConnectionTestScheduleRequest
    {
        [Required(ErrorMessage = "Schedule ID is required")]
        public int Id { get; set; }
    }
    
    /// <summary>
    /// Request model for toggling schedule enabled status
    /// </summary>
    public class ToggleScheduleRequest
    {
        [Required]
        public bool IsEnabled { get; set; }
    }
    
    /// <summary>
    /// Request model for validating cron expressions
    /// </summary>
    public class ValidateCronRequest
    {
        [Required(ErrorMessage = "Cron expression is required")]
        [StringLength(100, ErrorMessage = "Cron expression cannot exceed 100 characters")]
        public string Expression { get; set; } = string.Empty;
    }
}