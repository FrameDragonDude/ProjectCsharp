using Backend.Data;
using Backend.Domain.Entities;
using Backend.Hubs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Backend.Infrastructure.Data;
using System.Security.Claims;

namespace Backend.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationController(TuneVaultDbContext dbContext, IHubContext<NotificationHub> hubContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Notification>>> GetNotifications()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var notifications = await dbContext.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .ToListAsync();

        return Ok(notifications);
    }

    [HttpPost("{id}/read")]
    public async Task<IActionResult> MarkAsRead(string id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var notification = await dbContext.Notifications.FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);
        if (notification != null)
        {
            notification.IsRead = true;
            await dbContext.SaveChangesAsync();
        }

        return Ok();
    }

    [HttpPost("test-send")]
    public async Task<IActionResult> TestSendNotification([FromBody] SendNotificationRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var notification = new Notification
        {
            UserId = userId,
            Type = "System",
            PayloadJson = System.Text.Json.JsonSerializer.Serialize(new { request.Title, request.Message })
        };

        dbContext.Notifications.Add(notification);
        await dbContext.SaveChangesAsync();

        await hubContext.Clients.Group(userId).SendAsync("ReceiveNotification", notification);

        return Ok(notification);
    }
}

public class SendNotificationRequest
{
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
