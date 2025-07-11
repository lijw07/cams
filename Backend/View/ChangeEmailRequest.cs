using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View;

public class ChangeEmailRequest
{
    [Required(ErrorMessage = "Current password is required for email change")]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "New email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    [StringLength(100, ErrorMessage = "Email cannot exceed 100 characters")]
    public string NewEmail { get; set; } = string.Empty;
}