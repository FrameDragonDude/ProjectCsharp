using MediatR;
using MySqlConnector;
using System.ComponentModel.DataAnnotations;

namespace Backend.Services
{
    public sealed record ChangeUserRoleCommand(
        [Required] string Keyword, 
        [Required] string Action, 
        string? ArtistName
    ) : IRequest<string>;

    public class ChangeUserRoleCommandHandler : IRequestHandler<ChangeUserRoleCommand, string>
    {
        private readonly IConfiguration _configuration;

        public ChangeUserRoleCommandHandler(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task<string> Handle(ChangeUserRoleCommand request, CancellationToken cancellationToken)
        {
            var connString = _configuration.GetConnectionString("SpotifyDb");
            await using var connection = new MySqlConnection(connString);
            await connection.OpenAsync(cancellationToken);

            const string findUserSql = "SELECT Id, RoleId FROM Users WHERE Username = @Keyword OR Email = @Keyword LIMIT 1;";
            int userId = 0;
            int currentRoleId = 0;
            
            await using (var findCmd = new MySqlCommand(findUserSql, connection))
            {
                findCmd.Parameters.AddWithValue("@Keyword", request.Keyword);
                await using var reader = await findCmd.ExecuteReaderAsync(cancellationToken);
                if (await reader.ReadAsync(cancellationToken))
                {
                    userId = reader.GetInt32("Id");
                    currentRoleId = reader.GetInt32("RoleId");
                }
            }

            if (userId == 0)
            {
                throw new Exception("Không tìm thấy người dùng với Username hoặc Email này.");
            }

            await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
            try
            {
                if (request.Action.ToLower() == "upgrade")
                {
                    if (currentRoleId == 2) throw new Exception("Người dùng này đã là Nghệ sĩ rồi.");
                    if (string.IsNullOrWhiteSpace(request.ArtistName)) throw new Exception("Vui lòng cung cấp Nghệ danh.");

                    const string updateRoleSql = "UPDATE Users SET RoleId = 2 WHERE Id = @UserId;";
                    await using var updateRoleCmd = new MySqlCommand(updateRoleSql, connection, transaction);
                    updateRoleCmd.Parameters.AddWithValue("@UserId", userId);
                    await updateRoleCmd.ExecuteNonQueryAsync(cancellationToken);

                    const string insertArtistSql = @"
                        INSERT INTO Artists (Name, UserId) 
                        VALUES (@ArtistName, @UserId)
                        ON DUPLICATE KEY UPDATE Name = @ArtistName;";
                    await using var artistCmd = new MySqlCommand(insertArtistSql, connection, transaction);
                    artistCmd.Parameters.AddWithValue("@ArtistName", request.ArtistName);
                    artistCmd.Parameters.AddWithValue("@UserId", userId);
                    await artistCmd.ExecuteNonQueryAsync(cancellationToken);

                    await transaction.CommitAsync(cancellationToken);
                    return $"Đã cấp quyền Nghệ sĩ thành công!";
                }
                else if (request.Action.ToLower() == "downgrade")
                {
                    if (currentRoleId == 3) throw new Exception("Người dùng này đang là User thường rồi.");
                    if (currentRoleId == 1) throw new Exception("Không thể giáng chức Admin!");

                    const string updateRoleSql = "UPDATE Users SET RoleId = 3 WHERE Id = @UserId;";
                    await using var updateRoleCmd = new MySqlCommand(updateRoleSql, connection, transaction);
                    updateRoleCmd.Parameters.AddWithValue("@UserId", userId);
                    await updateRoleCmd.ExecuteNonQueryAsync(cancellationToken);

                    await transaction.CommitAsync(cancellationToken);
                    return $"Đã hạ quyền tài khoản về User thường!";
                }
                else
                {
                    throw new Exception("Hành động không hợp lệ.");
                }
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                throw new Exception(ex.Message); 
            }
        }
    }
}