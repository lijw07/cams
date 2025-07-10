using System.ComponentModel.DataAnnotations;

namespace cams.Backend.Model
{
    public class EmailAttachment
    {
        public int Id { get; set; }
        
        public int EmailMessageId { get; set; }
        
        [Required]
        [StringLength(255)]
        public string FileName { get; set; } = string.Empty;
        
        [Required]
        public string ContentType { get; set; } = string.Empty;
        
        public long FileSize { get; set; }
        
        [Required]
        public byte[] FileData { get; set; } = Array.Empty<byte>();
        
        public DateTime CreatedAt { get; set; }
        
        // Navigation properties
        public virtual EmailMessage EmailMessage { get; set; } = null!;
    }
}