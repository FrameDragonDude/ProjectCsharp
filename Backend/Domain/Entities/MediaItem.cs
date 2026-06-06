using System;
using System.ComponentModel.DataAnnotations;

namespace Backend.Domain.Entities;

public class MediaItem
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Title { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string Duration { get; set; } = string.Empty;
    public string MediaType { get; set; } = string.Empty; // Audio or Video
    public string OwnerId { get; set; } = string.Empty;
    public string? AlbumId { get; set; }
    public string? CoverImageUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
