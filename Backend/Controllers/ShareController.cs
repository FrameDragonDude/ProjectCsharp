using Backend.Data;
using Backend.Domain.Entities;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Backend.Infrastructure.Data;
using System.Security.Claims;

namespace Backend.Controllers;

[ApiController]
[Route("api/shares")]
[Authorize]
public class ShareController(TuneVaultDbContext dbContext, IMusicCatalogRepository repository) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> ShareMedia([FromBody] ShareRequest request)
    {
        var senderIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(senderIdValue, out var senderId)) return Unauthorized();

        var share = new MediaShare
        {
            SenderUserId = senderId,
            ReceiverUserId = request.ReceiverUserId,
            MediaItemId = request.MediaItemId,
            PlaylistId = request.PlaylistId,
            SharedAt = DateTime.UtcNow
        };

        dbContext.MediaShares.Add(share);
        await dbContext.SaveChangesAsync();

        return Ok(share);
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
}

public class ShareRequest
{
    public int ReceiverUserId { get; set; }
    public int? MediaItemId { get; set; }
    public int? PlaylistId { get; set; }
}


