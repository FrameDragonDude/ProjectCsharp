using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Domain.Entities;

public class UserProfile
{
    [Key]
    [ForeignKey("User")]
    public int UserId { get; set; }

    [Required]
    [MaxLength(256)]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(512)]
    public string? AvatarUrl { get; set; }

    public string? Bio { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Property
    public virtual User? User { get; set; }
}
