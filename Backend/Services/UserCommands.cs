using MediatR;
using MySqlConnector;
using System.ComponentModel.DataAnnotations;

namespace Backend.Services
{
    public sealed record UpdateProfileCommand(
        [Required] int UserId, 
        
        [Required(ErrorMessage = "Ten hien thi khong duoc de trong.")]
        [MaxLength(35, ErrorMessage = "Ten hien thi khong duoc vuot qua 35 ky tu.")]
        string FullName, 
        
        [MaxLength(200, ErrorMessage = "Tieu su khong duoc vuot qua 200 ky tu.")]
        string? Bio, 
        
        string? AvatarUrl
    ) : IRequest<bool>;
    
    public class UpdateProfileCommandHandler : IRequestHandler<UpdateProfileCommand, bool>
    {
        private readonly IConfiguration _configuration;
        public UpdateProfileCommandHandler(IConfiguration configuration) => _configuration = configuration;

        public async Task<bool> Handle(UpdateProfileCommand request, CancellationToken cancellationToken)
        {
            var connString = _configuration.GetConnectionString("SpotifyDb");
            await using var connection = new MySqlConnection(connString);
            await connection.OpenAsync(cancellationToken);

            const string sql = @"
    UPDATE UserProfiles 
    SET FullName = @FullName, 
        Bio = @Bio, 
        AvatarUrl = COALESCE(@AvatarUrl, AvatarUrl)
    WHERE UserId = @UserId;";

            await using var cmd = new MySqlCommand(sql, connection);
            cmd.Parameters.AddWithValue("@UserId", request.UserId);
            cmd.Parameters.AddWithValue("@FullName", request.FullName);
            cmd.Parameters.AddWithValue("@Bio", (object?)request.Bio ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@AvatarUrl", (object?)request.AvatarUrl ?? DBNull.Value);

            var rows = await cmd.ExecuteNonQueryAsync(cancellationToken);
            return rows > 0;
        }
    }


    public sealed record ToggleFollowCommand(
        [Required] int FollowerId, 
        [Required(ErrorMessage = "TargetId khong duoc de trong.")] 
        int TargetId,
        [Required]
        [RegularExpression("^(User|Artist)$", ErrorMessage = "TargetType phai la 'User' hoac 'Artist'.")]
        string TargetType
    ) : IRequest<string>;

    public class ToggleFollowCommandHandler : IRequestHandler<ToggleFollowCommand, string>
    {
        private readonly IConfiguration _configuration;
        public ToggleFollowCommandHandler(IConfiguration configuration) => _configuration = configuration;

        public async Task<string> Handle(ToggleFollowCommand request, CancellationToken cancellationToken)
        {
            var connString = _configuration.GetConnectionString("SpotifyDb");
            await using var connection = new MySqlConnection(connString);
            await connection.OpenAsync(cancellationToken);

            const string checkSql = "SELECT 1 FROM Follows WHERE FollowerId = @FollowerId AND TargetId = @TargetId AND TargetType = @TargetType LIMIT 1;";
            bool isFollowing = false;
            await using (var checkCmd = new MySqlCommand(checkSql, connection))
            {
                checkCmd.Parameters.AddWithValue("@FollowerId", request.FollowerId);
                checkCmd.Parameters.AddWithValue("@TargetId", request.TargetId);
                checkCmd.Parameters.AddWithValue("@TargetType", request.TargetType);
                var result = await checkCmd.ExecuteScalarAsync(cancellationToken);
                isFollowing = result != null;
            }

            if (isFollowing)
            {
                const string deleteSql = "DELETE FROM Follows WHERE FollowerId = @FollowerId AND TargetId = @TargetId AND TargetType = @TargetType;";
                await using var deleteCmd = new MySqlCommand(deleteSql, connection);
                deleteCmd.Parameters.AddWithValue("@FollowerId", request.FollowerId);
                deleteCmd.Parameters.AddWithValue("@TargetId", request.TargetId);
                deleteCmd.Parameters.AddWithValue("@TargetType", request.TargetType);
                await deleteCmd.ExecuteNonQueryAsync(cancellationToken);
                
                return $"ÄÃ£ há»§y theo dÃµi {request.TargetType}.";
            }
            else
            {
                const string insertSql = "INSERT INTO Follows (FollowerId, TargetId, TargetType, CreatedAt) VALUES (@FollowerId, @TargetId, @TargetType, UTC_TIMESTAMP());";
                await using var insertCmd = new MySqlCommand(insertSql, connection);
                insertCmd.Parameters.AddWithValue("@FollowerId", request.FollowerId);
                insertCmd.Parameters.AddWithValue("@TargetId", request.TargetId);
                insertCmd.Parameters.AddWithValue("@TargetType", request.TargetType);
                await insertCmd.ExecuteNonQueryAsync(cancellationToken);
                
                return $"Da theo doi {request.TargetType} thanh cong!";
            }
        }
    }

