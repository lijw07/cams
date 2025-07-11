namespace cams.Backend.View
{
    /// <summary>
    /// Response model for connection test schedule
    /// </summary>
    public class ConnectionTestScheduleResponse
    {
        public int Id { get; set; }
        public int ApplicationId { get; set; }
        public string ApplicationName { get; set; } = string.Empty;
        public string CronExpression { get; set; } = string.Empty;
        public bool IsEnabled { get; set; }
        public DateTime? LastRunTime { get; set; }
        public DateTime? NextRunTime { get; set; }
        public string? LastRunStatus { get; set; }
        public string? LastRunMessage { get; set; }
        public TimeSpan? LastRunDuration { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
    
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
}