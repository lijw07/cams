namespace cams.Backend.View;

public class ApplicationResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Version { get; set; }
    public string? Environment { get; set; }
    public string? Tags { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? LastAccessedAt { get; set; }
    public int DatabaseConnectionCount { get; set; }
    public List<DatabaseConnectionSummary>? DatabaseConnections { get; set; }
}