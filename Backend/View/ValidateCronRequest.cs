using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View;

/// <summary>
/// Request model for validating cron expressions
/// </summary>
public class ValidateCronRequest
{
    [Required(ErrorMessage = "Cron expression is required")]
    [StringLength(100, ErrorMessage = "Cron expression cannot exceed 100 characters")]
    public string Expression { get; set; } = string.Empty;
}