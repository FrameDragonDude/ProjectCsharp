using Backend.Data;
using Backend.Hubs;
using Backend.Services;
using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;

namespace Backend.Controllers;

[ApiController]
[Route("api")]
[Authorize]

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
        if (command.MediaItemId <= 0)
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
        if (command.SenderUserId <= 0)
        {
            return BadRequest("SenderUserId is required.");
        }

        if (command.ReceiverUserId <= 0)
        {
            return BadRequest("ReceiverUserId is required.");
        }

        var hasMediaItem = command.MediaItemId.HasValue;
        var hasPlaylist = command.PlaylistId.HasValue;

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
        [FromQuery] int userId,
        [FromQuery] int count = 5,
        CancellationToken cancellationToken = default)
    {
        if (userId <= 0)
        {
            return BadRequest("UserId is required.");
        }

        try
        {
            var recommendations = await recommendationService.RecommendSongsAsync(userId.ToString(), count, cancellationToken);
            return Ok(recommendations);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Claude API key", StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, ex.Message);
        }
    }

    [HttpGet("play-histories/{userId}/recent")]
    public async Task<ActionResult<IReadOnlyList<PlayHistoryDto>>> GetRecentPlayHistories(
        int userId, CancellationToken cancellationToken)
    {
        return Ok(await repository.GetRecentPlayHistoriesAsync(userId.ToString(), 20, cancellationToken));
    }

}

