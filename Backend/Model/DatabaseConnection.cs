using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using cams.Backend.Enums;

namespace cams.Backend.Model
{
    public class DatabaseConnection
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid UserId { get; set; }

        public Guid? ApplicationId { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        [Required]
        public DatabaseType Type { get; set; }

        [Required]
        [StringLength(255)]
        public string Server { get; set; } = string.Empty;

        public int? Port { get; set; }

        [StringLength(100)]
        public string? Database { get; set; }

        [StringLength(100)]
        public string? Username { get; set; }

        [StringLength(255)]
        public string? PasswordHash { get; set; }

        [StringLength(2000)]
        public string? ConnectionString { get; set; }

        [StringLength(500)]
        public string? ApiBaseUrl { get; set; }

        [StringLength(255)]
        public string? ApiKey { get; set; }

        [StringLength(1000)]
        public string? AdditionalSettings { get; set; }

        public bool IsActive { get; set; } = true;
        
        // GitHub-specific fields
        [StringLength(255)]
        public string? GitHubToken { get; set; }
        
        [StringLength(100)]
        public string? GitHubOrganization { get; set; }
        
        [StringLength(100)]
        public string? GitHubRepository { get; set; }
        
        [StringLength(255)]
        public string? GitHubTokenHash { get; set; }  // For storing hashed GitHub token

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        public DateTime? LastTestedAt { get; set; }

        public DateTime? LastAccessedAt { get; set; }

        public ConnectionStatus Status { get; set; } = ConnectionStatus.Untested;

        public string? LastTestResult { get; set; }

        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;

        [ForeignKey("ApplicationId")]
        public virtual Application? Application { get; set; }
    }
}