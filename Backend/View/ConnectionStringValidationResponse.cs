namespace cams.Backend.View;

/// <summary>
/// Response model for connection string validation
/// </summary>
public class ConnectionStringValidationResponse
{
    public bool IsValid { get; set; }
    public string Message { get; set; } = string.Empty;
    public ConnectionStringComponents? ParsedComponents { get; set; }
}