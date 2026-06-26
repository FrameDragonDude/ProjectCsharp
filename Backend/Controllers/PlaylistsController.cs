using Backend.Domain.Entities;
using Backend.Infrastructure.Data;
using Backend.Models.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PlaylistsController : ControllerBase
{
    private readonly TuneVaultDbContext _context;

    public PlaylistsController(TuneVaultDbContext context)
    {
        _context = context;
    }

    // GET: api/playlists/user/{userId}
    [AllowAnonymous]
    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetUserPlaylists(int userId)
    {
        var playlists = await _context.Playlists
            .Where(p => p.CreatedByUserId == userId && p.IsPublic)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return Ok(playlists);
    }

    // POST: api/playlists/user
    [HttpPost("user")]
    public async Task<IActionResult> CreatePlaylist([FromBody] PlaylistCreateDto dto)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdValue, out var userId)) return Unauthorized();

        var playlist = new Playlist
        {
            Name = dto.Name,
            Description = dto.Description,
            IsPublic = dto.IsPublic,
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Playlists.Add(playlist);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetUserPlaylists), new { userId = playlist.CreatedByUserId }, playlist);
    }

    // POST: api/playlists/add-track
    [HttpPost("add-track")]
    public async Task<IActionResult> AddTrackToPlaylist([FromBody] PlaylistTrackDto dto)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdValue, out var userId)) return Unauthorized();

        var playlist = await _context.Playlists.FindAsync(dto.PlaylistId);
        if (playlist == null) return NotFound("Không tìm thấy Playlist.");

        bool isAdmin = User.IsInRole("Admin");
        if (!isAdmin && playlist.CreatedByUserId != userId) 
        {
            return StatusCode(403, new { message = "Bạn không có quyền thêm nhạc vào Playlist của người khác!" });
        }

        var exists = await _context.PlaylistTracks
            .AnyAsync(pt => pt.PlaylistId == dto.PlaylistId && pt.MediaItemId == dto.MediaItemId);
        if (exists) return BadRequest("Bài hát đã có sẵn trong playlist.");

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
    public async Task<IActionResult> RemoveTrackFromPlaylist([FromQuery] int playlistId, [FromQuery] int mediaItemId)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdValue, out var userId)) return Unauthorized();

        var playlist = await _context.Playlists.FindAsync(playlistId);
        if (playlist == null) return NotFound("Không tìm thấy Playlist.");

        // CHECK QUYỀN SỞ HỮU & ADMIN
        bool isAdmin = User.IsInRole("Admin");
        if (!isAdmin && playlist.CreatedByUserId != userId) 
        {
            return StatusCode(403, new { message = "Bạn không có quyền xóa nhạc khỏi Playlist của người khác!" });
        }

        var pt = await _context.PlaylistTracks
            .FirstOrDefaultAsync(x => x.PlaylistId == playlistId && x.MediaItemId == mediaItemId);

        if (pt == null) return NotFound("Không tìm thấy bài hát trong playlist này.");

        _context.PlaylistTracks.Remove(pt);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}