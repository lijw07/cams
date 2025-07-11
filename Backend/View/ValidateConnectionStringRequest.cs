using System.ComponentModel.DataAnnotations;
using cams.Backend.Enums;

namespace cams.Backend.View;

/// <summary>
/// Request model for validating connection strings
/// </summary>
public class ValidateConnectionStringRequest
{
    [Required(ErrorMessage = "Connection string is required")]
    [StringLength(2000, ErrorMessage = "Connection string cannot exceed 2000 characters")]
    public string ConnectionString { get; set; } = string.Empty;

    [Required(ErrorMessage = "Database type is required")]
    public DatabaseType DatabaseType { get; set; }
}