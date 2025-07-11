namespace cams.Backend.View
{
    /// <summary>
    /// Response model for connection test schedule
    /// </summary>
    public class ConnectionTestScheduleResponse
    {
        public Guid Id { get; set; }
        public Guid ApplicationId { get; set; }
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
}