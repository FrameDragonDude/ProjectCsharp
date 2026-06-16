using Backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Backend.Hubs;
using Backend.Services;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });


builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.AllowAnyHeader()
              .AllowAnyMethod()
              .AllowAnyOrigin();
    });
});

// Register EF Core DbContext with MySQL
builder.Services.AddDbContext<TuneVaultDbContext>(options =>
{
    var cs = builder.Configuration.GetConnectionString("SpotifyDb");
    if (!string.IsNullOrEmpty(cs))
    {
        options.UseMySql(cs, ServerVersion.AutoDetect(cs));
    }
});

builder.Services.AddSignalR();

builder.Services.AddHttpClient<IClaudeRecommendationService, ClaudeRecommendationService>();
var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Setup Static Files for "storage" folder
var storagePath = Path.Combine(Directory.GetCurrentDirectory(), "storage");
if (!Directory.Exists(storagePath))
{
    Directory.CreateDirectory(storagePath);
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(storagePath),
    RequestPath = "/storage"
});

// Also enable default wwwroot static files
app.UseStaticFiles();

app.UseCors("Frontend");

app.UseAuthorization();

app.MapControllers();

app.MapHub<NotificationHub>("/hubs/notifications");

app.Run();
