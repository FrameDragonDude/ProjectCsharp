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
