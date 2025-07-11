using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View;

/// <summary>
/// Request model for bulk toggle operations
/// </summary>
public class BulkToggleRequest
{
    [Required(ErrorMessage = "Connection IDs are required")]
    [MinLength(1, ErrorMessage = "At least one connection ID is required")]
    public Guid[] ConnectionIds { get; set; } = Array.Empty<Guid>();

    [Required]
    public bool IsActive { get; set; }
}