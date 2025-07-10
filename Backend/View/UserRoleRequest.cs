using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View
{
    public class UserRoleRequest
    {
        [Required]
        public int UserId { get; set; }
        
        [Required]
        public int RoleId { get; set; }
    }
}