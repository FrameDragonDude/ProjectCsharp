using Microsoft.AspNetCore.Http;

namespace Backend.Models.DTOs;

public class MediaItemUploadDto
{
    public string Title { get; set; } = string.Empty;
    public string MediaType { get; set; } = "Audio"; // Audio or Video
    // public int OwnerId { get; set; } 
    public int? AlbumId { get; set; }
    public IFormFile? File { get; set; }
}
