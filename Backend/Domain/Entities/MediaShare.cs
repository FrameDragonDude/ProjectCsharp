using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Domain.Entities;

public class MediaShare
{
    [Key]
    public int Id { get; set; } 

    [Required]
    public int SenderUserId { get; set; } 

    [Required]
    public int ReceiverUserId { get; set; }

    public int? MediaItemId { get; set; }
    public int? PlaylistId { get; set; }
    public int? AlbumId{get;set;}
    public int ? ArtistId{get;set;}

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
