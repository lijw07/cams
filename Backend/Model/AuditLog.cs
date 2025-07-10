using System.ComponentModel.DataAnnotations;

namespace cams.Backend.Model
{
    public class AuditLog
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Action { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string EntityType { get; set; } = string.Empty;

        public int? EntityId { get; set; }

        [MaxLength(100)]
        public string EntityName { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? OldValues { get; set; }

        [MaxLength(2000)]
        public string? NewValues { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }

        [Required]
        [MaxLength(45)]
        public string IpAddress { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? UserAgent { get; set; }

        [Required]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [MaxLength(20)]
        public string Severity { get; set; } = "Information";

        public virtual User? User { get; set; }
    }
}