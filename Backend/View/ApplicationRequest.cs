using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View
{
    public class ApplicationRequest
    {
        [Required(ErrorMessage = "Application name is required")]
        [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
        public string Name { get; set; } = string.Empty;

        [StringLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
        public string? Description { get; set; }

        [StringLength(50, ErrorMessage = "Version cannot exceed 50 characters")]
        public string? Version { get; set; }

        [StringLength(200, ErrorMessage = "Environment cannot exceed 200 characters")]
        public string? Environment { get; set; }

        [StringLength(500, ErrorMessage = "Tags cannot exceed 500 characters")]
        public string? Tags { get; set; }

        public bool IsActive { get; set; } = true;
    }
}