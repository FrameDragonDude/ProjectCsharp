using Backend.Data.Security;
using MediatR;
using MySqlConnector;
using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public sealed record RegisterCommand(
        [Required(ErrorMessage = "Tên dang nh?p không du?c d? tr?ng")] string Username,
        [Required(ErrorMessage = "Email không du?c d? tr?ng")]
        [EmailAddress(ErrorMessage = "Email không dúng d?nh d?ng! Vui lòng nh?p l?i.")] string Email,
        [MinLength(6, ErrorMessage = "M?t kh?u ph?i có ít nh?t 6 ký t?.")]
        [RegularExpression(@"^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_]).+$",
            ErrorMessage = "M?t kh?u ph?i bao g?m ít nh?t 1 ch? cái, 1 ch? s? và 1 ký t? d?c bi?t.")]
        string Password,
        [Required(ErrorMessage = "H? và tên không du?c d? tr?ng")] string FullName
    ) : IRequest<string>;

    public class RegisterCommandHandler : IRequestHandler<RegisterCommand, string>
    {
        private readonly IConfiguration _configuration;
        private readonly IPasswordHasher _passwordHasher;

        public RegisterCommandHandler(IConfiguration configuration, IPasswordHasher passwordHasher)
        {
            _configuration = configuration;
            _passwordHasher = passwordHasher;
        }

        private string ConnectionString => _configuration.GetConnectionString("SpotifyDb")
            ?? throw new InvalidOperationException("Missing database connection string.");

        public async Task<string> Handle(RegisterCommand request, CancellationToken cancellationToken)
        {
            await using var connection = new MySqlConnection(ConnectionString);
            await connection.OpenAsync(cancellationToken);

            const string checkSql = "SELECT 1 FROM Users WHERE Email = @Email OR Username = @Username LIMIT 1;";
            await using (var checkCmd = new MySqlCommand(checkSql, connection))
            {
                checkCmd.Parameters.AddWithValue("@Email", request.Email);
                checkCmd.Parameters.AddWithValue("@Username", request.Username);
                var exists = await checkCmd.ExecuteScalarAsync(cancellationToken);
                if (exists != null) throw new Exception("Username ho?c Email dã du?c s? d?ng.");
            }

            var passwordHash = _passwordHasher.HashPassword(request.Password);

            await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
            try
            {
                const string insertUserSql = @"
INSERT INTO Users (Username, Email, PasswordHash, RoleId)
VALUES (@Username, @Email, @PasswordHash, @RoleId);";

                await using (var userCmd = new MySqlCommand(insertUserSql, connection, transaction))
                {
                    userCmd.Parameters.AddWithValue("@Username", request.Username);
                    userCmd.Parameters.AddWithValue("@Email", request.Email);
                    userCmd.Parameters.AddWithValue("@PasswordHash", passwordHash);
                    userCmd.Parameters.AddWithValue("@RoleId", 3);
                    await userCmd.ExecuteNonQueryAsync(cancellationToken);
                }

                var userIdCommand = new MySqlCommand("SELECT LAST_INSERT_ID();", connection, transaction);
                var userId = Convert.ToInt64(await userIdCommand.ExecuteScalarAsync(cancellationToken));

                const string insertProfileSql = @"
INSERT INTO UserProfiles (UserId, FullName, Bio)
VALUES (@UserId, @FullName, 'Chào m?ng d?n v?i TuneVault!');";

                await using (var profileCmd = new MySqlCommand(insertProfileSql, connection, transaction))
                {
                    profileCmd.Parameters.AddWithValue("@UserId", userId);
                    profileCmd.Parameters.AddWithValue("@FullName", request.FullName);
                    await profileCmd.ExecuteNonQueryAsync(cancellationToken);
                }

                await transaction.CommitAsync(cancellationToken);
                return userId.ToString();
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        }
    }

    public sealed record LoginCommand(string EmailOrUsername, string Password) : IRequest<string>;

    public class LoginCommandHandler : IRequestHandler<LoginCommand, string>
    {
        private readonly IConfiguration _configuration;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IJwtTokenGenerator _tokenGenerator;

        public LoginCommandHandler(IConfiguration configuration, IPasswordHasher passwordHasher, IJwtTokenGenerator tokenGenerator)
        {
            _configuration = configuration;
            _passwordHasher = passwordHasher;
            _tokenGenerator = tokenGenerator;
        }

        private string ConnectionString => _configuration.GetConnectionString("SpotifyDb")
            ?? throw new InvalidOperationException("Missing database connection string.");

        public async Task<string> Handle(LoginCommand request, CancellationToken cancellationToken)
        {
            await using var connection = new MySqlConnection(ConnectionString);
            await connection.OpenAsync(cancellationToken);

            const string sql = @"
                SELECT Id, Username, Email, PasswordHash
                FROM Users
                WHERE Email = @EmailOrUsername OR Username = @EmailOrUsername
                LIMIT 1;";

            await using var command = new MySqlCommand(sql, connection);
            command.Parameters.AddWithValue("@EmailOrUsername", request.EmailOrUsername);

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            if (!await reader.ReadAsync(cancellationToken))
            {
                throw new Exception("Tài kho?n ho?c m?t kh?u không chính xác.");
            }

            var id = Convert.ToInt32(reader["Id"]);
            var username = AuthDbHelper.ConvertDbValueToString(reader["Username"], "Username");
            var email = AuthDbHelper.ConvertDbValueToString(reader["Email"], "Email");
            var dbPasswordHash = AuthDbHelper.ConvertDbValueToString(reader["PasswordHash"], "PasswordHash");

            if (!_passwordHasher.VerifyPassword(request.Password, dbPasswordHash))
            {
                throw new Exception("Tài kho?n ho?c m?t kh?u không chính xác.");
            }

            var user = new User
            {
                Id = id,
                Username = username,
                Email = email
            };

            return _tokenGenerator.GenerateToken(user);
        }
    }

    internal static class AuthDbHelper
    {
        public static string ConvertDbValueToString(object value, string columnName)
        {
            if (value == null || value == DBNull.Value) return string.Empty;

            return value switch
            {
                string text => text,
                Guid guid => guid.ToString(),
                byte[] bytes when bytes.Length == 16 => new Guid(bytes).ToString(),
                byte[] bytes => System.Text.Encoding.UTF8.GetString(bytes),
                _ => Convert.ToString(value, System.Globalization.CultureInfo.InvariantCulture)
                     ?? throw new InvalidOperationException($"Unable to convert column '{columnName}' to string.")
            };
        }
    }
}
