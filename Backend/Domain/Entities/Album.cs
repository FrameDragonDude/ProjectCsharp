using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Domain.Entities;

public class Album
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    [MaxLength(256)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(512)]
    public string? CoverImageUrl { get; set; }

    [Required]
    public string ArtistId { get; set; } = string.Empty;

    public DateTime ReleaseDate { get; set; }

    // Navigation Properties
    [ForeignKey("ArtistId")]
    public virtual Artist? Artist { get; set; }
    public virtual ICollection<MediaItem> MediaItems { get; set; } = new List<MediaItem>();
}
