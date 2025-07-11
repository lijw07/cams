using System.ComponentModel.DataAnnotations;
using cams.Backend.Enums;

namespace cams.Backend.View
{
    /// <summary>
    /// Request model for creating an application with its required database connection
    /// </summary>
    public class ApplicationWithConnectionRequest
    {
        // Application Information
        [Required(ErrorMessage = "Application name is required")]
        [StringLength(100, ErrorMessage = "Application name cannot exceed 100 characters")]
        public string ApplicationName { get; set; } = string.Empty;
        
        [StringLength(1000, ErrorMessage = "Application description cannot exceed 1000 characters")]
        public string? ApplicationDescription { get; set; }
        
        [StringLength(50, ErrorMessage = "Version cannot exceed 50 characters")]
        public string? Version { get; set; }
        
        [StringLength(200, ErrorMessage = "Environment cannot exceed 200 characters")]
        public string? Environment { get; set; }
        
        [StringLength(500, ErrorMessage = "Tags cannot exceed 500 characters")]
        public string? Tags { get; set; }
        
        public bool IsApplicationActive { get; set; } = true;

        // Database Connection Information (Required)
        [Required(ErrorMessage = "Database connection name is required")]
        [StringLength(100, ErrorMessage = "Connection name cannot exceed 100 characters")]
        public string ConnectionName { get; set; } = string.Empty;
        
        [StringLength(500, ErrorMessage = "Connection description cannot exceed 500 characters")]
        public string? ConnectionDescription { get; set; }
        
        [Required(ErrorMessage = "Database type is required")]
        [Range(1, 99, ErrorMessage = "Invalid database type")]
        public DatabaseType DatabaseType { get; set; }
        
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
        
        public bool IsConnectionActive { get; set; } = true;
        
        public bool TestConnectionOnCreate { get; set; } = true;

        // Cloud-specific fields
        public AuthenticationMethod? AuthenticationMethod { get; set; }
        public string? Region { get; set; }
        public string? AccountId { get; set; }
        public string? ProjectId { get; set; }
        public string? InstanceId { get; set; }
        public string? AccessKeyId { get; set; }
        public string? SecretAccessKey { get; set; }
        public string? SessionToken { get; set; }
        public string? ClientId { get; set; }
        public string? ClientSecret { get; set; }
        public string? TenantId { get; set; }
        public string? SubscriptionId { get; set; }
        public string? CertificatePath { get; set; }
        public string? CertificatePassword { get; set; }
        public string? Scope { get; set; }
        public string? Audience { get; set; }
        public string? GrantType { get; set; }
        public string? TokenEndpoint { get; set; }
    }

    /// <summary>
    /// Response model for application created with its database connection
    /// </summary>
    public class ApplicationWithConnectionResponse
    {
        public ApplicationResponse Application { get; set; } = null!;
        public DatabaseConnectionResponse DatabaseConnection { get; set; } = null!;
        public bool ConnectionTestResult { get; set; }
        public string? ConnectionTestMessage { get; set; }
        public TimeSpan? ConnectionTestDuration { get; set; }
    }

    /// <summary>
    /// Request model for updating an application with its primary connection
    /// </summary>
    public class ApplicationWithConnectionUpdateRequest : ApplicationWithConnectionRequest
    {
        [Required(ErrorMessage = "Application ID is required")]
        public int ApplicationId { get; set; }
        
        [Required(ErrorMessage = "Connection ID is required")]
        public int ConnectionId { get; set; }
    }
}