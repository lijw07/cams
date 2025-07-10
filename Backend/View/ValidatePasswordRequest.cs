using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View
{
    public class ValidatePasswordRequest
    {
        [Required(ErrorMessage = "Password is required")]
        public string Password { get; set; } = string.Empty;
    }
}