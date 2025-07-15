namespace cams.Backend.View
{
    public class GitHubUserResponse
    {
        public string Login { get; set; } = string.Empty;
        public long Id { get; set; }
        public string? Email { get; set; }
        public string? Name { get; set; }
        public string? Company { get; set; }
        public string? Location { get; set; }
        public string? Bio { get; set; }
        public string AvatarUrl { get; set; } = string.Empty;
        public string HtmlUrl { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public bool IsOrganizationMember { get; set; }
        public List<string> Teams { get; set; } = new();
    }
    
    public class GitHubRepositoryResponse
    {
        public long Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool Private { get; set; }
        public string HtmlUrl { get; set; } = string.Empty;
        public string DefaultBranch { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public List<string> Topics { get; set; } = new();
        public RepositoryPermissions? Permissions { get; set; }
    }
    
    public class RepositoryPermissions
    {
        public bool Admin { get; set; }
        public bool Push { get; set; }
        public bool Pull { get; set; }
    }
    
    public class RepositoryAccessResponse
    {
        public string Repository { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Permission { get; set; } = string.Empty;
        public string? TeamName { get; set; }
        public DateTime GrantedAt { get; set; }
        public string GrantedBy { get; set; } = string.Empty;
    }
    
    public class GitHubTeamResponse
    {
        public long Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Privacy { get; set; } = string.Empty;
        public string Permission { get; set; } = string.Empty;
        public int MembersCount { get; set; }
        public int ReposCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
    
    public class GitHubAuditLogEntry
    {
        public string Action { get; set; } = string.Empty;
        public string Actor { get; set; } = string.Empty;
        public string? User { get; set; }
        public string? Repository { get; set; }
        public string? Team { get; set; }
        public string? Permission { get; set; }
        public DateTime Timestamp { get; set; }
        public Dictionary<string, object>? AdditionalData { get; set; }
    }
    
    public class GitHubAccessSummary
    {
        public string Username { get; set; } = string.Empty;
        public string Organization { get; set; } = string.Empty;
        public bool IsOrganizationMember { get; set; }
        public List<string> Teams { get; set; } = new();
        public List<RepositoryAccessInfo> RepositoryAccess { get; set; } = new();
        public DateTime? LastActivityAt { get; set; }
    }
    
    public class RepositoryAccessInfo
    {
        public string Repository { get; set; } = string.Empty;
        public string Permission { get; set; } = string.Empty;
        public string Source { get; set; } = string.Empty; // "direct" or "team:team-name"
    }
}