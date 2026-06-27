using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Controllers;

[Authorize]
[ApiController]
[Route("api")]
public class CatalogController(IMusicCatalogRepository repository) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("library/summary")]
    public async Task<ActionResult<LibrarySummaryDto>> GetLibrarySummary(CancellationToken cancellationToken)
    {
        return Ok(await repository.GetLibrarySummaryAsync(cancellationToken));
    }

    [AllowAnonymous]
    [HttpGet("media/{id}")]
    public async Task<ActionResult<MediaItemDto>> GetMediaItem(string id, CancellationToken cancellationToken)
    {
        var item = await repository.GetMediaItemByIdAsync(id, cancellationToken);
        return item is null ? NotFound() : Ok(item);
    }

    [AllowAnonymous]
    [HttpGet("media/video")]
    public async Task<ActionResult<IReadOnlyList<MediaItemDto>>> GetVideoItems(CancellationToken cancellationToken)
    {
        return Ok(await repository.GetVideoItemsAsync(cancellationToken));
    }

    [AllowAnonymous]
    [HttpGet("playlists/{playlistId}")]
    public async Task<ActionResult<PlaylistDto>> GetPlaylistById(string playlistId, CancellationToken cancellationToken)
    {
        var playlist = await repository.GetPlaylistByIdAsync(playlistId, cancellationToken);
        return playlist is null ? NotFound() : Ok(playlist);
    }

    [AllowAnonymous]
    [HttpGet("playlists/{playlistId}/tracks")]
    public async Task<ActionResult<IReadOnlyList<MediaItemDto>>> GetPlaylistTracks(string playlistId, CancellationToken cancellationToken)
    {
        return Ok(await repository.GetPlaylistTracksAsync(playlistId, cancellationToken));
    }

    [AllowAnonymous]
    [HttpGet("search")]
    public async Task<ActionResult<IReadOnlyList<SearchResultDto>>> Search([FromQuery] string query, CancellationToken cancellationToken)
    {
        return Ok(await repository.SearchAsync(query ?? string.Empty, cancellationToken));
    }

    [Authorize(Roles = "Admin, Artist")]
    [HttpPost("albums")]
    [Authorize]
    public async Task<ActionResult<AlbumDto>> CreateAlbum([FromBody] CreateAlbumRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest("Album title is required.");
        }

        var album = await repository.CreateAlbumAsync(request, cancellationToken);
        return Ok(album);
    }

    [Authorize(Roles = "Admin, Artist")]
    [HttpPatch("albums/{id}/cover")]
    [Authorize]
    public async Task<ActionResult<AlbumDto>> UpdateAlbumCover(string id, [FromBody] UpdateAlbumCoverRequest request, CancellationToken cancellationToken)
    {
        var updated = await repository.UpdateAlbumCoverAsync(id, request.CoverImageUrl, cancellationToken);
        return updated is null ? NotFound() : Ok(updated);
    }

    [Authorize(Roles = "Admin, Artist")]
    [HttpPatch("media/{id}/cover")]
    [Authorize]
    public async Task<ActionResult<MediaItemDto>> UpdateMediaCover(string id, [FromBody] UpdateAlbumCoverRequest request, CancellationToken cancellationToken)
    {
        var updated = await repository.UpdateMediaCoverAsync(id, request.CoverImageUrl, cancellationToken);
        return updated is null ? NotFound() : Ok(updated);
    }

    [Authorize(Roles = "Admin, Artist")]
    [HttpPost("albums/{albumId}/tracks")]
    [Authorize]
    public async Task<IActionResult> AddTrackToAlbum(string albumId, [FromBody] AddTrackRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.MediaItemId))
        {
            return BadRequest("MediaItemId is required.");
        }

        var ok = await repository.AssignMediaToAlbumAsync(albumId, request.MediaItemId, cancellationToken);
        return ok ? NoContent() : NotFound();
    }
}