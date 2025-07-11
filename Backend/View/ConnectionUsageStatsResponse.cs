namespace cams.Backend.View;

/// <summary>
/// Response model for connection usage statistics
/// </summary>
public class ConnectionUsageStatsResponse
{
    public Guid ConnectionId { get; set; }
    public int TotalApplications { get; set; }
    public int ActiveApplications { get; set; }
    public DateTime? LastUsed { get; set; }
    public UsageFrequency UsageFrequency { get; set; } = new();
}