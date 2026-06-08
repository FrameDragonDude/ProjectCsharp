using Microsoft.AspNetCore.Identity;

namespace Backend.Data.Security
{
    public interface IPasswordHasher
    {
        string HashPassword(string password);
        bool VerifyPassword(string password, string passwordHash);
    }

    public class PasswordHasher : IPasswordHasher
    {
        private readonly PasswordHasher<object> _hasher = new PasswordHasher<object>();

        public string HashPassword(string password) => _hasher.HashPassword(new object(), password);

        public bool VerifyPassword(string password, string passwordHash)
        {
            var result = _hasher.VerifyHashedPassword(new object(), passwordHash, password);
            return result == PasswordVerificationResult.Success;
        }
    }
}