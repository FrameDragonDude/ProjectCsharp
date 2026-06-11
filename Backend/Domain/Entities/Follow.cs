using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Domain.Entities;

public class Follow
{
    public string FollowerId { get; set; } = string.Empty;
    public string TargetId { get; set; } = string.Empty;
    public string TargetType { get; set; } = string.Empty; // User or Artist
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    [ForeignKey("FollowerId")]
    public virtual User? Follower { get; set; }
}
