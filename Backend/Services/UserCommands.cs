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
                SET FullName = @FullName, Bio = @Bio, AvatarUrl = @AvatarUrl
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
        [Required(ErrorMessage = "MÃ£ Ä‘á»‘i tÆ°á»£ng theo dÃµi khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng.")] 
        int TargetId,
        [Required]
        [RegularExpression("^(User|Artist)$", ErrorMessage = "Loáº¡i Ä‘á»‘i tÆ°á»£ng (TargetType) chá»‰ Ä‘Æ°á»£c phÃ©p lÃ  'User' hoáº·c 'Artist'.")]
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
                
                return $"ÄÃ£ theo dÃµi {request.TargetType} thÃ nh cÃ´ng!";
            }
        }
    }

    public record UserProfileDto(string Email, string FullName, string Bio, string? AvatarUrl, DateTime? UpdatedAt);
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

            const string sql = @"
                SELECT u.Email, p.FullName, p.Bio, p.AvatarUrl, p.UpdatedAt
                FROM Users u
                LEFT JOIN UserProfiles p ON u.Id = p.UserId
                WHERE u.Id = @UserId LIMIT 1;";

            await using var cmd = new MySqlCommand(sql, connection);
            cmd.Parameters.AddWithValue("@UserId", request.UserId);

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
            {
                return new UserProfileDto(
                Email: reader.GetString("Email"),
                FullName: reader.IsDBNull(reader.GetOrdinal("FullName")) ? "" : reader.GetString("FullName"),
                Bio: reader.IsDBNull(reader.GetOrdinal("Bio")) ? "" : reader.GetString("Bio"),
                AvatarUrl: reader.IsDBNull(reader.GetOrdinal("AvatarUrl")) ? null : reader.GetString("AvatarUrl"),
                UpdatedAt: reader.IsDBNull(reader.GetOrdinal("UpdatedAt")) ? null : reader.GetDateTime("UpdatedAt")
                );
            }
            return null;
        }
    }
}
