namespace cams.Backend.View;

/// <summary>
/// Response model for connection health status
/// </summary>
public class ConnectionHealthResponse
{
    public Guid ConnectionId { get; set; }
    public bool IsHealthy { get; set; }
    public DateTime LastChecked { get; set; }
    public TimeSpan? ResponseTime { get; set; }
    public string? ErrorMessage { get; set; }
}