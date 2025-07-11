using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View;

/// <summary>
/// Request model for updating an existing connection test schedule
/// </summary>
public class ConnectionTestScheduleUpdateRequest : ConnectionTestScheduleRequest
{
    [Required(ErrorMessage = "Schedule ID is required")]
    public Guid Id { get; set; }
}