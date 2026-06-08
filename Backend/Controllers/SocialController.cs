using Backend.Data;
using Backend.Hubs;
using Backend.Services;
using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace Backend.Controllers;

[ApiController]
[Route("api")]
public sealed class SocialController(
    IMusicCatalogRepository repository,
    IClaudeRecommendationService recommendationService,
    IHubContext<NotificationHub> hubContext) : ControllerBase
{
    [HttpPost("play-histories")]
    public async Task<IActionResult> RecordPlayHistory(
        [FromBody] RecordPlayHistoryCommand command,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.UserId))
        {
            return BadRequest("UserId is required.");
        }

        if (string.IsNullOrWhiteSpace(command.MediaItemId))
        {
            return BadRequest("MediaItemId is required.");
        }

        await repository.RecordPlayHistoryAsync(command, cancellationToken);
        return NoContent();
    }

    [HttpPost("media-shares")]
    public async Task<ActionResult<NotificationDto>> ShareMedia(
        [FromBody] ShareMediaCommand command,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.SenderUserId))
        {
            return BadRequest("SenderUserId is required.");
        }

        if (string.IsNullOrWhiteSpace(command.ReceiverUserId))
        {
            return BadRequest("ReceiverUserId is required.");
        }

        var hasMediaItem = !string.IsNullOrWhiteSpace(command.MediaItemId);
        var hasPlaylist = !string.IsNullOrWhiteSpace(command.PlaylistId);

        if (hasMediaItem == hasPlaylist)
        {
            return BadRequest("Send exactly one of MediaItemId or PlaylistId.");
        }

        var notification = await repository.ShareMediaAsync(command, cancellationToken);

        await hubContext.Clients
            .Group($"user:{command.ReceiverUserId}")
            .SendAsync("NotificationReceived", notification, cancellationToken);

        return Ok(notification);
    }
    
    [HttpGet("recommendations/ai")]
    public async Task<ActionResult<IReadOnlyList<SongRecommendationDto>>> GetAiRecommendations(
        [FromQuery] string userId,
        [FromQuery] int count = 5,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return BadRequest("UserId is required.");
        }

        try
        {
            var recommendations = await recommendationService.RecommendSongsAsync(userId, count, cancellationToken);
            return Ok(recommendations);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Claude API key", StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, ex.Message);
        }
    }
}