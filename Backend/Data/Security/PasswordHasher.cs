namespace Backend.Data.Security
{
    public interface IPasswordHasher
    {
        string HashPassword(string password);
        bool VerifyPassword(string password, string passwordHash);
    }

    public class PasswordHasher : IPasswordHasher
    {
        public string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }

        public bool VerifyPassword(string password, string passwordHash)
        {
            try 
            {
                return BCrypt.Net.BCrypt.Verify(password, passwordHash);
            }
            catch (BCrypt.Net.SaltParseException)
            {
                return false; 
            }
        }
    }
}