using Backend.Data;
using Backend.Hubs;
using Backend.Services;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace Backend.Controllers;

[Authorize]
[ApiController]
[Route("api")]
public sealed class SocialController(
    IMusicCatalogRepository repository,
    IClaudeRecommendationService recommendationService,
    IHubContext<NotificationHub> hubContext) : ControllerBase
{
    [HttpPost("play-histories")]
    public async Task<IActionResult> RecordPlayHistory([FromBody] RecordPlayHistoryCommand command, CancellationToken cancellationToken)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdValue, out var userId)) return Unauthorized();

        if (command.MediaItemId <= 0) return BadRequest("MediaItemId is required.");

        command = command with { UserId = userId };

        await repository.RecordPlayHistoryAsync(command, cancellationToken);
        return NoContent();
    }

    [HttpPost("media-shares")]
    public async Task<ActionResult<NotificationDto>> ShareMedia([FromBody] ShareMediaCommand command, CancellationToken cancellationToken)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdValue, out var senderId)) return Unauthorized();

        command = command with { SenderUserId = senderId };

        if (command.ReceiverUserId <= 0) return BadRequest("ReceiverUserId is required.");

        var hasMediaItem = command.MediaItemId.HasValue;
        var hasPlaylist = command.PlaylistId.HasValue;
        if (hasMediaItem == hasPlaylist) return BadRequest("Send exactly one of MediaItemId or PlaylistId.");

        var notification = await repository.ShareMediaAsync(command, cancellationToken);

        await hubContext.Clients.Group($"user:{command.ReceiverUserId}").SendAsync("NotificationReceived", notification, cancellationToken);
        return Ok(notification);
    }
    
    [HttpGet("recommendations/ai")]
    public async Task<ActionResult<IReadOnlyList<SongRecommendationDto>>> GetAiRecommendations([FromQuery] int count = 5, CancellationToken cancellationToken = default)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdValue)) return Unauthorized();

        try
        {
            var recommendations = await recommendationService.RecommendSongsAsync(userIdValue, count, cancellationToken);
            return Ok(recommendations);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Claude API key", StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, ex.Message);
        }
    }

    [HttpGet("social/notifications")]
    public async Task<ActionResult<IReadOnlyList<NotificationDto>>> GetNotifications(CancellationToken cancellationToken)
    {
        // BÓC TOKEN
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdValue)) return Unauthorized();

        return Ok(await repository.GetNotificationsAsync(userIdValue, cancellationToken));
    }

    [HttpPatch("notifications/{id}/read")]
    public async Task<ActionResult> MarAsRead(int id, CancellationToken cancellationToken)
    {
        await repository.MarkNotificationAsReadAsync(id.ToString(), cancellationToken);
        return NoContent();
    }

    [HttpPatch("notifications/read-all")]
    public async Task<ActionResult> MarkAllAsRead(CancellationToken cancellationToken)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdValue)) return Unauthorized();

        await repository.MarkAllNotificationsAsReadAsync(userIdValue, cancellationToken);
        return NoContent();
    }

    [HttpGet("play-histories/recent")]
    public async Task<ActionResult<IReadOnlyList<PlayHistoryDto>>> GetRecentPlayHistories(CancellationToken cancellationToken)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdValue)) return Unauthorized();

        return Ok(await repository.GetRecentPlayHistoriesAsync(userIdValue, 20, cancellationToken));
    }
}