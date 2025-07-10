using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View
{
    public class ValidateUsernameRequest
    {
        [Required]
        public string Username { get; set; } = string.Empty;
    }
}