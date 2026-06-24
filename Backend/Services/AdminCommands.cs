using Backend.Data.Security;
using MediatR;
using MySqlConnector;
using System.ComponentModel.DataAnnotations;

namespace Backend.Services
{
    public sealed record CreateArtistCommand(
        [Required] string Username, 
        [Required][EmailAddress] string Email, 
        [Required][MinLength(6)] string Password, 
        [Required] string ArtistName
    ) : IRequest<string>;

    public class CreateArtistCommandHandler : IRequestHandler<CreateArtistCommand, string>
    {
        private readonly IConfiguration _configuration;
        private readonly IPasswordHasher _passwordHasher;

        public CreateArtistCommandHandler(IConfiguration configuration, IPasswordHasher passwordHasher)
        {
            _configuration = configuration;
            _passwordHasher = passwordHasher;
        }

        public async Task<string> Handle(CreateArtistCommand request, CancellationToken cancellationToken)
        {
            var connString = _configuration.GetConnectionString("SpotifyDb");
            await using var connection = new MySqlConnection(connString);
            await connection.OpenAsync(cancellationToken);

            var passwordHash = _passwordHasher.HashPassword(request.Password);
            
            // Bắt đầu Transaction để đảm bảo an toàn cho cả 3 bảng
            await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
            try
            {
                // 1. Lưu vào bảng Users (RoleId = 2 dành cho Artist)
                const string insertUserSql = @"
                    INSERT INTO Users (Username, Email, PasswordHash, RoleId) 
                    VALUES (@Username, @Email, @PasswordHash, 2);
                    SELECT LAST_INSERT_ID();"; // Lấy ID vừa tạo
                    
                await using var userCmd = new MySqlCommand(insertUserSql, connection, transaction);
                userCmd.Parameters.AddWithValue("@Username", request.Username);
                userCmd.Parameters.AddWithValue("@Email", request.Email);
                userCmd.Parameters.AddWithValue("@PasswordHash", passwordHash);
                var userId = Convert.ToInt32(await userCmd.ExecuteScalarAsync(cancellationToken));

                // 2. Lưu vào bảng UserProfiles
                const string insertProfileSql = @"
                    INSERT INTO UserProfiles (UserId, FullName, Bio) 
                    VALUES (@UserId, @ArtistName, 'Hồ sơ nghệ sĩ mới');";
                await using var profileCmd = new MySqlCommand(insertProfileSql, connection, transaction);
                profileCmd.Parameters.AddWithValue("@UserId", userId);
                profileCmd.Parameters.AddWithValue("@ArtistName", request.ArtistName);
                await profileCmd.ExecuteNonQueryAsync(cancellationToken);

                // 3. Lưu vào bảng Artists (Bắt buộc phải có để up nhạc)
                const string insertArtistSql = @"
                    INSERT INTO Artists (Name, UserId) 
                    VALUES (@ArtistName, @UserId);";
                await using var artistCmd = new MySqlCommand(insertArtistSql, connection, transaction);
                artistCmd.Parameters.AddWithValue("@ArtistName", request.ArtistName);
                artistCmd.Parameters.AddWithValue("@UserId", userId);
                await artistCmd.ExecuteNonQueryAsync(cancellationToken);

                await transaction.CommitAsync(cancellationToken);
                return $"Đã cấp tài khoản Nghệ sĩ thành công! UserId: {userId}";
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw new Exception("Lỗi hệ thống khi tạo tài khoản Nghệ sĩ.");
            }
        }
    }
}