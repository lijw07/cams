using System.ComponentModel.DataAnnotations;
using cams.Backend.Attributes;

namespace cams.Backend.View
{
    public class UserProfileRequest
    {
        [StringLength(50, ErrorMessage = "First name cannot exceed 50 characters")]
        public string? FirstName { get; set; }
        
        [StringLength(50, ErrorMessage = "Last name cannot exceed 50 characters")]
        public string? LastName { get; set; }
        
        [StringLength(15, ErrorMessage = "Phone number cannot exceed 15 characters")]
        [PhoneNumberValidation(ErrorMessage = "Invalid phone number format")]
        public string? PhoneNumber { get; set; }
    }
    
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
    
    public class ChangeEmailRequest
    {
        [Required(ErrorMessage = "Current password is required for email change")]
        public string CurrentPassword { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "New email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        [StringLength(100, ErrorMessage = "Email cannot exceed 100 characters")]
        public string NewEmail { get; set; } = string.Empty;
    }
}