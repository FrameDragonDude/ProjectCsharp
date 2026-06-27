using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Backend.Data
{
    public class MusicDbContextFactory : IDesignTimeDbContextFactory<MusicDbContext>
    {
        public MusicDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<MusicDbContext>();
            
            // Chuỗi kết nối trực tiếp lên mây Clever Cloud của nhóm ông
            var connectionString = "Server=bzwwmtf6akds54elltsb-mysql.services.clever-cloud.com;Port=3306;Database=bzwwmtf6akds54elltsb;User Id=uyq64opaiyxs3vew;Password=qvw5N8q8Vk7K63UhvSDk;Allow User Variables=true;";

            // Cấu hình sử dụng MySQL với phiên bản tự động nhận diện
            optionsBuilder.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString));

            return new MusicDbContext(optionsBuilder.Options);
        }
    }
}