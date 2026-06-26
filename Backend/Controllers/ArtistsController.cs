using System.Globalization;
using System.Security.Claims;
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
                reader.GetInt32(reader.GetOrdinal("Id")),
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
    public async Task<ActionResult<ArtistDetailDto>> GetArtist(int id, CancellationToken cancellationToken)
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
                    reader.GetInt32(reader.GetOrdinal("Id")),
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
                    reader.GetInt32(reader.GetOrdinal("Id")),
                    reader.GetString("Title"),
                    reader.IsDBNull(reader.GetOrdinal("CoverImageUrl")) ? null : reader.GetString("CoverImageUrl"),
                    reader.GetInt32(reader.GetOrdinal("ArtistId")),
                    reader.GetString("ArtistName"),
                    reader.GetString("ReleaseDate")));
            }
        }

        const string songsSql = @"
SELECT mi.Id, mi.Title, mi.FilePath, mi.Duration, mi.MediaType, mi.Description, mi.AlbumId, mi.ArtistId,
       al.Title AS AlbumTitle, ar.Name AS ArtistName, COALESCE(mi.CoverImageUrl, al.CoverImageUrl, ar.AvatarUrl) AS CoverImageUrl
FROM MediaItems mi
INNER JOIN Artists ar ON ar.Id = mi.ArtistId
LEFT JOIN Albums al ON al.Id = mi.AlbumId
WHERE mi.ArtistId = @ArtistId
ORDER BY mi.CreatedAt DESC, mi.Title ASC;";

        var songs = new List<MediaItemDto>();
        await using (var songsCommand = new MySqlCommand(songsSql, connection))
        {
            songsCommand.Parameters.AddWithValue("@ArtistId", id);
            await using var reader = await songsCommand.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                songs.Add(new MediaItemDto(
                    reader.GetInt32(reader.GetOrdinal("Id")),
                    reader.GetString("Title"),
                    reader.GetString("FilePath"),
                    reader.IsDBNull(reader.GetOrdinal("Description")) ? string.Empty : reader.GetString("Description"),
                    reader.GetString("Duration"),
                    reader.GetString("MediaType"),
                    reader.IsDBNull(reader.GetOrdinal("ArtistId")) ? null : reader.GetInt32(reader.GetOrdinal("ArtistId")),
                    reader.IsDBNull(reader.GetOrdinal("AlbumId")) ? null : (int?)reader.GetInt32(reader.GetOrdinal("AlbumId")),
                    reader.IsDBNull(reader.GetOrdinal("AlbumTitle")) ? string.Empty : reader.GetString("AlbumTitle"),
                    reader.GetString("ArtistName"),
                    reader.IsDBNull(reader.GetOrdinal("CoverImageUrl")) ? null : reader.GetString("CoverImageUrl")));
            }
        }

        var isFollowing = false;
        var myUserIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (int.TryParse(myUserIdValue, out var myUserId))
        {
            const string checkFollowSql = "SELECT 1 FROM Follows WHERE FollowerId = @FollowerId AND TargetId = @TargetId AND TargetType = 'Artist' LIMIT 1;";
            await using var checkFollowCmd = new MySqlCommand(checkFollowSql, connection);
            checkFollowCmd.Parameters.AddWithValue("@FollowerId", myUserId);
            checkFollowCmd.Parameters.AddWithValue("@TargetId", id);
            var result = await checkFollowCmd.ExecuteScalarAsync(cancellationToken);
            isFollowing = result != null;
        }

        var coverImageUrl = albumDtos
            .Select(album => album.CoverImageUrl)
            .FirstOrDefault(url => !string.IsNullOrWhiteSpace(url))
            ?? artist.AvatarUrl;

        var summary = artist with
        {
            AlbumCount = albumDtos.Count,
            TrackCount = songs.Count,
            CoverImageUrl = coverImageUrl,
            IsFollowing = isFollowing
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


