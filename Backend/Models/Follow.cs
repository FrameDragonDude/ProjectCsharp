namespace Backend.Models
{
    public class Follow
    {
        public int FollowerId { get; set; } // Người đi ấn theo dõi
        public User? Follower { get; set; }

        public int FolloweeId { get; set; } // Người/Nghệ sĩ được theo dõi
        public User? Followee { get; set; }

        public DateTime FollowedAt { get; set; } = DateTime.UtcNow;
    }
}