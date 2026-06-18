using System.Globalization;
using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using MySqlConnector;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ArtistsController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public ArtistsController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    private string ConnectionString =>
        _configuration.GetConnectionString("SpotifyDb")
        ?? throw new InvalidOperationException("Missing database connection string.");

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ArtistSummaryDto>>> GetArtists(CancellationToken cancellationToken)
    {
        await using var connection = new MySqlConnection(ConnectionString);
        await connection.OpenAsync(cancellationToken);

        const string sql = @"
SELECT
    ar.Id,
    ar.Name,
    ar.Bio,
    ar.AvatarUrl,
    COUNT(DISTINCT al.Id) AS AlbumCount,
    COUNT(mi.Id) AS TrackCount,
    COALESCE(
        ar.AvatarUrl,
        MAX(al.CoverImageUrl),
        MAX(mi.CoverImageUrl)
    ) AS CoverImageUrl
FROM Artists ar
LEFT JOIN Albums al ON al.ArtistId = ar.Id
LEFT JOIN MediaItems mi ON mi.AlbumId = al.Id
GROUP BY ar.Id, ar.Name, ar.Bio, ar.AvatarUrl
ORDER BY ar.Name;";

        await using var command = new MySqlCommand(sql, connection);
        var items = new List<ArtistSummaryDto>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            items.Add(new ArtistSummaryDto(
                GetRequiredDbString(reader, "Id"),
                reader.GetString("Name"),
                reader.IsDBNull(reader.GetOrdinal("Bio")) ? null : reader.GetString("Bio"),
                reader.IsDBNull(reader.GetOrdinal("AvatarUrl")) ? null : reader.GetString("AvatarUrl"),
                Convert.ToInt32(reader["AlbumCount"], CultureInfo.InvariantCulture),
                Convert.ToInt32(reader["TrackCount"], CultureInfo.InvariantCulture),
                reader.IsDBNull(reader.GetOrdinal("CoverImageUrl")) ? null : reader.GetString("CoverImageUrl")));
        }

        return Ok(items);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ArtistDetailDto>> GetArtist(string id, CancellationToken cancellationToken)
    {
        await using var connection = new MySqlConnection(ConnectionString);
        await connection.OpenAsync(cancellationToken);

        const string artistSql = @"
SELECT Id, Name, Bio, AvatarUrl
FROM Artists
WHERE Id = @Id
LIMIT 1;";

        ArtistSummaryDto? artist = null;
        await using (var artistCommand = new MySqlCommand(artistSql, connection))
        {
            artistCommand.Parameters.AddWithValue("@Id", id);
            await using var reader = await artistCommand.ExecuteReaderAsync(cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
            {
                artist = new ArtistSummaryDto(
                    GetRequiredDbString(reader, "Id"),
                    reader.GetString("Name"),
                    reader.IsDBNull(reader.GetOrdinal("Bio")) ? null : reader.GetString("Bio"),
                    reader.IsDBNull(reader.GetOrdinal("AvatarUrl")) ? null : reader.GetString("AvatarUrl"),
                    0,
                    0,
                    null);
            }
        }

        if (artist is null)
        {
            return NotFound();
        }

        const string albumsSql = @"
SELECT al.Id, al.Title, al.CoverImageUrl, al.ArtistId, ar.Name AS ArtistName, DATE_FORMAT(al.ReleaseDate, '%Y-%m-%d') AS ReleaseDate
FROM Albums al
INNER JOIN Artists ar ON ar.Id = al.ArtistId
WHERE al.ArtistId = @ArtistId
ORDER BY al.ReleaseDate DESC, al.Title ASC;";

        var albumDtos = new List<AlbumDto>();
        await using (var albumsCommand = new MySqlCommand(albumsSql, connection))
        {
            albumsCommand.Parameters.AddWithValue("@ArtistId", id);
            await using var reader = await albumsCommand.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                albumDtos.Add(new AlbumDto(
                    GetRequiredDbString(reader, "Id"),
                    reader.GetString("Title"),
                    reader.IsDBNull(reader.GetOrdinal("CoverImageUrl")) ? null : reader.GetString("CoverImageUrl"),
                    GetRequiredDbString(reader, "ArtistId"),
                    reader.GetString("ArtistName"),
                    reader.GetString("ReleaseDate")));
            }
        }

        const string songsSql = @"
SELECT mi.Id, mi.Title, mi.FilePath, mi.Duration, mi.MediaType, mi.OwnerId, mi.AlbumId,
       al.Title AS AlbumTitle, ar.Name AS ArtistName, al.CoverImageUrl
FROM MediaItems mi
INNER JOIN Albums al ON al.Id = mi.AlbumId
INNER JOIN Artists ar ON ar.Id = al.ArtistId
WHERE al.ArtistId = @ArtistId
ORDER BY mi.CreatedAt DESC, mi.Title ASC;";

        var songs = new List<MediaItemDto>();
        await using (var songsCommand = new MySqlCommand(songsSql, connection))
        {
            songsCommand.Parameters.AddWithValue("@ArtistId", id);
            await using var reader = await songsCommand.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                songs.Add(new MediaItemDto(
                    GetRequiredDbString(reader, "Id"),
                    reader.GetString("Title"),
                    reader.GetString("FilePath"),
                    reader.GetString("Duration"),
                    reader.GetString("MediaType"),
                    GetRequiredDbString(reader, "OwnerId"),
                    reader.IsDBNull(reader.GetOrdinal("AlbumId")) ? null : GetNullableDbString(reader, "AlbumId"),
                    reader.GetString("AlbumTitle"),
                    reader.GetString("ArtistName"),
                    reader.IsDBNull(reader.GetOrdinal("CoverImageUrl")) ? null : reader.GetString("CoverImageUrl")));
            }
        }

        var coverImageUrl = albumDtos
            .Select(album => album.CoverImageUrl)
            .FirstOrDefault(url => !string.IsNullOrWhiteSpace(url))
            ?? artist.AvatarUrl;

        var summary = artist with
        {
            AlbumCount = albumDtos.Count,
            TrackCount = songs.Count,
            CoverImageUrl = coverImageUrl
        };

        return Ok(new ArtistDetailDto(summary, albumDtos, songs));
    }

    private static string GetRequiredDbString(MySqlDataReader reader, string columnName)
    {
        var ordinal = reader.GetOrdinal(columnName);
        if (reader.IsDBNull(ordinal))
        {
            throw new InvalidOperationException($"Column '{columnName}' is null but was expected to contain a value.");
        }

        return ConvertDbValueToString(reader.GetValue(ordinal), columnName);
    }

    private static string? GetNullableDbString(MySqlDataReader reader, string columnName)
    {
        var ordinal = reader.GetOrdinal(columnName);
        if (reader.IsDBNull(ordinal))
        {
            return null;
        }

        return ConvertDbValueToString(reader.GetValue(ordinal), columnName);
    }

    private static string ConvertDbValueToString(object value, string columnName)
    {
        return value switch
        {
            string text => text,
            Guid guid => guid.ToString(),
            byte[] bytes when bytes.Length == 16 => new Guid(bytes).ToString(),
            byte[] bytes => System.Text.Encoding.UTF8.GetString(bytes),
            _ => Convert.ToString(value, CultureInfo.InvariantCulture)
                 ?? throw new InvalidOperationException($"Unable to convert column '{columnName}' to string.")
        };
    }
}
