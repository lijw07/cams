using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View
{
    public class BulkDeleteRolesRequest
    {
        [Required]
        public List<int> RoleIds { get; set; } = new();
    }
}