using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View
{
    public class UserRoleAssignmentRequest
    {
        [Required]
        public int UserId { get; set; }

        [Required]
        public List<int> RoleIds { get; set; } = new();
    }
}