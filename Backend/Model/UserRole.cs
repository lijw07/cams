using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace cams.Backend.Model
{
    public class UserRole
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();
        
        [Required]
        public Guid UserId { get; set; }
        
        [Required]
        public Guid RoleId { get; set; }
        
        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
        
        public Guid? AssignedBy { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        // Navigation properties
        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;
        
        [ForeignKey("RoleId")]
        public virtual Role Role { get; set; } = null!;
        
        [ForeignKey("AssignedBy")]
        public virtual User? AssignedByUser { get; set; }
    }
}