using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View
{
    public class DeactivateAccountRequest
    {
        [Required(ErrorMessage = "Current password is required")]
        public string CurrentPassword { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "Confirmation is required")]
        public bool ConfirmDeactivation { get; set; }
    }
}