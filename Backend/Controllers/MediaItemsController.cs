using Backend.Domain.Entities;
using Backend.Infrastructure.Data;
using Backend.Models.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MediaItemsController : ControllerBase
{
    private readonly TuneVaultDbContext _context;
    private readonly string _storagePath;

    public MediaItemsController(TuneVaultDbContext context)
    {
        _context = context;
        _storagePath = Path.Combine(Directory.GetCurrentDirectory(), "storage");
    }

    // GET: api/mediaitems
    [HttpGet]
    public async Task<IActionResult> GetMediaItems(
        [FromQuery] string? type,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var query = _context.MediaItems.AsQueryable();

        if (!string.IsNullOrEmpty(type))
        {
            query = query.Where(m => m.MediaType == type);
        }

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(m => m.Title.Contains(search));
        }

        var totalItems = await query.CountAsync();
        var items = await query
            .OrderByDescending(m => m.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new
        {
            TotalItems = totalItems,
            Page = page,
            PageSize = pageSize,
            Items = items
        });
    }

    // GET: api/mediaitems/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetMediaItem(string id)
    {
        var item = await _context.MediaItems
            .Include(m => m.Album)
            .Include(m => m.Owner)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (item == null) return NotFound();

        return Ok(item);
    }

    // POST: api/mediaitems
    [HttpPost]
    public async Task<IActionResult> UploadMediaItem([FromForm] MediaItemUploadDto dto)
    {
        if (dto.File == null || dto.File.Length == 0)
            return BadRequest("File is required.");

        var id = Guid.NewGuid().ToString();
        var extension = Path.GetExtension(dto.File.FileName);
        var subFolder = dto.MediaType.ToLower() == "video" ? "video" : "audio";
        var fileName = $"{id}{extension}";
        var relativePath = $"/storage/{subFolder}/{fileName}";
        var absolutePath = Path.Combine(_storagePath, subFolder, fileName);

        // Ensure directory exists
        Directory.CreateDirectory(Path.GetDirectoryName(absolutePath)!);

        using (var stream = new FileStream(absolutePath, FileMode.Create))
        {
            await dto.File.CopyToAsync(stream);
        }

        var mediaItem = new MediaItem
        {
            Id = id,
            Title = dto.Title,
            MediaType = dto.MediaType,
            FilePath = relativePath,
            OwnerId = dto.OwnerId,
            AlbumId = dto.AlbumId,
            CreatedAt = DateTime.UtcNow,
            Duration = "0:00" // In a real app, you'd extract this from the file
        };

        _context.MediaItems.Add(mediaItem);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetMediaItem), new { id = mediaItem.Id }, mediaItem);
    }

    // DELETE: api/mediaitems/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMediaItem(string id)
    {
        var item = await _context.MediaItems.FindAsync(id);
        if (item == null) return NotFound();

        // Delete physical file
        var absolutePath = Path.Combine(Directory.GetCurrentDirectory(), item.FilePath.TrimStart('/'));
        if (System.IO.File.Exists(absolutePath))
        {
            System.IO.File.Delete(absolutePath);
        }

        _context.MediaItems.Remove(item);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // GET: api/mediaitems/stream/{id}
    [HttpGet("stream/{id}")]
    public async Task<IActionResult> StreamMedia(string id)
    {
        var item = await _context.MediaItems.FindAsync(id);
        if (item == null) return NotFound();

        var absolutePath = Path.Combine(Directory.GetCurrentDirectory(), item.FilePath.TrimStart('/'));
        if (!System.IO.File.Exists(absolutePath)) return NotFound("File not found on server.");

        var fileStream = new FileStream(absolutePath, FileMode.Open, FileAccess.Read, FileShare.Read);
        var contentType = item.MediaType.ToLower() == "video" ? "video/mp4" : "audio/mpeg";

        // Enable Range Processing for seeking
        return File(fileStream, contentType, enableRangeProcessing: true);
    }
}
