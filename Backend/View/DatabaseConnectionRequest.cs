using System.ComponentModel.DataAnnotations;
using cams.Backend.Enums;

namespace cams.Backend.View
{
    public class DatabaseConnectionRequest
    {
        [Required(ErrorMessage = "Application ID is required")]
        public int ApplicationId { get; set; }
        
        [Required(ErrorMessage = "Name is required")]
        [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
        public string Name { get; set; } = string.Empty;
        
        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string? Description { get; set; }
        
        [Required(ErrorMessage = "Database type is required")]
        public DatabaseType Type { get; set; }
        
        [Required(ErrorMessage = "Server is required")]
        [StringLength(255, ErrorMessage = "Server cannot exceed 255 characters")]
        public string Server { get; set; } = string.Empty;
        
        [Range(1, 65535, ErrorMessage = "Port must be between 1 and 65535")]
        public int? Port { get; set; }
        
        [StringLength(100, ErrorMessage = "Database name cannot exceed 100 characters")]
        public string? Database { get; set; }
        
        [StringLength(100, ErrorMessage = "Username cannot exceed 100 characters")]
        public string? Username { get; set; }
        
        [StringLength(255, ErrorMessage = "Password cannot exceed 255 characters")]
        public string? Password { get; set; }
        
        [StringLength(2000, ErrorMessage = "Connection string cannot exceed 2000 characters")]
        public string? ConnectionString { get; set; }
        
        [StringLength(500, ErrorMessage = "API base URL cannot exceed 500 characters")]
        public string? ApiBaseUrl { get; set; }
        
        [StringLength(255, ErrorMessage = "API key cannot exceed 255 characters")]
        public string? ApiKey { get; set; }
        
        [StringLength(1000, ErrorMessage = "Additional settings cannot exceed 1000 characters")]
        public string? AdditionalSettings { get; set; }
        
        public bool IsActive { get; set; } = true;
    }
    
    public class DatabaseConnectionUpdateRequest : DatabaseConnectionRequest
    {
        [Required(ErrorMessage = "Connection ID is required")]
        public int Id { get; set; }
    }
}