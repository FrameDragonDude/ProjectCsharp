using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public class MusicDbContext : DbContext
{
    public MusicDbContext(DbContextOptions<MusicDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Artist> Artists { get; set; } = null!;
    public DbSet<Album> Albums { get; set; } = null!;
    public DbSet<MediaItem> MediaItems { get; set; } = null!;

protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 1. Định nghĩa khóa phức hợp cho Favorite (Sửa lỗi bước trước)
        modelBuilder.Entity<Favorite>()
            .HasKey(f => new { f.UserId, f.MediaItemId });

        // 2. Định nghĩa khóa phức hợp cho Follow (Sửa lỗi HIỆN TẠI của ông)
        modelBuilder.Entity<Follow>()
            .HasKey(f => new { f.FollowerId, f.TargetId, f.TargetType });

        // 3. Đón đầu định nghĩa khóa phức hợp cho PlaylistTrack (Tránh lỗi tiếp theo)
        modelBuilder.Entity<PlaylistTrack>()
            .HasKey(pt => new { pt.PlaylistId, pt.MediaItemId });
    }
}
