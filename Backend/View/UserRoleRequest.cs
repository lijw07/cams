using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View
{
    public class UserRoleRequest
    {
        [Required]
        public Guid UserId { get; set; }

        [Required]
        public Guid RoleId { get; set; }
    }
}