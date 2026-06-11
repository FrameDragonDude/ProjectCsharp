using Backend.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ArtistsController : ControllerBase
{
    private readonly TuneVaultDbContext _context;

    public ArtistsController(TuneVaultDbContext context)
    {
        _context = context;
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetArtist(string id)
    {
        var artist = await _context.Artists
            .Include(a => a.Albums)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (artist == null) return NotFound();

        // Get also media items not in albums if they exist
        var mediaItems = await _context.MediaItems
            .Where(m => m.OwnerId == id) // Assuming owner is the artist for simple logic
            .ToListAsync();

        return Ok(new { artist, mediaItems });
    }
}