    public record UserProfileDto(
        string Email, 
        string FullName, 
        string Bio, 
        string? AvatarUrl, 
        int RoleId, // <--- THÊM Ở ĐÂY
        int FollowersCount = 0, 
        int FollowingCount = 0, 
        DateTime? UpdatedAt = null
    );
    public record GetProfileQuery(int UserId) : IRequest<UserProfileDto?>;

    public class GetProfileQueryHandler : IRequestHandler<GetProfileQuery, UserProfileDto?>
    {
        private readonly IConfiguration _configuration;
        public GetProfileQueryHandler(IConfiguration configuration) => _configuration = configuration;

        public async Task<UserProfileDto?> Handle(GetProfileQuery request, CancellationToken cancellationToken)
        {
            var connString = _configuration.GetConnectionString("SpotifyDb");
            await using var connection = new MySqlConnection(connString);
            await connection.OpenAsync(cancellationToken);

            // 2. THÊM u.RoleId VÀO CÂU LỆNH SELECT
            const string sql = @"
                SELECT u.Email, u.RoleId, p.FullName, p.Bio, p.AvatarUrl, p.UpdatedAt,
                       (SELECT COUNT(*) FROM Follows WHERE TargetId = u.Id AND TargetType = 'User') AS FollowersCount,
                       (SELECT COUNT(*) FROM Follows WHERE FollowerId = u.Id) AS FollowingCount
                FROM Users u
                LEFT JOIN UserProfiles p ON u.Id = p.UserId
                WHERE u.Id = @UserId LIMIT 1;";

            await using var cmd = new MySqlCommand(sql, connection);
            cmd.Parameters.AddWithValue("@UserId", request.UserId);

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
            {
                // 3. ĐỌC RoleId TỪ DATABASE VÀ MAP VÀO DTO
                return new UserProfileDto(
                    Email: reader.GetString("Email"),
                    FullName: reader.IsDBNull(reader.GetOrdinal("FullName")) ? "" : reader.GetString("FullName"),
                    Bio: reader.IsDBNull(reader.GetOrdinal("Bio")) ? "" : reader.GetString("Bio"),
                    AvatarUrl: reader.IsDBNull(reader.GetOrdinal("AvatarUrl")) ? null : reader.GetString("AvatarUrl"),
                    RoleId: reader.GetInt32("RoleId"), // <--- ĐỌC TỪ DB Ở ĐÂY
                    UpdatedAt: reader.IsDBNull(reader.GetOrdinal("UpdatedAt")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("UpdatedAt")),
                    FollowersCount: reader.GetInt32("FollowersCount"),
                    FollowingCount: reader.GetInt32("FollowingCount")
                );
            }
            return null;
        }
    }

    public record FollowedEntityDto(int Id, string Name, string? AvatarUrl, string Type);

    public record GetFollowingQuery(int UserId) : IRequest<List<FollowedEntityDto>>;

    public class GetFollowingQueryHandler : IRequestHandler<GetFollowingQuery, List<FollowedEntityDto>>
    {
        private readonly IConfiguration _configuration;
        public GetFollowingQueryHandler(IConfiguration configuration) => _configuration = configuration;

        public async Task<List<FollowedEntityDto>> Handle(GetFollowingQuery request, CancellationToken cancellationToken)
        {
            var connString = _configuration.GetConnectionString("SpotifyDb");
            await using var connection = new MySqlConnection(connString);
            await connection.OpenAsync(cancellationToken);

            const string sql = @"
                SELECT f.TargetId AS Id, p.FullName AS Name, p.AvatarUrl AS AvatarUrl, f.TargetType AS Type
                FROM Follows f
                JOIN UserProfiles p ON f.TargetId = p.UserId
                WHERE f.FollowerId = @UserId AND f.TargetType = 'User'
                
                UNION ALL
                
                SELECT f.TargetId AS Id, a.Name AS Name, COALESCE(a.AvatarUrl, (SELECT MAX(CoverImageUrl) FROM Albums WHERE ArtistId = a.Id)) AS AvatarUrl, f.TargetType AS Type
                FROM Follows f
                JOIN Artists a ON f.TargetId = a.Id
                WHERE f.FollowerId = @UserId AND f.TargetType = 'Artist';";

            await using var cmd = new MySqlCommand(sql, connection);
            cmd.Parameters.AddWithValue("@UserId", request.UserId);

            var result = new List<FollowedEntityDto>();
            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                result.Add(new FollowedEntityDto(
                    Id: reader.GetInt32("Id"),
                    Name: reader.IsDBNull(reader.GetOrdinal("Name")) ? "Unknown" : reader.GetString("Name"),
                    AvatarUrl: reader.IsDBNull(reader.GetOrdinal("AvatarUrl")) ? null : reader.GetString("AvatarUrl"),
                    Type: reader.GetString("Type")
                ));
            }
            return result;
        }
    }
}
