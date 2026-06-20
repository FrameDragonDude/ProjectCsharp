using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Domain.Entities;

public class PlaylistTrack
{
    public int PlaylistId { get; set; }
    public int MediaItemId { get; set; } 
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    [ForeignKey("PlaylistId")]
    public virtual Playlist? Playlist { get; set; }

    [ForeignKey("MediaItemId")]
    public virtual MediaItem? MediaItem { get; set; }
}
