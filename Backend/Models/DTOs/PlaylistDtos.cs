namespace Backend.Models.DTOs;

public class PlaylistCreateDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsPublic { get; set; } = true;
    public string CreatedByUserId { get; set; } = string.Empty;
}

public class PlaylistTrackDto
{
    public string PlaylistId { get; set; } = string.Empty;
    public string MediaItemId { get; set; } = string.Empty;
}
