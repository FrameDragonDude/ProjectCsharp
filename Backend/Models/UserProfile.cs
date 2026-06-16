using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public class UserProfile
    {
        [Key]
        public string UserId { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public string? Bio { get; set; }
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}