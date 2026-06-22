using Backend.Data;
using Backend.Domain.Entities;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Backend.Infrastructure.Data;

namespace Backend.Controllers;

[ApiController]
[Route("api/interactions")]
[Authorize]
public class InteractionController(TuneVaultDbContext dbContext, IMusicCatalogRepository repository) : ControllerBase
{
    [HttpPost("favorite/{mediaItemId}")]
    public async Task<IActionResult> ToggleFavorite(string mediaItemId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var existing = await dbContext.Favorites
            .FirstOrDefaultAsync(f => f.UserId == userId && f.MediaItemId == mediaItemId);

        if (existing != null)
        {
            dbContext.Favorites.Remove(existing);
            await dbContext.SaveChangesAsync();
            return Ok(new { IsFavorite = false });
        }
        else
        {
            dbContext.Favorites.Add(new Favorite { UserId = userId, MediaItemId = mediaItemId });
            await dbContext.SaveChangesAsync();
            return Ok(new { IsFavorite = true });
        }
    }

    [HttpGet("favorites")]
    public async Task<ActionResult<IEnumerable<MediaItemDto>>> GetFavorites()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var favIds = await dbContext.Favorites
            .Where(f => f.UserId == userId)
            .OrderByDescending(f => f.CreatedAt)
            .Select(f => f.MediaItemId)
            .ToListAsync();

        var items = new List<MediaItemDto>();
        foreach (var id in favIds)
        {
            var item = await repository.GetMediaItemByIdAsync(id);
            if (item != null) items.Add(item);
        }

        return Ok(items);
    }

    [HttpPost("history/{mediaItemId}")]
    public async Task<IActionResult> RecordPlayHistory(string mediaItemId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var history = new PlayHistory
        {
            UserId = userId,
            MediaItemId = mediaItemId,
            PlayedAt = DateTime.UtcNow
        };

        dbContext.PlayHistories.Add(history);
        await dbContext.SaveChangesAsync();

        return Ok();
    }

    [HttpGet("history")]
    public async Task<ActionResult<IEnumerable<MediaItemDto>>> GetPlayHistory()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var historyIds = await dbContext.PlayHistories
            .Where(h => h.UserId == userId)
            .OrderByDescending(h => h.PlayedAt)
            .Select(h => h.MediaItemId)
            .Take(20) // Limit to last 20 plays
            .ToListAsync();

        // deduplicate for display
        historyIds = historyIds.Distinct().ToList();

        var items = new List<MediaItemDto>();
        foreach (var id in historyIds)
        {
            var item = await repository.GetMediaItemByIdAsync(id);
            if (item != null) items.Add(item);
        }

        return Ok(items);
    }
}
