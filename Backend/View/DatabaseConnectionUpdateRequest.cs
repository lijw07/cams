using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View;

public class DatabaseConnectionUpdateRequest : DatabaseConnectionRequest
{
    [Required(ErrorMessage = "Connection ID is required")]
    public Guid Id { get; set; }
}