using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View;

public class RoleImportDto
{
    [Required(ErrorMessage = "Role name is required")]
    [StringLength(50, MinimumLength = 2, ErrorMessage = "Role name must be between 2 and 50 characters")]
    public string Name { get; set; } = string.Empty;
        
    [StringLength(200, ErrorMessage = "Description cannot exceed 200 characters")]
    public string? Description { get; set; }
        
    public bool IsActive { get; set; } = true;
        
    public List<string> Permissions { get; set; } = new List<string>(); // Permission names
}