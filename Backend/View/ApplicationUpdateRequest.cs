using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View;

public class ApplicationUpdateRequest : ApplicationRequest
{
    [Required(ErrorMessage = "Application ID is required")]
    public Guid Id { get; set; }
}