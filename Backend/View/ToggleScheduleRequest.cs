using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View;

/// <summary>
/// Request model for toggling schedule enabled status
/// </summary>
public class ToggleScheduleRequest
{
    [Required]
    public bool IsEnabled { get; set; }
}