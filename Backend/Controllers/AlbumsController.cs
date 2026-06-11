using Backend.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AlbumsController : ControllerBase
{
    private readonly TuneVaultDbContext _context;

    public AlbumsController(TuneVaultDbContext context)
    {
        _context = context;
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetAlbum(string id)
    {
        var album = await _context.Albums
            .Include(a => a.Artist)
            .Include(a => a.MediaItems)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (album == null) return NotFound();

        return Ok(album);
    }
}
