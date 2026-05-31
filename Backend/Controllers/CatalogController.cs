using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api")]
public class CatalogController(IMusicCatalogRepository repository) : ControllerBase
{
    [HttpGet("library/summary")]
    public async Task<ActionResult<LibrarySummaryDto>> GetLibrarySummary(CancellationToken cancellationToken)
    {
        return Ok(await repository.GetLibrarySummaryAsync(cancellationToken));
    }

    [HttpGet("media/{id}")]
    public async Task<ActionResult<MediaItemDto>> GetMediaItem(string id, CancellationToken cancellationToken)
    {
        var item = await repository.GetMediaItemByIdAsync(id, cancellationToken);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpGet("media/video")]
    public async Task<ActionResult<IReadOnlyList<MediaItemDto>>> GetVideoItems(CancellationToken cancellationToken)
    {
        return Ok(await repository.GetVideoItemsAsync(cancellationToken));
    }

    [HttpGet("playlists/{playlistId}")]
    public async Task<ActionResult<PlaylistDto>> GetPlaylistById(string playlistId, CancellationToken cancellationToken)
    {
        var playlist = await repository.GetPlaylistByIdAsync(playlistId, cancellationToken);
        return playlist is null ? NotFound() : Ok(playlist);
    }

    [HttpGet("playlists/{playlistId}/tracks")]
    public async Task<ActionResult<IReadOnlyList<MediaItemDto>>> GetPlaylistTracks(string playlistId, CancellationToken cancellationToken)
    {
        return Ok(await repository.GetPlaylistTracksAsync(playlistId, cancellationToken));
    }

    [HttpGet("search")]
    public async Task<ActionResult<IReadOnlyList<SearchResultDto>>> Search([FromQuery] string query, CancellationToken cancellationToken)
    {
        return Ok(await repository.SearchAsync(query ?? string.Empty, cancellationToken));
    }

    [HttpPost("playlists")]
    public async Task<ActionResult<PlaylistDto>> CreatePlaylist([FromBody] CreatePlaylistRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("Playlist name is required.");
        }

        var playlist = await repository.CreatePlaylistAsync(request, cancellationToken);
        return Ok(playlist);
    }

    [HttpPost("albums")]
    public async Task<ActionResult<AlbumDto>> CreateAlbum([FromBody] CreateAlbumRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest("Album title is required.");
        }

        var album = await repository.CreateAlbumAsync(request, cancellationToken);
        return Ok(album);
    }

    [HttpPost("playlists/{playlistId}/tracks")]
    public async Task<IActionResult> AddTrack(string playlistId, [FromBody] AddTrackRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.MediaItemId))
        {
            return BadRequest("MediaItemId is required.");
        }

        await repository.AddMediaToPlaylistAsync(playlistId, request.MediaItemId, cancellationToken);
        return NoContent();
    }
}