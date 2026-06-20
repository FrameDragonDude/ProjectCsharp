namespace Backend.Models.DTOs;

public class FavoriteDto
{
    public int UserId { get; set; }
    public string MediaItemId { get; set; } = string.Empty;
}

public class PlayHistoryDto
{
    public int UserId { get; set; } 
    public int MediaItemId { get; set; } 
}

public class FollowDto
{
    public int FollowerId { get; set; } 
    public int TargetId { get; set; } 
    public string TargetType { get; set; } = "Artist"; // User or Artist
}
