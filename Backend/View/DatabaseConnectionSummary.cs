using cams.Backend.Enums;

namespace cams.Backend.View;

public class DatabaseConnectionSummary
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string TypeName { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public DateTime? LastTestedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DatabaseType Type { get; set; }
    public ConnectionStatus Status { get; set; }
    public string Server { get; set; } = string.Empty;
    public int? Port { get; set; }
    public string? Database { get; set; }
    public Guid? ApplicationId { get; set; }
    public string? ApplicationName { get; set; }
}