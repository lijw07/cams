using System.ComponentModel.DataAnnotations;

namespace cams.Backend.View
{
    public class CreateGitHubUserRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        [StringLength(50)]
        public string Username { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100)]
        public string FullName { get; set; } = string.Empty;
        
        public string? Company { get; set; }
        public string? Location { get; set; }
        public bool SendWelcomeEmail { get; set; } = true;
    }
    
    public class GrantRepositoryAccessRequest
    {
        [Required]
        public string Organization { get; set; } = string.Empty;
        
        [Required]
        public string Repository { get; set; } = string.Empty;
        
        [Required]
        public string Username { get; set; } = string.Empty;
        
        [Required]
        [RegularExpression("^(read|write|admin)$")]
        public string Permission { get; set; } = "read";
        
        public string? TeamName { get; set; }
    }
    
    public class RevokeRepositoryAccessRequest
    {
        [Required]
        public string Organization { get; set; } = string.Empty;
        
        [Required]
        public string Repository { get; set; } = string.Empty;
        
        [Required]
        public string Username { get; set; } = string.Empty;
    }
    
    public class CreateGitHubTeamRequest
    {
        [Required]
        public string Organization { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100)]
        public string TeamName { get; set; } = string.Empty;
        
        [StringLength(500)]
        public string? Description { get; set; }
        
        [RegularExpression("^(secret|closed)$")]
        public string Privacy { get; set; } = "closed";
        
        public List<string>? Maintainers { get; set; }
        public List<string>? RepoNames { get; set; }
    }
    
    public class BulkRepositoryAccessRequest
    {
        [Required]
        public string Organization { get; set; } = string.Empty;
        
        [Required]
        public List<string> Repositories { get; set; } = new();
        
        [Required]
        public List<string> Usernames { get; set; } = new();
        
        [Required]
        [RegularExpression("^(read|write|admin)$")]
        public string Permission { get; set; } = "read";
        
        public string? TeamName { get; set; }
    }
}