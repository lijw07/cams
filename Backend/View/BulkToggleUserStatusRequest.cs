using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View
{
    public class BulkToggleUserStatusRequest
    {
        [Required]
        public List<int> UserIds { get; set; } = new();

        [Required]
        public bool IsActive { get; set; }
    }
}