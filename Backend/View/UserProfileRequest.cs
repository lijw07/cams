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
}