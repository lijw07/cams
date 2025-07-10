namespace cams.Backend.View
{
    public class UserProfileResponse
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? PhoneNumber { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public bool IsActive { get; set; }
        public int ApplicationCount { get; set; }
        public int DatabaseConnectionCount { get; set; }
    }
    
    public class UserProfileSummaryResponse
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string FullName => $"{FirstName} {LastName}".Trim();
        public DateTime? LastLoginAt { get; set; }
        public bool IsActive { get; set; }
    }
    
    public class PasswordChangeResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public DateTime ChangedAt { get; set; }
    }
    
    public class EmailChangeResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? NewEmail { get; set; }
        public DateTime ChangedAt { get; set; }
        public bool RequiresVerification { get; set; }
    }
}