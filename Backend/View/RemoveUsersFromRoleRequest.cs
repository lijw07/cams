using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View
{
    public class RemoveUsersFromRoleRequest
    {
        [Required]
        public List<Guid> UserIds { get; set; } = new();
    }
}