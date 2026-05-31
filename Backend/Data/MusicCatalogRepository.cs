using Backend.Models;
using System.Globalization;
using System.Text;
using MySqlConnector;

namespace Backend.Data;

public interface IMusicCatalogRepository
{
    Task<LibrarySummaryDto> GetLibrarySummaryAsync(CancellationToken cancellationToken = default);
    Task<MediaItemDto?> GetMediaItemByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<PlaylistDto?> GetPlaylistByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MediaItemDto>> GetPlaylistTracksAsync(string playlistId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MediaItemDto>> GetVideoItemsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SearchResultDto>> SearchAsync(string query, CancellationToken cancellationToken = default);
    Task<PlaylistDto> CreatePlaylistAsync(CreatePlaylistRequest request, CancellationToken cancellationToken = default);
    Task AddMediaToPlaylistAsync(string playlistId, string mediaItemId, CancellationToken cancellationToken = default);
    Task<AlbumDto> CreateAlbumAsync(CreateAlbumRequest request, CancellationToken cancellationToken = default);
}

public sealed class MySqlMusicCatalogRepository(IConfiguration configuration) : IMusicCatalogRepository
{
    private string ConnectionString =>
        configuration.GetConnectionString("SpotifyDb")
        ?? Environment.GetEnvironmentVariable("SPOTIFY_DB_CONNECTION")
        ?? throw new InvalidOperationException("Missing database connection string. Set ConnectionStrings:SpotifyDb or SPOTIFY_DB_CONNECTION.");

    public async Task<LibrarySummaryDto> GetLibrarySummaryAsync(CancellationToken cancellationToken = default)
    {
        await using var connection = new MySqlConnection(ConnectionString);
        await connection.OpenAsync(cancellationToken);

        var songs = await LoadMediaItemsAsync(connection, "Audio", cancellationToken);
        var albums = await LoadAlbumsAsync(connection, cancellationToken);
        var playlists = await LoadPlaylistsAsync(connection, cancellationToken);

        return new LibrarySummaryDto(songs, albums, playlists);
    }

    public async Task<MediaItemDto?> GetMediaItemByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        await using var connection = new MySqlConnection(ConnectionString);
        await connection.OpenAsync(cancellationToken);

        const string sql = @"
SELECT m.Id, m.Title, m.FilePath, m.Duration, m.MediaType, m.OwnerId, m.AlbumId,
       a.Title AS AlbumTitle, art.Name AS ArtistName, a.CoverImageUrl
FROM MediaItems m
LEFT JOIN Albums a ON a.Id = m.AlbumId
LEFT JOIN Artists art ON art.Id = a.ArtistId
WHERE m.Id = @Id
LIMIT 1;";

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@Id", id);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return MapMediaItem(reader);
    }

    public async Task<PlaylistDto?> GetPlaylistByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        await using var connection = new MySqlConnection(ConnectionString);
        await connection.OpenAsync(cancellationToken);

