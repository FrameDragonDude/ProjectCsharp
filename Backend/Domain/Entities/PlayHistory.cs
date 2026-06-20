using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Domain.Entities;

public class PlayHistory
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    public int MediaItemId { get; set; }

    public DateTime PlayedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    [ForeignKey("UserId")]
    public virtual User? User { get; set; }

    [ForeignKey("MediaItemId")]
    public virtual MediaItem? MediaItem { get; set; }
}
