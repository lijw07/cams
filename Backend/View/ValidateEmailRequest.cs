using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View
{
    public class ValidateEmailRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }
}