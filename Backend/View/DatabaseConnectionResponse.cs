using cams.Backend.Enums;

namespace cams.Backend.View
{
    public class DatabaseConnectionResponse
    {
        public Guid Id { get; set; }
        public Guid ApplicationId { get; set; }
        public string ApplicationName { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DatabaseType Type { get; set; }
        public string TypeName => Type.ToString();
        public string Server { get; set; } = string.Empty;
        public int? Port { get; set; }
        public string? Database { get; set; }
        public string? Username { get; set; }
        public string? ApiBaseUrl { get; set; }
        public bool HasApiKey => !string.IsNullOrEmpty(ApiKey);
        public string? AdditionalSettings { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? LastTestedAt { get; set; }
        public ConnectionStatus Status { get; set; }
        public string StatusName => Status.ToString();
        public string? LastTestResult { get; set; }
        
        // Sensitive data - only included when explicitly requested
        public string? ConnectionString { get; set; }
        public string? ApiKey { get; set; }
    }
}