using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View
{
    public class UserRoleAssignmentRequest
    {
        [Required]
        public Guid UserId { get; set; }

        [Required]
        public List<Guid> RoleIds { get; set; } = new();
    }
}