using Backend.Data.Security;
using MediatR;
using MySqlConnector;
using System.ComponentModel.DataAnnotations;

namespace Backend.Models
{
    public sealed record RegisterCommand(
        [Required(ErrorMessage = "Tên đăng nhập không được để trống")] string Username, 
        [Required(ErrorMessage = "Email không được để trống")]
        [EmailAddress(ErrorMessage = "Email không đúng định dạng! Vui lòng nhập lại.")] string Email, 
        [MinLength(6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự.")]
        [RegularExpression(@"^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_]).+$", 
            ErrorMessage = "Mật khẩu phải bao gồm ít nhất 1 chữ cái, 1 chữ số và 1 ký tự đặc biệt.")]
        string Password,
        [Required(ErrorMessage = "Họ và tên không được để trống")] string FullName
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
                if (exists != null) throw new Exception("Username hoặc Email đã được sử dụng.");
            }

            var userId = Guid.NewGuid().ToString();
            var passwordHash = _passwordHasher.HashPassword(request.Password);

            await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
            try
            {
                const string insertUserSql = @"
                    INSERT INTO Users (Id, Username, Email, PasswordHash) 
                    VALUES (@Id, @Username, @Email, @PasswordHash);";
                
                await using (var userCmd = new MySqlCommand(insertUserSql, connection, transaction))
                {
                    userCmd.Parameters.AddWithValue("@Id", userId);
                    userCmd.Parameters.AddWithValue("@Username", request.Username);
                    userCmd.Parameters.AddWithValue("@Email", request.Email);
                    userCmd.Parameters.AddWithValue("@PasswordHash", passwordHash);
                    await userCmd.ExecuteNonQueryAsync(cancellationToken);
                }

                const string insertProfileSql = @"
                    INSERT INTO UserProfiles (UserId, FullName, Bio) 
                    VALUES (@UserId, @FullName, 'Chào mừng đến với TuneVault!');";

                await using (var profileCmd = new MySqlCommand(insertProfileSql, connection, transaction))
                {
                    profileCmd.Parameters.AddWithValue("@UserId", userId);
                    profileCmd.Parameters.AddWithValue("@FullName", request.FullName);
                    await profileCmd.ExecuteNonQueryAsync(cancellationToken);
                }

                await transaction.CommitAsync(cancellationToken);
                return userId;
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
                throw new Exception("Tài khoản hoặc mật khẩu không chính xác.");
            }

            var id = AuthDbHelper.ConvertDbValueToString(reader["Id"], "Id"); 
            var username = AuthDbHelper.ConvertDbValueToString(reader["Username"], "Username");
            var email = AuthDbHelper.ConvertDbValueToString(reader["Email"], "Email");
            var dbPasswordHash = AuthDbHelper.ConvertDbValueToString(reader["PasswordHash"], "PasswordHash");

            if (!_passwordHasher.VerifyPassword(request.Password, dbPasswordHash))
            {
                throw new Exception("Tài khoản hoặc mật khẩu không chính xác.");
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
