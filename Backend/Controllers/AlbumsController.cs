using Backend.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AlbumsController : ControllerBase
{
    private readonly TuneVaultDbContext _context;

    public AlbumsController(TuneVaultDbContext context)
    {
        _context = context;
    }

    [AllowAnonymous]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetAlbum(int id)
    {
        var album = await _context.Albums
            .Include(a => a.Artist)
            .Include(a => a.MediaItems)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (album == null) return NotFound();

        return Ok(album);
    }

    // DELETE: api/albums/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAlbum(int id)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdValue, out var userId)) return Unauthorized();

        var album = await _context.Albums
            .Include(a => a.Artist)
            .FirstOrDefaultAsync(a => a.Id == id);
        if (album == null) return NotFound("Không tìm thấy Album.");

        bool isAdmin = User.IsInRole("Admin");
        // Chỉ người tạo (Artist.UserId) mới được xóa, trừ Admin
        if (!isAdmin && album.Artist?.UserId != userId)
        {
            return StatusCode(403, new { message = "Bạn không có quyền xóa Album của người khác!" });
        }

        _context.Albums.Remove(album);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

