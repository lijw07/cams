using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View
{
    public class RemoveUsersFromRoleRequest
    {
        [Required]
        public List<int> UserIds { get; set; } = new();
    }
}