        const string sql = @"
SELECT p.Id, p.Name, p.Description, p.IsPublic, p.CreatedByUserId, COUNT(pt.MediaItemId) AS TrackCount
FROM Playlists p
LEFT JOIN PlaylistTracks pt ON pt.PlaylistId = p.Id
WHERE p.Id = @Id
GROUP BY p.Id, p.Name, p.Description, p.IsPublic, p.CreatedByUserId, p.CreatedAt
LIMIT 1;";

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@Id", id);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return new PlaylistDto(
            GetRequiredDbString(reader, "Id"),
            reader.GetString("Name"),
            reader.IsDBNull(reader.GetOrdinal("Description")) ? null : reader.GetString("Description"),
            reader.GetBoolean("IsPublic"),
            GetRequiredDbString(reader, "CreatedByUserId"),
            Convert.ToInt32(reader["TrackCount"]));
    }

    public async Task<IReadOnlyList<MediaItemDto>> GetPlaylistTracksAsync(string playlistId, CancellationToken cancellationToken = default)
    {
        await using var connection = new MySqlConnection(ConnectionString);
        await connection.OpenAsync(cancellationToken);

        const string sql = @"
SELECT m.Id, m.Title, m.FilePath, m.Duration, m.MediaType, m.OwnerId, m.AlbumId,
       a.Title AS AlbumTitle, art.Name AS ArtistName, a.CoverImageUrl
FROM PlaylistTracks pt
INNER JOIN MediaItems m ON m.Id = pt.MediaItemId
LEFT JOIN Albums a ON a.Id = m.AlbumId
LEFT JOIN Artists art ON art.Id = a.ArtistId
WHERE pt.PlaylistId = @PlaylistId
ORDER BY pt.AddedAt DESC;";

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@PlaylistId", playlistId);

        var items = new List<MediaItemDto>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            items.Add(MapMediaItem(reader));
        }

        return items;
    }

    public async Task<IReadOnlyList<MediaItemDto>> GetVideoItemsAsync(CancellationToken cancellationToken = default)
    {
        await using var connection = new MySqlConnection(ConnectionString);
        await connection.OpenAsync(cancellationToken);

        return await LoadMediaItemsAsync(connection, "Video", cancellationToken);
    }

    public async Task<IReadOnlyList<SearchResultDto>> SearchAsync(string query, CancellationToken cancellationToken = default)
    {
        await using var connection = new MySqlConnection(ConnectionString);
        await connection.OpenAsync(cancellationToken);

        var normalized = query.Trim();
        var results = new List<SearchResultDto>();

        const string songSql = @"
SELECT m.Id, m.Title, m.Duration, m.MediaType, m.FilePath, m.AlbumId, a.CoverImageUrl,
       COALESCE(art.Name, 'TuneVault') AS ArtistName
FROM MediaItems m
LEFT JOIN Albums a ON a.Id = m.AlbumId
LEFT JOIN Artists art ON art.Id = a.ArtistId
WHERE (@Query = '' OR m.Title LIKE CONCAT('%', @Query, '%') OR art.Name LIKE CONCAT('%', @Query, '%'))
ORDER BY m.CreatedAt DESC;";

        await using (var command = new MySqlCommand(songSql, connection))
        {
            command.Parameters.AddWithValue("@Query", normalized);
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                var title = reader.GetString("Title");
                var duration = reader.GetString("Duration");
                var artistName = reader.GetString("ArtistName");
                results.Add(new SearchResultDto(
                    GetRequiredDbString(reader, "Id"),
                    title,
                    $"{artistName} • {duration}",
                    "Song",
                    reader.GetString("MediaType"),
                    GetNullableDbString(reader, "AlbumId"),
                    reader.GetString("FilePath"),
                    reader.IsDBNull(reader.GetOrdinal("CoverImageUrl")) ? null : reader.GetString("CoverImageUrl")));
            }
        }

        const string albumSql = @"
