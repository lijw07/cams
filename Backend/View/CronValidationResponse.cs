namespace cams.Backend.View;

/// <summary>
/// Response model for cron expression validation
/// </summary>
public class CronValidationResponse
{
    public bool IsValid { get; set; }
    public string? Description { get; set; }
    public DateTime? NextRunTime { get; set; }
    public string? ErrorMessage { get; set; }
}