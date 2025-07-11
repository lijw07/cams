using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View
{
    public class BulkDeleteRolesRequest
    {
        [Required]
        public List<Guid> RoleIds { get; set; } = new();
    }
}