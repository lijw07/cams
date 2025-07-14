using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View
{
    public class AssignConnectionRequest
    {
        [Required(ErrorMessage = "Application ID is required")]
        public Guid ApplicationId { get; set; }
    }
}