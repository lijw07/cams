namespace cams.Backend.View;

/// <summary>
/// Response model for application created with its database connection
/// </summary>
public class ApplicationWithConnectionResponse
{
    public ApplicationResponse Application { get; set; } = null!;
    public DatabaseConnectionResponse DatabaseConnection { get; set; } = null!;
    public bool ConnectionTestResult { get; set; }
    public string? ConnectionTestMessage { get; set; }
    public TimeSpan? ConnectionTestDuration { get; set; }
}