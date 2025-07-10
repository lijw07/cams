using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View
{
    public class BulkMigrationRequest
    {
        [Required(ErrorMessage = "Migration type is required")]
        public string MigrationType { get; set; } = string.Empty; // "Users", "Roles", "Applications"
        
        [Required(ErrorMessage = "Data is required")]
        public string Data { get; set; } = string.Empty; // JSON string or CSV data
        
        public string DataFormat { get; set; } = "JSON"; // "JSON", "CSV"
        
        public bool ValidateOnly { get; set; } = false; // If true, only validate without importing
        
        public bool OverwriteExisting { get; set; } = false; // If true, update existing records
        
        public bool SendNotifications { get; set; } = true; // Send email notifications for new users
    }

    public class BulkUserImportRequest
    {
        public List<UserImportDto> Users { get; set; } = new List<UserImportDto>();
        public bool OverwriteExisting { get; set; } = false;
        public bool SendWelcomeEmails { get; set; } = true;
    }

    public class UserImportDto
    {
        [Required(ErrorMessage = "Username is required")]
        [StringLength(50, MinimumLength = 3, ErrorMessage = "Username must be between 3 and 50 characters")]
        public string Username { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string Email { get; set; } = string.Empty;
        
        [StringLength(100, MinimumLength = 8, ErrorMessage = "Password must be between 8 and 100 characters")]
        public string? Password { get; set; } // Optional - will generate if not provided
        
        [StringLength(50, ErrorMessage = "First name cannot exceed 50 characters")]
        public string? FirstName { get; set; }
        
        [StringLength(50, ErrorMessage = "Last name cannot exceed 50 characters")]
        public string? LastName { get; set; }
        
        [StringLength(15, ErrorMessage = "Phone number cannot exceed 15 characters")]
        public string? PhoneNumber { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        public List<string> Roles { get; set; } = new List<string>(); // Role names
    }

    public class BulkRoleImportRequest
    {
        public List<RoleImportDto> Roles { get; set; } = new List<RoleImportDto>();
        public bool OverwriteExisting { get; set; } = false;
    }

    public class RoleImportDto
    {
        [Required(ErrorMessage = "Role name is required")]
        [StringLength(50, MinimumLength = 2, ErrorMessage = "Role name must be between 2 and 50 characters")]
        public string Name { get; set; } = string.Empty;
        
        [StringLength(200, ErrorMessage = "Description cannot exceed 200 characters")]
        public string? Description { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        public List<string> Permissions { get; set; } = new List<string>(); // Permission names
    }

    public class BulkApplicationImportRequest
    {
        public List<ApplicationImportDto> Applications { get; set; } = new List<ApplicationImportDto>();
        public bool OverwriteExisting { get; set; } = false;
    }

    public class ApplicationImportDto
    {
        [Required(ErrorMessage = "Application name is required")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Application name must be between 2 and 100 characters")]
        public string Name { get; set; } = string.Empty;
        
        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string? Description { get; set; }
        
        [StringLength(20, ErrorMessage = "Version cannot exceed 20 characters")]
        public string? Version { get; set; }
        
        [StringLength(50, ErrorMessage = "Environment cannot exceed 50 characters")]
        public string? Environment { get; set; }
        
        [StringLength(200, ErrorMessage = "Tags cannot exceed 200 characters")]
        public string? Tags { get; set; }
        
        public bool IsActive { get; set; } = true;
    }

    public class MigrationResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int TotalRecords { get; set; }
        public int SuccessfulRecords { get; set; }
        public int FailedRecords { get; set; }
        public List<string> Errors { get; set; } = new List<string>();
        public List<string> Warnings { get; set; } = new List<string>();
        public string? ValidationSummary { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public TimeSpan Duration => EndTime - StartTime;
        public string? ProgressId { get; set; } // For tracking progress updates
        public double ProgressPercentage { get; set; } = 0;
        public string? CurrentOperation { get; set; }
    }

    public class MigrationProgress
    {
        public string ProgressId { get; set; } = string.Empty;
        public double Percentage { get; set; }
        public int ProcessedRecords { get; set; }
        public int TotalRecords { get; set; }
        public string CurrentOperation { get; set; } = string.Empty;
        public List<string> RecentErrors { get; set; } = new List<string>();
        public List<string> RecentWarnings { get; set; } = new List<string>();
        public bool IsCompleted { get; set; }
        public bool IsSuccessful { get; set; }
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
        public string? EstimatedTimeRemaining { get; set; }
    }

    public class MigrationValidationResult
    {
        public bool IsValid { get; set; }
        public int TotalRecords { get; set; }
        public List<string> Errors { get; set; } = new List<string>();
        public List<string> Warnings { get; set; } = new List<string>();
        public Dictionary<string, int> RecordCounts { get; set; } = new Dictionary<string, int>();
    }
}