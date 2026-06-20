using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Domain.Entities;

public class MediaItem
{
    [Key]
    public int Id { get; set; } 

    [Required]
    [MaxLength(256)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(512)]
    public string FilePath { get; set; } = string.Empty;

    [Required]
    [MaxLength(10)]
    public string Duration { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string MediaType { get; set; } = "Audio"; // Audio or Video

    [Required]
    public int OwnerId { get; set; } 

    public int? AlbumId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    [ForeignKey("OwnerId")]
    public virtual User? Owner { get; set; }

    [ForeignKey("AlbumId")]
    public virtual Album? Album { get; set; }

    public virtual ICollection<PlaylistTrack> PlaylistTracks { get; set; } = new List<PlaylistTrack>();
    public virtual ICollection<Favorite> Favorites { get; set; } = new List<Favorite>();
    public virtual ICollection<PlayHistory> PlayHistories { get; set; } = new List<PlayHistory>();
}
