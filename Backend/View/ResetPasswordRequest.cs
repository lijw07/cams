using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View
{
    public class ResetPasswordRequest
    {
        [Required]
        [StringLength(100, MinimumLength = 8)]
        public string NewPassword { get; set; } = string.Empty;

        public bool SendEmailNotification { get; set; } = true;
    }
}