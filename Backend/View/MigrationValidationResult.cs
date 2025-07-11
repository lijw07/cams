namespace cams.Backend.View;

public class MigrationValidationResult
{
    public bool IsValid { get; set; }
    public int TotalRecords { get; set; }
    public List<string> Errors { get; set; } = new List<string>();
    public List<string> Warnings { get; set; } = new List<string>();
    public Dictionary<string, int> RecordCounts { get; set; } = new Dictionary<string, int>();
}