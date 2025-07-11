using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View;

/// <summary>
/// Request model for updating an application with its primary connection
/// </summary>
public class ApplicationWithConnectionUpdateRequest : ApplicationWithConnectionRequest
{
    [Required(ErrorMessage = "Application ID is required")]
    public Guid ApplicationId { get; set; }
        
    [Required(ErrorMessage = "Connection ID is required")]
    public Guid ConnectionId { get; set; }
}