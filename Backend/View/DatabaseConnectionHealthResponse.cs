namespace cams.Backend.View
{
    /// <summary>
    /// Response model for connection health status
    /// </summary>
    public class ConnectionHealthResponse
    {
        public int ConnectionId { get; set; }
        public bool IsHealthy { get; set; }
        public DateTime LastChecked { get; set; }
        public TimeSpan? ResponseTime { get; set; }
        public string? ErrorMessage { get; set; }
    }
    
    /// <summary>
    /// Response model for connection usage statistics
    /// </summary>
    public class ConnectionUsageStatsResponse
    {
        public int ConnectionId { get; set; }
        public int TotalApplications { get; set; }
        public int ActiveApplications { get; set; }
        public DateTime? LastUsed { get; set; }
        public UsageFrequency UsageFrequency { get; set; } = new();
    }
    
    /// <summary>
    /// Usage frequency statistics
    /// </summary>
    public class UsageFrequency
    {
        public int Daily { get; set; }
        public int Weekly { get; set; }
        public int Monthly { get; set; }
    }
    
    /// <summary>
    /// Response model for connection string validation
    /// </summary>
    public class ConnectionStringValidationResponse
    {
        public bool IsValid { get; set; }
        public string Message { get; set; } = string.Empty;
        public ConnectionStringComponents? ParsedComponents { get; set; }
    }
    
    /// <summary>
    /// Parsed components of a connection string
    /// </summary>
    public class ConnectionStringComponents
    {
        public string? Server { get; set; }
        public string? Database { get; set; }
        public string? Username { get; set; }
        public int? Port { get; set; }
        public bool? UseIntegratedSecurity { get; set; }
        public int? ConnectionTimeout { get; set; }
        public int? CommandTimeout { get; set; }
    }
}