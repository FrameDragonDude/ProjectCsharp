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
public class NotificationController(IMusicCatalogRepository repository) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetNotifications(CancellationToken cancellationToken)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdValue, out var userId)) return Unauthorized();
        var notifications = await repository.GetNotificationsAsync(userId.ToString(), cancellationToken);
        return Ok(notifications);
    }

    [HttpPatch("{id}/read")]
    public async Task<IActionResult> MarAsRead(int id, CancellationToken cancellationToken)
    {
        await repository.MarkNotificationAsReadAsync(id.ToString(), cancellationToken);
        return NoContent();
    }

    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllAsRead( CancellationToken cancellationToken)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdValue, out var userId)) return Unauthorized();

        await repository.MarkAllNotificationsAsReadAsync(userId.ToString(), cancellationToken);
        return NoContent();
    }

}

