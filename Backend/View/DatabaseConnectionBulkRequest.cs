using System.ComponentModel.DataAnnotations;
using cams.Backend.Enums;

namespace cams.Backend.View
{
    /// <summary>
    /// Request model for bulk toggle operations
    /// </summary>
    public class BulkToggleRequest
    {
        [Required(ErrorMessage = "Connection IDs are required")]
        [MinLength(1, ErrorMessage = "At least one connection ID is required")]
        public int[] ConnectionIds { get; set; } = Array.Empty<int>();
        
        [Required]
        public bool IsActive { get; set; }
    }
    
    /// <summary>
    /// Request model for bulk delete operations
    /// </summary>
    public class BulkDeleteRequest
    {
        [Required(ErrorMessage = "Connection IDs are required")]
        [MinLength(1, ErrorMessage = "At least one connection ID is required")]
        public int[] ConnectionIds { get; set; } = Array.Empty<int>();
    }
    
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
    
    /// <summary>
    /// Response model for bulk operations
    /// </summary>
    public class BulkOperationResponse
    {
        public int[] Successful { get; set; } = Array.Empty<int>();
        public BulkOperationError[] Failed { get; set; } = Array.Empty<BulkOperationError>();
        public string Message { get; set; } = string.Empty;
    }
    
    /// <summary>
    /// Error details for failed bulk operations
    /// </summary>
    public class BulkOperationError
    {
        public int Id { get; set; }
        public string Error { get; set; } = string.Empty;
    }
}