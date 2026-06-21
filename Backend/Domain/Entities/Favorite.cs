using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Domain.Entities;

public class Favorite
{
    public int UserId { get; set; }
    public int MediaItemId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    [ForeignKey("UserId")]
    public virtual User? User { get; set; }

    [ForeignKey("MediaItemId")]
    public virtual MediaItem? MediaItem { get; set; }
}

