using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View;

/// <summary>
/// Request model for bulk delete operations
/// </summary>
public class BulkDeleteRequest
{
    [Required(ErrorMessage = "Connection IDs are required")]
    [MinLength(1, ErrorMessage = "At least one connection ID is required")]
    public Guid[] ConnectionIds { get; set; } = Array.Empty<Guid>();
}