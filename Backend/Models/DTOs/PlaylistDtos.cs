namespace Backend.Models.DTOs;

public class PlaylistCreateDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsPublic { get; set; } = true;
    public int? CreatedByUserId { get; set; } 
}

public class PlaylistTrackDto
{
    public int PlaylistId { get; set; } 
    public int MediaItemId { get; set; } 
}
