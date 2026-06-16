using Backend.Domain.Entities;
using Backend.Infrastructure.Data;
using Backend.Models.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlaylistsController : ControllerBase
{
    private readonly TuneVaultDbContext _context;

    public PlaylistsController(TuneVaultDbContext context)
    {
        _context = context;
    }

    // GET: api/playlists/user/{userId}
    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetUserPlaylists(string userId)
    {
        var playlists = await _context.Playlists
            .Where(p => p.CreatedByUserId == userId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return Ok(playlists);
    }

    // POST: api/playlists/user
    [HttpPost("user")]
    public async Task<IActionResult> CreatePlaylist(PlaylistCreateDto dto)
    {
        var playlist = new Playlist
        {
            Id = Guid.NewGuid().ToString(),
            Name = dto.Name,
            Description = dto.Description,
            IsPublic = dto.IsPublic,
            CreatedByUserId = dto.CreatedByUserId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Playlists.Add(playlist);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetUserPlaylists), new { userId = playlist.CreatedByUserId }, playlist);
    }

    // POST: api/playlists/add-track
    [HttpPost("add-track")]
    public async Task<IActionResult> AddTrackToPlaylist(PlaylistTrackDto dto)
    {
        var exists = await _context.PlaylistTracks
            .AnyAsync(pt => pt.PlaylistId == dto.PlaylistId && pt.MediaItemId == dto.MediaItemId);

        if (exists) return BadRequest("Track already in playlist.");

        var pt = new PlaylistTrack
        {
            PlaylistId = dto.PlaylistId,
            MediaItemId = dto.MediaItemId,
            AddedAt = DateTime.UtcNow
        };

        _context.PlaylistTracks.Add(pt);
        await _context.SaveChangesAsync();

        return Ok();
    }

    // DELETE: api/playlists/remove-track
    [HttpDelete("remove-track")]
    public async Task<IActionResult> RemoveTrackFromPlaylist([FromQuery] string playlistId, [FromQuery] string mediaItemId)
    {
        var pt = await _context.PlaylistTracks
            .FirstOrDefaultAsync(x => x.PlaylistId == playlistId && x.MediaItemId == mediaItemId);

        if (pt == null) return NotFound();

        _context.PlaylistTracks.Remove(pt);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
