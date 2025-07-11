using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View
{
    public class ToggleUserStatusRequest
    {
        [Required]
        public bool IsActive { get; set; }
    }
}