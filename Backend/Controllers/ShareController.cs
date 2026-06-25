using Backend.Data;
using Backend.Domain.Entities;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Infrastructure.Data;
using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using Backend.Hubs;
using System.Text.Json;
using System.Runtime.CompilerServices;
using System.Data;

namespace Backend.Controllers;

[ApiController]
[Route("api/shares")]
[Authorize]
public class ShareController(TuneVaultDbContext dbContext, IMusicCatalogRepository repository, IHubContext<NotificationHub> hubContext) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> ShareMedia([FromBody] ShareRequest request)
    {
        var senderIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(senderIdValue, out var senderId)) return Unauthorized();

        if (senderId == request.ReceiverUserId)
        {
            return BadRequest("Bạn không thể tự chia sẻ bài hát hoặc playlist cho chính mình.");
        }

        var share = new MediaShare
        {
            SenderUserId = senderId,
            ReceiverUserId = request.ReceiverUserId,
            MediaItemId = request.MediaItemId,
            PlaylistId = request.PlaylistId,
            SharedAt = DateTime.UtcNow
        };
        dbContext.MediaShares.Add(share);

        var sender = await dbContext.UserProfiles.FirstOrDefaultAsync(p => p.UserId == senderId);
        var payload = JsonSerializer.Serialize(new
        {
            SenderUserId = senderId,
            SenderName = sender?.FullName ?? "Ai đó",
            MediaItemId = request.MediaItemId,
            PlaylistId = request.PlaylistId,
            Url = "/share"
        }, new JsonSerializerOptions { Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping });

        var notif = new Notification
        {
            UserId = request.ReceiverUserId,
            Type = "Share",
            PayloadJson = payload,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };
        dbContext.Notifications.Add(notif);
        await dbContext.SaveChangesAsync();

        await hubContext.Clients.Group($"user:{request.ReceiverUserId}").SendAsync("NotificationReceived", new
        {
            id = notif.Id.ToString(),
            userId = notif.UserId.ToString(),
            type = notif.Type,
            payloadJson = notif.PayloadJson,
            isRead = notif.IsRead,
            createdAt = notif.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
        });

        return Ok(share);
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsersForShare()
    {

        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdValue, out var userId)) return Unauthorized();

        var users = await dbContext.UserProfiles
             .Where(p => p.UserId != userId)
             .Select(p => new { id = p.UserId, fullName = p.FullName })
             .ToListAsync();

        return Ok(users);
    }

    [HttpGet("inbox")]
    public async Task<ActionResult> GetInbox()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdValue, out var userId)) return Unauthorized();

        var shares = await dbContext.MediaShares
            .Where(s => s.ReceiverUserId == userId)
            .OrderByDescending(s => s.SharedAt)
            .ToListAsync();

        var results = new List<object>();

        foreach (var share in shares)
        {
            var sender = await dbContext.UserProfiles.FirstOrDefaultAsync(p => p.UserId == share.SenderUserId);
            var senderName = sender?.FullName ?? "Someone";

            if (share.MediaItemId.HasValue)
            {
                var media = await repository.GetMediaItemByIdAsync(share.MediaItemId.Value.ToString());
                if (media != null)
                {
                    results.Add(new { share.Id, SenderName = senderName, Item = media, Type = "Media", share.SharedAt });
                }
            }
            else if (share.PlaylistId.HasValue)
            {
                var playlist = await repository.GetPlaylistByIdAsync(share.PlaylistId.Value.ToString());
                if (playlist != null)
                {
                    results.Add(new { share.Id, SenderName = senderName, Item = playlist, Type = "Playlist", share.SharedAt });
                }
            }
        }

        return Ok(results);
    }

    [HttpGet("sent")]
    public async Task<ActionResult> GetSent()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdValue, out var userId)) return Unauthorized();

        var shares = await dbContext.MediaShares
            .Where(s => s.SenderUserId == userId)
            .OrderByDescending(s => s.SharedAt)
            .ToListAsync();

        var results = new List<object>();
        foreach (var share in shares)
        {

            var receiver = await dbContext.UserProfiles.FirstOrDefaultAsync(p => p.UserId == share.ReceiverUserId);
            var receiverName = receiver?.FullName ?? "Someone";

            if (share.MediaItemId.HasValue)
            {
                var media = await repository.GetMediaItemByIdAsync(share.MediaItemId.Value.ToString());
                if (media != null)
                {
                    results.Add(new { share.Id, senderName = receiverName, item = media, type = "Media", share.SharedAt });
                }
            }
            else if (share.PlaylistId.HasValue)
            {
                var playlist = await repository.GetPlaylistByIdAsync(share.PlaylistId.Value.ToString());
                if (playlist != null)
                {
                    results.Add(new { share.Id, senderName = receiverName, item = playlist, type = "Playlist", share.SharedAt });
                }
            }
        }
        return Ok(results);
    }
}

public class ShareRequest
{
    public int ReceiverUserId { get; set; }
    public int? MediaItemId { get; set; }
    public int? PlaylistId { get; set; }
}


