using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View
{
    public class AssignUsersToRoleRequest
    {
        [Required]
        public List<int> UserIds { get; set; } = new();
    }
}