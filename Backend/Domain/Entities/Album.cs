using System;
using System.ComponentModel.DataAnnotations;

namespace Backend.Domain.Entities;

public class Album
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Title { get; set; } = string.Empty;
    public string? CoverImageUrl { get; set; }
    public string ArtistId { get; set; } = string.Empty;
    public DateTime ReleaseDate { get; set; }
}
