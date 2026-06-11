using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Domain.Entities;

public class PlaylistTrack
{
    public string PlaylistId { get; set; } = string.Empty;
    public string MediaItemId { get; set; } = string.Empty;
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    [ForeignKey("PlaylistId")]
    public virtual Playlist? Playlist { get; set; }

    [ForeignKey("MediaItemId")]
    public virtual MediaItem? MediaItem { get; set; }
}
