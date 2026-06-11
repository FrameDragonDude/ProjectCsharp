using Backend.Domain.Entities;
using Backend.Infrastructure.Data;
using Backend.Models.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InteractionsController : ControllerBase
{
    private readonly TuneVaultDbContext _context;

    public InteractionsController(TuneVaultDbContext context)
    {
        _context = context;
    }

    // Favorites
    [HttpPost("favorites")]
    public async Task<IActionResult> AddToFavorites(FavoriteDto dto)
    {
        var exists = await _context.Favorites
            .AnyAsync(f => f.UserId == dto.UserId && f.MediaItemId == dto.MediaItemId);

        if (exists) return BadRequest("Already in favorites.");

        var fav = new Favorite
        {
            UserId = dto.UserId,
            MediaItemId = dto.MediaItemId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Favorites.Add(fav);
        await _context.SaveChangesAsync();
        return Ok();
    }

    [HttpDelete("favorites")]
    public async Task<IActionResult> RemoveFromFavorites([FromQuery] string userId, [FromQuery] string mediaItemId)
    {
        var fav = await _context.Favorites
            .FirstOrDefaultAsync(f => f.UserId == userId && f.MediaItemId == mediaItemId);

        if (fav == null) return NotFound();

        _context.Favorites.Remove(fav);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // Play History
    [HttpPost("play-histories")]
    public async Task<IActionResult> AddPlayHistory(PlayHistoryDto dto)
    {
        var history = new PlayHistory
        {
            Id = Guid.NewGuid().ToString(),
            UserId = dto.UserId,
            MediaItemId = dto.MediaItemId,
            PlayedAt = DateTime.UtcNow
        };

        _context.PlayHistories.Add(history);
        await _context.SaveChangesAsync();
        return Ok();
    }

    // Follows
    [HttpPost("follows")]
    public async Task<IActionResult> Follow(FollowDto dto)
    {
        var exists = await _context.Follows
            .AnyAsync(f => f.FollowerId == dto.FollowerId && f.TargetId == dto.TargetId && f.TargetType == dto.TargetType);

        if (exists) return BadRequest("Already following.");

        var follow = new Follow
        {
            FollowerId = dto.FollowerId,
            TargetId = dto.TargetId,
            TargetType = dto.TargetType,
            CreatedAt = DateTime.UtcNow
        };

        _context.Follows.Add(follow);
        await _context.SaveChangesAsync();
        return Ok();
    }
}
