using System.ComponentModel.DataAnnotations;
using cams.Backend.Attributes;

namespace cams.Backend.View;

public class ChangePasswordRequest
{
    [Required(ErrorMessage = "Current password is required")]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "New password is required")]
    [StringLength(100, ErrorMessage = "Password cannot exceed 100 characters")]
    [PasswordValidation]
    public string NewPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password confirmation is required")]
    [Compare("NewPassword", ErrorMessage = "New password and confirmation password do not match")]
    public string ConfirmNewPassword { get; set; } = string.Empty;
}