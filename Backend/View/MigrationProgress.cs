namespace cams.Backend.View;

public class MigrationProgress
{
    public string ProgressId { get; set; } = string.Empty;
    public double Percentage { get; set; }
    public int ProcessedRecords { get; set; }
    public int TotalRecords { get; set; }
    public string CurrentOperation { get; set; } = string.Empty;
    public List<string> RecentErrors { get; set; } = new List<string>();
    public List<string> RecentWarnings { get; set; } = new List<string>();
    public bool IsCompleted { get; set; }
    public bool IsSuccessful { get; set; }
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    public string? EstimatedTimeRemaining { get; set; }
}