using Microsoft.EntityFrameworkCore;
using Pomelo.EntityFrameworkCore.MySql.Infrastructure;
using Backend.Hubs;
using Backend.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
	options.AddPolicy("Frontend", policy =>
	{
		policy.AllowAnyHeader()
			  .AllowAnyMethod()
			  .AllowAnyOrigin();
	});
});

builder.Services.AddScoped<Backend.Data.IMusicCatalogRepository, Backend.Data.MySqlMusicCatalogRepository>();
// Register EF Core DbContext
builder.Services.AddDbContext<Backend.Data.MusicDbContext>(options =>
{
	var cs = builder.Configuration.GetConnectionString("SpotifyDb");
	if (!string.IsNullOrEmpty(cs))
	{
		options.UseMySql(cs, ServerVersion.AutoDetect(cs));
	}
});

// Register IDbConnection for Dapper usage
builder.Services.AddTransient<System.Data.IDbConnection>(sp =>
{
	var cs = builder.Configuration.GetConnectionString("SpotifyDb");
	return new MySqlConnector.MySqlConnection(cs);
});

// Register Dapper helper
builder.Services.AddTransient<Backend.Infrastructure.DapperQueries>();

builder.Services.AddSignalR();

builder.Services.AddHttpClient<IClaudeRecommendationService, ClaudeRecommendationService>();
var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseStaticFiles();
app.UseHttpsRedirection();
app.UseCors("Frontend");

app.MapControllers();

app.MapHub<NotificationHub>("/hubs/notifications");

app.Run();
