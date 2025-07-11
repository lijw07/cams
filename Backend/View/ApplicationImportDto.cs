using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View;

public class ApplicationImportDto
{
    [Required(ErrorMessage = "Application name is required")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Application name must be between 2 and 100 characters")]
    public string Name { get; set; } = string.Empty;

    [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
    public string? Description { get; set; }

    [StringLength(20, ErrorMessage = "Version cannot exceed 20 characters")]
    public string? Version { get; set; }

    [StringLength(50, ErrorMessage = "Environment cannot exceed 50 characters")]
    public string? Environment { get; set; }

    [StringLength(200, ErrorMessage = "Tags cannot exceed 200 characters")]
    public string? Tags { get; set; }

    public bool IsActive { get; set; } = true;
}