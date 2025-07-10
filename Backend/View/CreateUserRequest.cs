using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View
{
    public class CreateUserRequest
    {
        [Required]
        [StringLength(50, MinimumLength = 3)]
        public string Username { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100, MinimumLength = 6)]
        public string Password { get; set; } = string.Empty;
        
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [StringLength(100)]
        public string? FirstName { get; set; }
        
        [StringLength(100)]
        public string? LastName { get; set; }
        
        [Phone]
        public string? PhoneNumber { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        [Required]
        public List<int> RoleIds { get; set; } = new List<int>();
    }
}