using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View
{
    public class BulkDeleteUsersRequest
    {
        [Required]
        public List<int> UserIds { get; set; } = new();
    }
}