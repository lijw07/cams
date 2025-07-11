using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View
{
    public class AssignUsersToRoleRequest
    {
        [Required]
        public List<Guid> UserIds { get; set; } = new();
    }
}