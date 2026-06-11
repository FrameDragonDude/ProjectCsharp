using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Domain.Entities;

public class MediaShare
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    public string SenderUserId { get; set; } = string.Empty;

    [Required]
    public string ReceiverUserId { get; set; } = string.Empty;

    public string? MediaItemId { get; set; }
    public string? PlaylistId { get; set; }

    public DateTime SharedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    [ForeignKey("SenderUserId")]
    public virtual User? Sender { get; set; }

    [ForeignKey("ReceiverUserId")]
    public virtual User? Receiver { get; set; }

    [ForeignKey("MediaItemId")]
    public virtual MediaItem? MediaItem { get; set; }

    [ForeignKey("PlaylistId")]
    public virtual Playlist? Playlist { get; set; }
}