SELECT a.Id, a.Title, a.CoverImageUrl, a.ArtistId, art.Name AS ArtistName, DATE_FORMAT(a.ReleaseDate, '%Y-%m-%d') AS ReleaseDate
FROM Albums a
INNER JOIN Artists art ON art.Id = a.ArtistId
WHERE (@Query = '' OR a.Title LIKE CONCAT('%', @Query, '%') OR art.Name LIKE CONCAT('%', @Query, '%'))
ORDER BY a.ReleaseDate DESC;";

        await using (var command = new MySqlCommand(albumSql, connection))
        {
            command.Parameters.AddWithValue("@Query", normalized);
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                var artistName = reader.GetString("ArtistName");
                results.Add(new SearchResultDto(
                    GetRequiredDbString(reader, "Id"),
                    reader.GetString("Title"),
                    $"{artistName} • Album",
                    "Album",
                    null,
                    null,
                    null,
                    reader.IsDBNull(reader.GetOrdinal("CoverImageUrl")) ? null : reader.GetString("CoverImageUrl")));
            }
        }

        return results;
    }

    public async Task<PlaylistDto> CreatePlaylistAsync(CreatePlaylistRequest request, CancellationToken cancellationToken = default)
    {
        var playlistId = Guid.NewGuid().ToString();
        var createdByUserId = string.IsNullOrWhiteSpace(request.CreatedByUserId)
            ? "22222222-2222-2222-2222-222222222222"
            : request.CreatedByUserId;

        await using var connection = new MySqlConnection(ConnectionString);
        await connection.OpenAsync(cancellationToken);

        const string sql = @"
INSERT INTO Playlists (Id, Name, Description, IsPublic, CreatedByUserId)
VALUES (@Id, @Name, @Description, 1, @CreatedByUserId);";

        await using (var command = new MySqlCommand(sql, connection))
        {
            command.Parameters.AddWithValue("@Id", playlistId);
            command.Parameters.AddWithValue("@Name", request.Name);
            command.Parameters.AddWithValue("@Description", (object?)request.Description ?? DBNull.Value);
            command.Parameters.AddWithValue("@CreatedByUserId", createdByUserId);
            await command.ExecuteNonQueryAsync(cancellationToken);
        }

        return new PlaylistDto(playlistId, request.Name, request.Description, true, createdByUserId, 0);
    }

    public async Task AddMediaToPlaylistAsync(string playlistId, string mediaItemId, CancellationToken cancellationToken = default)
    {
        await using var connection = new MySqlConnection(ConnectionString);
        await connection.OpenAsync(cancellationToken);

        const string sql = @"
INSERT IGNORE INTO PlaylistTracks (PlaylistId, MediaItemId)
VALUES (@PlaylistId, @MediaItemId);";

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@PlaylistId", playlistId);
        command.Parameters.AddWithValue("@MediaItemId", mediaItemId);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task<AlbumDto> CreateAlbumAsync(CreateAlbumRequest request, CancellationToken cancellationToken = default)
    {
        var albumId = Guid.NewGuid().ToString();
        var title = request.Title?.Trim() ?? string.Empty;
        var artistName = request.ArtistName?.Trim() ?? "TuneVault";
        var cover = string.IsNullOrWhiteSpace(request.CoverImageUrl) ? null : request.CoverImageUrl.Trim();
        DateTime releaseDate;
        if (!DateTime.TryParse(request.ReleaseDate, out releaseDate))
        {
            releaseDate = DateTime.UtcNow;
        }

        await using var connection = new MySqlConnection(ConnectionString);
        await connection.OpenAsync(cancellationToken);

        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        try
        {
            // find artist
            string artistId = null!;
            const string findArtistSql = @"SELECT Id FROM Artists WHERE Name = @Name LIMIT 1;";
            await using (var findCmd = new MySqlCommand(findArtistSql, connection, transaction))
            {
                findCmd.Parameters.AddWithValue("@Name", artistName);
                var res = await findCmd.ExecuteScalarAsync(cancellationToken);
                if (res != null)
                {
                    artistId = ConvertDbValueToString(res, "Id");
                }
            }

            if (string.IsNullOrEmpty(artistId))
            {
                artistId = Guid.NewGuid().ToString();
                const string insertArtist = @"INSERT INTO Artists (Id, Name) VALUES (@Id, @Name);";
                await using (var insertCmd = new MySqlCommand(insertArtist, connection, transaction))
                {
                    insertCmd.Parameters.AddWithValue("@Id", artistId);
                    insertCmd.Parameters.AddWithValue("@Name", artistName);
                    await insertCmd.ExecuteNonQueryAsync(cancellationToken);
                }
            }

            const string insertAlbum = @"
INSERT INTO Albums (Id, Title, CoverImageUrl, ArtistId, ReleaseDate)
VALUES (@Id, @Title, @CoverImageUrl, @ArtistId, @ReleaseDate);
";

            await using (var cmd = new MySqlCommand(insertAlbum, connection, transaction))
            {
                cmd.Parameters.AddWithValue("@Id", albumId);
                cmd.Parameters.AddWithValue("@Title", title);
                cmd.Parameters.AddWithValue("@CoverImageUrl", (object?)cover ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@ArtistId", artistId);
                cmd.Parameters.AddWithValue("@ReleaseDate", releaseDate);
                await cmd.ExecuteNonQueryAsync(cancellationToken);
            }

            await transaction.CommitAsync(cancellationToken);

            return new AlbumDto(albumId, title, cover, artistId, artistName, releaseDate.ToString("yyyy-MM-dd"));
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private static async Task<IReadOnlyList<MediaItemDto>> LoadMediaItemsAsync(MySqlConnection connection, string mediaType, CancellationToken cancellationToken)
    {
        const string sql = @"
SELECT m.Id, m.Title, m.FilePath, m.Duration, m.MediaType, m.OwnerId, m.AlbumId,
       a.Title AS AlbumTitle, art.Name AS ArtistName, a.CoverImageUrl
FROM MediaItems m
LEFT JOIN Albums a ON a.Id = m.AlbumId
LEFT JOIN Artists art ON art.Id = a.ArtistId
WHERE m.MediaType = @MediaType
ORDER BY m.CreatedAt DESC;";

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@MediaType", mediaType);

        var items = new List<MediaItemDto>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            items.Add(MapMediaItem(reader));
        }

        return items;
    }

    private static async Task<IReadOnlyList<AlbumDto>> LoadAlbumsAsync(MySqlConnection connection, CancellationToken cancellationToken)
    {
        const string sql = @"
SELECT a.Id, a.Title, a.CoverImageUrl, a.ArtistId, art.Name AS ArtistName, DATE_FORMAT(a.ReleaseDate, '%Y-%m-%d') AS ReleaseDate
FROM Albums a
INNER JOIN Artists art ON art.Id = a.ArtistId
ORDER BY a.ReleaseDate DESC;";

        await using var command = new MySqlCommand(sql, connection);

        var items = new List<AlbumDto>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            items.Add(new AlbumDto(
                GetRequiredDbString(reader, "Id"),
                reader.GetString("Title"),
                reader.IsDBNull(reader.GetOrdinal("CoverImageUrl")) ? null : reader.GetString("CoverImageUrl"),
                GetRequiredDbString(reader, "ArtistId"),
                reader.GetString("ArtistName"),
                reader.GetString("ReleaseDate")));
        }

        return items;
    }

    private static async Task<IReadOnlyList<PlaylistDto>> LoadPlaylistsAsync(MySqlConnection connection, CancellationToken cancellationToken)
    {
        const string sql = @"
SELECT p.Id, p.Name, p.Description, p.IsPublic, p.CreatedByUserId, COUNT(pt.MediaItemId) AS TrackCount
FROM Playlists p
LEFT JOIN PlaylistTracks pt ON pt.PlaylistId = p.Id
GROUP BY p.Id, p.Name, p.Description, p.IsPublic, p.CreatedByUserId, p.CreatedAt
ORDER BY p.CreatedAt DESC;";

        await using var command = new MySqlCommand(sql, connection);

        var items = new List<PlaylistDto>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            items.Add(new PlaylistDto(
                GetRequiredDbString(reader, "Id"),
                reader.GetString("Name"),
                reader.IsDBNull(reader.GetOrdinal("Description")) ? null : reader.GetString("Description"),
                reader.GetBoolean("IsPublic"),
                GetRequiredDbString(reader, "CreatedByUserId"),
                Convert.ToInt32(reader["TrackCount"])));
        }

        return items;
    }

    private static MediaItemDto MapMediaItem(MySqlDataReader reader)
    {
        return new MediaItemDto(
            GetRequiredDbString(reader, "Id"),
            reader.GetString("Title"),
            reader.GetString("FilePath"),
            reader.GetString("Duration"),
            reader.GetString("MediaType"),
            GetRequiredDbString(reader, "OwnerId"),
            GetNullableDbString(reader, "AlbumId"),
            reader.IsDBNull(reader.GetOrdinal("AlbumTitle")) ? null : reader.GetString("AlbumTitle"),
            reader.IsDBNull(reader.GetOrdinal("ArtistName")) ? null : reader.GetString("ArtistName"),
            reader.IsDBNull(reader.GetOrdinal("CoverImageUrl")) ? null : reader.GetString("CoverImageUrl"));
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
            byte[] bytes => Encoding.UTF8.GetString(bytes),
            _ => Convert.ToString(value, CultureInfo.InvariantCulture)
                 ?? throw new InvalidOperationException($"Unable to convert column '{columnName}' to string.")
        };
    }
}