namespace Backend.Models
{
    public class Follow
    {
        public Guid FollowerId { get; set; } // Người đi ấn theo dõi
        public User? Follower { get; set; }

        public Guid FolloweeId { get; set; } // Người/Nghệ sĩ được theo dõi
        public User? Followee { get; set; }

        public DateTime FollowedAt { get; set; } = DateTime.UtcNow;
    }
}