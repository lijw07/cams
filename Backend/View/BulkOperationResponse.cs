namespace cams.Backend.View;

/// <summary>
/// Response model for bulk operations
/// </summary>
public class BulkOperationResponse
{
    public Guid[] Successful { get; set; } = Array.Empty<Guid>();
    public BulkOperationError[] Failed { get; set; } = Array.Empty<BulkOperationError>();
    public string Message { get; set; } = string.Empty;
}