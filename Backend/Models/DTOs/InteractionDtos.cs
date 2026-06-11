namespace Backend.Models.DTOs;

public class FavoriteDto
{
    public string UserId { get; set; } = string.Empty;
    public string MediaItemId { get; set; } = string.Empty;
}

public class PlayHistoryDto
{
    public string UserId { get; set; } = string.Empty;
    public string MediaItemId { get; set; } = string.Empty;
}

public class FollowDto
{
    public string FollowerId { get; set; } = string.Empty;
    public string TargetId { get; set; } = string.Empty;
    public string TargetType { get; set; } = "Artist"; // User or Artist
}
