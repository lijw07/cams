using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View
{
    public class RoleRequest
    {
        [Required]
        [StringLength(50, MinimumLength = 2)]
        public string Name { get; set; } = string.Empty;

        [StringLength(255)]
        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;
    }
}