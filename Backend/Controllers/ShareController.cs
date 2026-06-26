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
            return BadRequest("Bạn không thể tự chia sẻ nội dung cho chính mình.");
        }

        var senderProfile = await dbContext.UserProfiles.FirstOrDefaultAsync(p => p.UserId == senderId);
        var receiverProfile = await dbContext.UserProfiles.FirstOrDefaultAsync(p => p.UserId == request.ReceiverUserId);

        string senderName = senderProfile?.FullName ?? "Ai đó";
        string receiverName = receiverProfile?.FullName ?? "Ai đó";
        var createdAt = DateTime.UtcNow;


        var receiverPayload = JsonSerializer.Serialize(new
        {
            SenderUserId = senderId,
            SenderName = senderName,
            MediaItemId = request.MediaItemId,
            PlaylistId = request.PlaylistId,
            AlbumId = request.AlbumId,
            ArtistId = request.ArtistId,
            Url = "/share-inbox"
        }, new JsonSerializerOptions { Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping });

        var receiverNotif = new Notification
        {
            UserId = request.ReceiverUserId,
            Type = "Share",
            PayloadJson = receiverPayload,
            IsRead = false,
            CreatedAt = createdAt
        };
        dbContext.Notifications.Add(receiverNotif);


        var senderPayload = JsonSerializer.Serialize(new
        {
            ReceiverUserId = request.ReceiverUserId,
            ReceiverName = receiverName,
            MediaItemId = request.MediaItemId,
            PlaylistId = request.PlaylistId,
            AlbumId = request.AlbumId,
            ArtistId = request.ArtistId,
            Url = "/share-inbox"
        }, new JsonSerializerOptions { Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping });

        var senderNotif = new Notification
        {
            UserId = senderId,
            Type = "ShareSent",
            PayloadJson = senderPayload,
            IsRead = true,
            CreatedAt = createdAt
        };
        dbContext.Notifications.Add(senderNotif);

        await dbContext.SaveChangesAsync();


        await hubContext.Clients.Group($"user:{request.ReceiverUserId}").SendAsync("NotificationReceived", new
        {
            id = receiverNotif.Id.ToString(),
            userId = receiverNotif.UserId.ToString(),
            type = receiverNotif.Type,
            payloadJson = receiverNotif.PayloadJson,
            isRead = receiverNotif.IsRead,
            createdAt = receiverNotif.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
        });

        return Ok(new { message = "Chia sẻ thành công vào hệ thống thông báo!" });
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

        var shareNotifications = await dbContext.Notifications
            .Where(n => n.UserId == userId && n.Type == "Share")
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();

        return Ok(await ProcessNotificationToShareList(shareNotifications, isInbox: true));
    }

    [HttpGet("sent")]
    public async Task<ActionResult> GetSent()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdValue, out var userId)) return Unauthorized();


        var sentNotifications = await dbContext.Notifications
            .Where(n => n.UserId == userId && n.Type == "ShareSent")
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();

        return Ok(await ProcessNotificationToShareList(sentNotifications, isInbox: false));
    }


    private async Task<List<object>> ProcessNotificationToShareList(List<Notification> notifications, bool isInbox)
    {
        var results = new List<object>();

        foreach (var notif in notifications)
        {
            try
            {
                using var doc = JsonDocument.Parse(notif.PayloadJson);
                var root = doc.RootElement;


                string displayUserName = isInbox
                    ? (root.TryGetProperty("SenderName", out var sName) ? (sName.GetString() ?? "Someone") : "Someone")
                    : (root.TryGetProperty("ReceiverName", out var rName) ? (rName.GetString() ?? "Someone") : "Someone");

                // Nhánh 1: Chia sẻ bài hát/video
                if (root.TryGetProperty("MediaItemId", out var mediaIdProp) && mediaIdProp.ValueKind != JsonValueKind.Null)
                {
                    var media = await repository.GetMediaItemByIdAsync(mediaIdProp.GetInt32().ToString());
                    if (media != null)
                    {
                        results.Add(new { id = notif.Id, senderName = displayUserName, item = media, type = "Media", sharedAt = notif.CreatedAt });
                    }
                }

                else if (root.TryGetProperty("PlaylistId", out var playlistIdProp) && playlistIdProp.ValueKind != JsonValueKind.Null)
                {
                    var playlist = await repository.GetPlaylistByIdAsync(playlistIdProp.GetInt32().ToString());
                    if (playlist != null)
                    {
                        results.Add(new { id = notif.Id, senderName = displayUserName, item = playlist, type = "Playlist", sharedAt = notif.CreatedAt });
                    }
                }

                else if (root.TryGetProperty("AlbumId", out var albumIdProp) && albumIdProp.ValueKind != JsonValueKind.Null)
                {
                    int albumId = albumIdProp.GetInt32();
                    var album = await dbContext.Albums.FirstOrDefaultAsync(a => a.Id == albumId);
                    if (album != null)
                    {

                        var albumItem = new { id = album.Id, title = album.Title, coverImageUrl = album.CoverImageUrl, mediaType = "Audio" };
                        results.Add(new { id = notif.Id, senderName = displayUserName, item = albumItem, type = "Album", sharedAt = notif.CreatedAt });
                    }
                }

                else if (root.TryGetProperty("ArtistId", out var artistIdProp) && artistIdProp.ValueKind != JsonValueKind.Null)
                {
                    int artistId = artistIdProp.GetInt32();
                    var artist = await dbContext.Artists.FirstOrDefaultAsync(a => a.Id == artistId);
                    if (artist != null)
                    {
                        var artistItem = new { id = artist.Id, title = artist.Name, coverImageUrl = artist.AvatarUrl, mediaType = "Audio" };
                        results.Add(new { id = notif.Id, senderName = displayUserName, item = artistItem, type = "Artist", sharedAt = notif.CreatedAt });
                    }
                }
            }
            catch
            {
                continue;
            }
        }
        return results;
    }
}

public class ShareRequest
{
    public int ReceiverUserId { get; set; }
    public int? MediaItemId { get; set; }
    public int? PlaylistId { get; set; }
    public int? AlbumId { get; set; }
    public int? ArtistId { get; set; }
}