using Backend.Models;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Backend.Hubs;
using Backend.Infrastructure.Data;
using Backend.Domain.Entities;

namespace Backend.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class FollowController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly TuneVaultDbContext _context;
        public FollowController(IMediator mediator, IHubContext<NotificationHub> hubContext, TuneVaultDbContext context)
        {
            _mediator = mediator;
            _hubContext = hubContext;
            _context = context;
        }

        [HttpPost("{targetId}")]
        public async Task<IActionResult> ToggleFollow(int targetId, [FromQuery] string type = "User")
        {
            if (type != "User" && type != "Artist")
            {
                return BadRequest("Loại đối tượng (type) chỉ được phép là 'User' hoặc 'Artist'..");
            }

            var myUserIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(myUserIdValue, out var myUserId)) return Unauthorized();

            if (type == "User" && myUserId == targetId)
            {
                return BadRequest("Bạn không thể tự theo dõi chính mình.");
            }

            var senderProfile = await _context.UserProfiles.FirstOrDefaultAsync(p => p.UserId == myUserId);
            string senderName = senderProfile?.FullName ?? "Ai đó";

            var command = new ToggleFollowCommand(myUserId, targetId, type);
            var resultMessage = await _mediator.Send(command);

            string statusText = resultMessage?.ToString() ?? "";
            bool isUnfollow = statusText.Contains("hủy", StringComparison.OrdinalIgnoreCase) ||
                              statusText.Contains("unfollow", StringComparison.OrdinalIgnoreCase);

            if (!isUnfollow)
            {
                var notification = new Notification
                {
                    UserId = targetId,
                    Type = "Follow",
                    PayloadJson = JsonSerializer.Serialize(new { SenderName = senderName }),
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();


                await _hubContext.Clients.Group($"user:{targetId}").SendAsync("NotificationReceived", new
                {
                    id = notification.Id.ToString(),
                    userId = notification.UserId.ToString(),
                    type = notification.Type,
                    payloadJson = notification.PayloadJson,
                    isRead = notification.IsRead,
                    createdAt = notification.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
                });
            }

            return Ok(resultMessage);
        }
    }
}
