using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View
{
    public class BulkDeleteUsersRequest
    {
        [Required]
        public List<Guid> UserIds { get; set; } = new();
    }
}