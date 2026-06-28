using Backend.Models;
using System.Globalization;
using System.Text;
using MySqlConnector;
using System.Text.Json;

namespace Backend.Data;

public interface IMusicCatalogRepository
{
    Task<LibrarySummaryDto> GetLibrarySummaryAsync(int? userId, CancellationToken cancellationToken = default);
    Task<MediaItemDto?> GetMediaItemByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<PlaylistDto?> GetPlaylistByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MediaItemDto>> GetPlaylistTracksAsync(string playlistId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MediaItemDto>> GetVideoItemsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SearchResultDto>> SearchAsync(string query, CancellationToken cancellationToken = default);
    Task<PlaylistDto> CreatePlaylistAsync(CreatePlaylistRequest request, CancellationToken cancellationToken = default);
    Task AddMediaToPlaylistAsync(string playlistId, string mediaItemId, CancellationToken cancellationToken = default);
    Task<AlbumDto> CreateAlbumAsync(CreateAlbumRequest request, CancellationToken cancellationToken = default);
    Task<AlbumDto?> UpdateAlbumCoverAsync(string albumId, string? coverImageUrl, CancellationToken cancellationToken = default);
    Task<MediaItemDto?> UpdateMediaCoverAsync(string mediaItemId, string? coverImageUrl, CancellationToken cancellationToken = default);
    Task<bool> AssignMediaToAlbumAsync(string albumId, string mediaItemId, CancellationToken cancellationToken = default);

    Task RecordPlayHistoryAsync(RecordPlayHistoryCommand command, CancellationToken cancellationToken = default);
    Task<NotificationDto> ShareMediaAsync(ShareMediaCommand command, CancellationToken cancellationToken = default);
    Task<RecommendationContextDto> GetRecommendationContextAsync(string userId, int historyLimit = 20, int candidateLimit = 30, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<NotificationDto>> GetNotificationsAsync(string userId, CancellationToken cancellationToken = default);
    Task MarkNotificationAsReadAsync(string notificationId, CancellationToken cancellationToken = default);
    Task MarkAllNotificationsAsReadAsync(string userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PlayHistoryDto>> GetRecentPlayHistoriesAsync(string userId, int limit = 10, CancellationToken cancellationToken = default);
}

public sealed class MySqlMusicCatalogRepository(IConfiguration configuration) : IMusicCatalogRepository
{
    private string ConnectionString =>
        configuration.GetConnectionString("SpotifyDb")
        ?? Environment.GetEnvironmentVariable("SPOTIFY_DB_CONNECTION")
        ?? throw new InvalidOperationException("Missing database connection string. Set ConnectionStrings:SpotifyDb or SPOTIFY_DB_CONNECTION.");

    public async Task<LibrarySummaryDto> GetLibrarySummaryAsync(int? userId, CancellationToken cancellationToken = default)
    {
        await using var connection = new MySqlConnection(ConnectionString);
        await connection.OpenAsync(cancellationToken);

        var songs = await LoadMediaItemsAsync(connection, null, cancellationToken); // Load ALL media (Audio + Video)
        var albums = await LoadAlbumsAsync(connection, cancellationToken);
        var playlists = await LoadPlaylistsAsync(connection, userId, cancellationToken);

        return new LibrarySummaryDto(songs, albums, playlists);
    }

    public async Task<MediaItemDto?> GetMediaItemByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        await using var connection = new MySqlConnection(ConnectionString);
        await connection.OpenAsync(cancellationToken);

        const string sql = @"
SELECT m.Id, m.Title, m.FilePath, m.Duration, m.MediaType, m.ArtistId AS ArtistId, m.AlbumId, m.Description,
    a.Title AS AlbumTitle, art.Name AS ArtistName, COALESCE(m.CoverImageUrl, a.CoverImageUrl) AS CoverImageUrl
FROM MediaItems m
LEFT JOIN Albums a ON a.Id = m.AlbumId
LEFT JOIN Artists art ON art.Id = m.ArtistId
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
SELECT p.Id, p.Name, p.Description, p.IsPublic, p.CreatedByUserId, COUNT(pt.MediaItemId) AS TrackCount,
    (
        SELECT COALESCE(m.CoverImageUrl, a.CoverImageUrl)
        FROM PlaylistTracks pt2
        INNER JOIN MediaItems m ON m.Id = pt2.MediaItemId
        LEFT JOIN Albums a ON a.Id = m.AlbumId
        WHERE pt2.PlaylistId = p.Id
        ORDER BY pt2.AddedAt DESC
        LIMIT 1
    ) AS CoverImageUrl
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
            reader.GetInt32(reader.GetOrdinal("Id")),
            reader.GetString("Name"),
            reader.IsDBNull(reader.GetOrdinal("Description")) ? null : reader.GetString("Description"),
            reader.GetBoolean("IsPublic"),
            reader.GetInt32(reader.GetOrdinal("CreatedByUserId")),
            Convert.ToInt32(reader["TrackCount"]),
            reader.IsDBNull(reader.GetOrdinal("CoverImageUrl")) ? null : reader.GetString("CoverImageUrl"));
    }

    public async Task<IReadOnlyList<MediaItemDto>> GetPlaylistTracksAsync(string playlistId, CancellationToken cancellationToken = default)
    {
        await using var connection = new MySqlConnection(ConnectionString);
        await connection.OpenAsync(cancellationToken);

        const string sql = @"
SELECT m.Id, m.Title, m.FilePath, m.Duration, m.MediaType, m.ArtistId AS ArtistId, m.AlbumId, m.Description,
    a.Title AS AlbumTitle, art.Name AS ArtistName, COALESCE(m.CoverImageUrl, a.CoverImageUrl) AS CoverImageUrl
FROM PlaylistTracks pt
INNER JOIN MediaItems m ON m.Id = pt.MediaItemId
LEFT JOIN Albums a ON a.Id = m.AlbumId
LEFT JOIN Artists art ON art.Id = m.ArtistId
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
SELECT m.Id, m.Title, m.Duration, m.MediaType, m.FilePath, m.AlbumId,
       COALESCE(m.CoverImageUrl, a.CoverImageUrl) AS CoverImageUrl,
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
                    reader.GetInt32(reader.GetOrdinal("Id")),
                    title,
                    $"{artistName} • {duration}",
                    "Song",
                    reader.GetString("MediaType"),
                    reader.IsDBNull(reader.GetOrdinal("AlbumId")) ? null : reader.GetInt32(reader.GetOrdinal("AlbumId")),
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
                    reader.GetInt32(reader.GetOrdinal("Id")),
                    reader.GetString("Title"),
                    $"{artistName} • Album",
                    "Album",
                    null,
                    null,
                    null,
                    reader.IsDBNull(reader.GetOrdinal("CoverImageUrl")) ? null : reader.GetString("CoverImageUrl")));
            }
        }

        const string artistSql = @"
SELECT Id, Name, AvatarUrl
FROM Artists
WHERE (@Query = '' OR Name LIKE CONCAT('%', @Query, '%'))
ORDER BY Name;";

        await using (var command = new MySqlCommand(artistSql, connection))
        {
            command.Parameters.AddWithValue("@Query", normalized);
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                results.Add(new SearchResultDto(
                    reader.GetInt32(reader.GetOrdinal("Id")),
                    reader.GetString("Name"),
                    "Artist",
                    "Artist",
                    null,
                    null,
                    null,
                    reader.IsDBNull(reader.GetOrdinal("AvatarUrl")) ? null : reader.GetString("AvatarUrl")));
            }
        }

        const string userSql = @"
SELECT u.Id, u.Username, up.AvatarUrl, up.FullName
FROM Users u
LEFT JOIN UserProfiles up ON u.Id = up.UserId
WHERE (@Query = '' OR u.Username LIKE CONCAT('%', @Query, '%') OR up.FullName LIKE CONCAT('%', @Query, '%'))
ORDER BY u.Username;";

        await using (var command = new MySqlCommand(userSql, connection))
        {
            command.Parameters.AddWithValue("@Query", normalized);
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                results.Add(new SearchResultDto(
                    reader.GetInt32(reader.GetOrdinal("Id")),
                    reader.GetString("Username"),
                    "User",
                    "User",
                    null,
                    null,
                    null,
                    reader.IsDBNull(reader.GetOrdinal("AvatarUrl")) ? null : reader.GetString("AvatarUrl")));
            }
        }

        const string videoSql = @"
SELECT m.Id, m.Title, m.Duration, m.MediaType, m.FilePath, m.AlbumId,
       COALESCE(m.CoverImageUrl, a.CoverImageUrl) AS CoverImageUrl,
       COALESCE(art.Name, 'TuneVault') AS ArtistName
FROM MediaItems m
LEFT JOIN Albums a ON a.Id = m.AlbumId
LEFT JOIN Artists art ON art.Id = a.ArtistId
WHERE m.MediaType = 'Video'
  AND (@Query = '' OR m.Title LIKE CONCAT('%', @Query, '%') OR art.Name LIKE CONCAT('%', @Query, '%'))
ORDER BY m.CreatedAt DESC;";

        await using (var command = new MySqlCommand(videoSql, connection))
        {
            command.Parameters.AddWithValue("@Query", normalized);
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                var artistName = reader.GetString("ArtistName");
                var duration = reader.GetString("Duration");
                results.Add(new SearchResultDto(
                    reader.GetInt32(reader.GetOrdinal("Id")),
                    reader.GetString("Title"),
                    $"{artistName} • {duration}",
                    "Video",
                    reader.GetString("MediaType"),
                    reader.IsDBNull(reader.GetOrdinal("AlbumId")) ? null : reader.GetInt32(reader.GetOrdinal("AlbumId")),
                    reader.GetString("FilePath"),
                    reader.IsDBNull(reader.GetOrdinal("CoverImageUrl")) ? null : reader.GetString("CoverImageUrl")));
            }
        }

        const string playlistSql = @"
SELECT p.Id, p.Name, p.Description, p.IsPublic, p.CreatedByUserId, COUNT(pt.MediaItemId) AS TrackCount,
    (
        SELECT COALESCE(m.CoverImageUrl, a.CoverImageUrl)
        FROM PlaylistTracks pt2
        INNER JOIN MediaItems m ON m.Id = pt2.MediaItemId
        LEFT JOIN Albums a ON a.Id = m.AlbumId
        WHERE pt2.PlaylistId = p.Id
        ORDER BY pt2.AddedAt DESC
        LIMIT 1
    ) AS CoverImageUrl
FROM Playlists p
LEFT JOIN PlaylistTracks pt ON pt.PlaylistId = p.Id
WHERE (@Query = '' OR p.Name LIKE CONCAT('%', @Query, '%') OR p.Description LIKE CONCAT('%', @Query, '%'))
GROUP BY p.Id, p.Name, p.Description, p.IsPublic, p.CreatedByUserId, p.CreatedAt
ORDER BY p.CreatedAt DESC;";

        await using (var command = new MySqlCommand(playlistSql, connection))
        {
            command.Parameters.AddWithValue("@Query", normalized);
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                results.Add(new SearchResultDto(
                    reader.GetInt32(reader.GetOrdinal("Id")),
                    reader.GetString("Name"),
                    $"{reader.GetInt64(reader.GetOrdinal("TrackCount"))} bài hát",
                    "Playlist",
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
        var playlistId = 0;

        await using var connection = new MySqlConnection(ConnectionString);
        await connection.OpenAsync(cancellationToken);

        var createdByUserId = await ResolveUserIdAsync(connection, request.CreatedByUserId, cancellationToken);

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

        return new PlaylistDto(playlistId, request.Name, request.Description, true, createdByUserId, 0, null);
    }

    private static async Task<int> ResolveUserIdAsync(MySqlConnection connection, int? requestedUserId, CancellationToken cancellationToken)
    {
        if (requestedUserId.HasValue)
        {
            const string requestedUserSql = "SELECT Id FROM Users WHERE Id = @UserId LIMIT 1;";
            await using var requestedUserCommand = new MySqlCommand(requestedUserSql, connection);
            requestedUserCommand.Parameters.AddWithValue("@UserId", requestedUserId.Value);

            var requestedUser = await requestedUserCommand.ExecuteScalarAsync(cancellationToken);
            if (requestedUser is not null)
            {
                return Convert.ToInt32(requestedUser, CultureInfo.InvariantCulture);
            }
        }

        const string fallbackUserSql = "SELECT Id FROM Users ORDER BY CreatedAt LIMIT 1;";
        await using var fallbackUserCommand = new MySqlCommand(fallbackUserSql, connection);

        var fallbackUser = await fallbackUserCommand.ExecuteScalarAsync(cancellationToken);
        if (fallbackUser is not null)
        {
            return Convert.ToInt32(fallbackUser, CultureInfo.InvariantCulture);
        }

        throw new InvalidOperationException("Cannot continue because the Users table is empty.");
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
            var artistId = 0;
            var resolvedArtistName = artistName;
            const string findArtistSql = @"
SELECT Id, Name FROM Artists
WHERE LOWER(TRIM(Name)) = LOWER(TRIM(@Name))
LIMIT 1;";
            await using (var findCmd = new MySqlCommand(findArtistSql, connection, transaction))
            {
                findCmd.Parameters.AddWithValue("@Name", artistName);
                await using var reader = await findCmd.ExecuteReaderAsync(cancellationToken);
                if (await reader.ReadAsync(cancellationToken))
                {
                    artistId = reader.GetInt32(reader.GetOrdinal("Id"));
                    resolvedArtistName = reader.GetString("Name");
                }
            }

            if (artistId <= 0)
            {
                const string fallbackArtistSql = @"SELECT Id, Name FROM Artists ORDER BY Id LIMIT 1;";
                await using var fallbackCmd = new MySqlCommand(fallbackArtistSql, connection, transaction);
                await using var reader = await fallbackCmd.ExecuteReaderAsync(cancellationToken);
                if (await reader.ReadAsync(cancellationToken))
                {
                    artistId = reader.GetInt32(reader.GetOrdinal("Id"));
                    resolvedArtistName = reader.GetString("Name");
                }
            }

            if (artistId <= 0)
            {
                artistId = 0;
                resolvedArtistName = "TuneVault";
            }

            const string insertAlbumSql = @"
INSERT INTO Albums (Title, Description, CoverImageUrl, ArtistId, ReleaseDate)
VALUES (@Title, NULL, @CoverImageUrl, @ArtistId, @ReleaseDate);
SELECT LAST_INSERT_ID();";

            int albumId;
            await using (var insertCmd = new MySqlCommand(insertAlbumSql, connection, transaction))
            {
                insertCmd.Parameters.AddWithValue("@Title", title);
                insertCmd.Parameters.AddWithValue("@CoverImageUrl", (object?)cover ?? DBNull.Value);
                insertCmd.Parameters.AddWithValue("@ArtistId", artistId);
                insertCmd.Parameters.AddWithValue("@ReleaseDate", releaseDate);
                var result = await insertCmd.ExecuteScalarAsync(cancellationToken);
                albumId = Convert.ToInt32(result, CultureInfo.InvariantCulture);
            }

            await transaction.CommitAsync(cancellationToken);
            return new AlbumDto(albumId, title, cover, artistId, resolvedArtistName, releaseDate.ToString("yyyy-MM-dd"));
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<AlbumDto?> UpdateAlbumCoverAsync(string albumId, string? coverImageUrl, CancellationToken cancellationToken = default)
    {
        await using var connection = new MySqlConnection(ConnectionString);
        await connection.OpenAsync(cancellationToken);

        const string updateSql = @"UPDATE Albums SET CoverImageUrl = @CoverImageUrl WHERE Id = @Id;";
        await using (var command = new MySqlCommand(updateSql, connection))
        {
            command.Parameters.AddWithValue("@Id", int.Parse(albumId, CultureInfo.InvariantCulture));
            command.Parameters.AddWithValue("@CoverImageUrl", (object?)coverImageUrl ?? DBNull.Value);
            await command.ExecuteNonQueryAsync(cancellationToken);
        }

        const string selectSql = @"
SELECT a.Id, a.Title, a.CoverImageUrl, a.ArtistId, art.Name AS ArtistName, DATE_FORMAT(a.ReleaseDate, '%Y-%m-%d') AS ReleaseDate
FROM Albums a
LEFT JOIN Artists art ON art.Id = a.ArtistId
WHERE a.Id = @Id
LIMIT 1;";

        await using (var command = new MySqlCommand(selectSql, connection))
        {
            command.Parameters.AddWithValue("@Id", int.Parse(albumId, CultureInfo.InvariantCulture));
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            if (!await reader.ReadAsync(cancellationToken))
            {
                return null;
            }

            return new AlbumDto(
                reader.GetInt32(reader.GetOrdinal("Id")),
                reader.GetString("Title"),
                reader.IsDBNull(reader.GetOrdinal("CoverImageUrl")) ? null : reader.GetString("CoverImageUrl"),
                reader.GetInt32(reader.GetOrdinal("ArtistId")),
                reader.IsDBNull(reader.GetOrdinal("ArtistName")) ? null : reader.GetString("ArtistName"),
                reader.GetString("ReleaseDate"));
        }
    }

    public async Task<MediaItemDto?> UpdateMediaCoverAsync(string mediaItemId, string? coverImageUrl, CancellationToken cancellationToken = default)
    {
        await using var connection = new MySqlConnection(ConnectionString);
        await connection.OpenAsync(cancellationToken);

        const string updateSql = @"UPDATE MediaItems SET CoverImageUrl = @CoverImageUrl WHERE Id = @Id;";
        await using (var command = new MySqlCommand(updateSql, connection))
        {
            command.Parameters.AddWithValue("@Id", int.Parse(mediaItemId, CultureInfo.InvariantCulture));
            command.Parameters.AddWithValue("@CoverImageUrl", (object?)coverImageUrl ?? DBNull.Value);
            await command.ExecuteNonQueryAsync(cancellationToken);
        }

        return await GetMediaItemByIdAsync(mediaItemId, cancellationToken);
    }

    public async Task<bool> AssignMediaToAlbumAsync(string albumId, string mediaItemId, CancellationToken cancellationToken = default)
    {
        await using var connection = new MySqlConnection(ConnectionString);
        await connection.OpenAsync(cancellationToken);

        const string updateSql = @"UPDATE MediaItems SET AlbumId = @AlbumId WHERE Id = @MediaItemId;";
        await using var command = new MySqlCommand(updateSql, connection);
        command.Parameters.AddWithValue("@AlbumId", int.Parse(albumId, CultureInfo.InvariantCulture));
        command.Parameters.AddWithValue("@MediaItemId", int.Parse(mediaItemId, CultureInfo.InvariantCulture));
        var rows = await command.ExecuteNonQueryAsync(cancellationToken);
        return rows > 0;
    }

    public async Task RecordPlayHistoryAsync(RecordPlayHistoryCommand command, CancellationToken cancellationToken = default)
    {
        await using var connection = new MySqlConnection(ConnectionString);
        await connection.OpenAsync(cancellationToken);

        const string sql = @"
INSERT INTO PlayHistories (UserId, MediaItemId, PlayedAt)
VALUES (@UserId, @MediaItemId, NOW());";

        await using var sqlCommand = new MySqlCommand(sql, connection);
        sqlCommand.Parameters.AddWithValue("@UserId", command.UserId);
        sqlCommand.Parameters.AddWithValue("@MediaItemId", command.MediaItemId);
        await sqlCommand.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task<NotificationDto> ShareMediaAsync(ShareMediaCommand command, CancellationToken cancellationToken = default)
    {
        await using var connection = new MySqlConnection(ConnectionString);
        await connection.OpenAsync(cancellationToken);

        var payload = new
        {
            senderUserId = command.SenderUserId,
            senderName = command.SenderName ?? "Nguoi dung",
            mediaItemId = command.MediaItemId,
            playlistId = command.PlaylistId,
        };

        var payloadJson = JsonSerializer.Serialize(payload);

        const string sql = @"
INSERT INTO Notifications (UserId, Type, PayloadJson, IsRead, CreatedAt)
VALUES (@UserId, @Type, @PayloadJson, @IsRead, @CreatedAt);
SELECT LAST_INSERT_ID();";

        await using var insertCommand = new MySqlCommand(sql, connection);
        insertCommand.Parameters.AddWithValue("@UserId", command.ReceiverUserId);
        insertCommand.Parameters.AddWithValue("@Type", "ShareMedia");
        insertCommand.Parameters.AddWithValue("@PayloadJson", payloadJson);
        insertCommand.Parameters.AddWithValue("@IsRead", false);
        insertCommand.Parameters.AddWithValue("@CreatedAt", DateTime.UtcNow);

        var result = await insertCommand.ExecuteScalarAsync(cancellationToken);
        var notificationId = Convert.ToInt32(result, CultureInfo.InvariantCulture);

        return new NotificationDto(
            notificationId,
            command.ReceiverUserId,
            "ShareMedia",
            payloadJson,
            false,
            DateTime.UtcNow
        );
    }

    public async Task<RecommendationContextDto> GetRecommendationContextAsync(string userId, int historyLimit = 20, int candidateLimit = 30, CancellationToken cancellationToken = default)
    {
        await using var connection = new MySqlConnection(ConnectionString);
        await connection.OpenAsync(cancellationToken);

        var recentPlays = new List<MediaItemDto>();
        var candidateItems = new List<MediaItemDto>();

        const string historySql = @"
SELECT m.Id, m.Title, m.FilePath, m.Duration, m.MediaType, m.ArtistId, m.AlbumId, m.Description,
       a.Title AS AlbumTitle, art.Name AS ArtistName, COALESCE(m.CoverImageUrl, a.CoverImageUrl) AS CoverImageUrl
FROM PlayHistories ph
INNER JOIN MediaItems m ON m.Id = ph.MediaItemId
LEFT JOIN Albums a ON a.Id = m.AlbumId
LEFT JOIN Artists art ON art.Id = m.ArtistId
WHERE ph.UserId = @UserId
ORDER BY ph.PlayedAt DESC
LIMIT @Limit;";

        await using (var command = new MySqlCommand(historySql, connection))
        {
            command.Parameters.AddWithValue("@UserId", int.Parse(userId, CultureInfo.InvariantCulture));
            command.Parameters.AddWithValue("@Limit", Math.Clamp(historyLimit, 1, 100));

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                recentPlays.Add(MapMediaItem(reader));
            }
        }

        const string candidatesSql = @"
SELECT m.Id, m.Title, m.FilePath, m.Duration, m.MediaType, m.ArtistId, m.AlbumId, m.Description,
       a.Title AS AlbumTitle, art.Name AS ArtistName, COALESCE(m.CoverImageUrl, a.CoverImageUrl) AS CoverImageUrl
FROM MediaItems m
LEFT JOIN Albums a ON a.Id = m.AlbumId
LEFT JOIN Artists art ON art.Id = m.ArtistId
WHERE m.Id NOT IN (
    SELECT ph.MediaItemId
    FROM PlayHistories ph
    WHERE ph.UserId = @UserId
)
ORDER BY m.CreatedAt DESC
LIMIT @Limit;";

        await using (var command = new MySqlCommand(candidatesSql, connection))
        {
            command.Parameters.AddWithValue("@UserId", int.Parse(userId, CultureInfo.InvariantCulture));
            command.Parameters.AddWithValue("@Limit", Math.Clamp(candidateLimit, 1, 100));

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                candidateItems.Add(MapMediaItem(reader));
            }
        }

        return new RecommendationContextDto(recentPlays, candidateItems);
    }

    public async Task<IReadOnlyList<NotificationDto>> GetNotificationsAsync(string userId, CancellationToken cancellationToken = default)
    {
        await using var connection = new MySqlConnection(ConnectionString);
        await connection.OpenAsync(cancellationToken);

        const string sql = @"
    SELECT Id, UserId, Type, PayloadJson, IsRead, CreatedAt
    FROM Notifications
    WHERE UserId = @UserId
    ORDER BY CreatedAt DESC LIMIT 50; ";

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@UserId", int.Parse(userId, System.Globalization.CultureInfo.InvariantCulture));

        var items = new List<NotificationDto>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {

            var dbDateTime = reader.GetDateTime("CreatedAt");
            var utcDateTime = DateTime.SpecifyKind(dbDateTime, DateTimeKind.Utc);

            items.Add(new NotificationDto(
                reader.GetInt32(reader.GetOrdinal("Id")),
                reader.GetInt32(reader.GetOrdinal("UserId")),
                reader.GetString("Type"),
                reader.GetString("PayloadJson"),
                reader.GetBoolean("IsRead"),
                utcDateTime
            ));
        }
        return items;
    }

    public async Task MarkNotificationAsReadAsync(string notificationId, CancellationToken cancellationToken = default)
    {
        await using var connection = new MySqlConnection(ConnectionString);
        await connection.OpenAsync(cancellationToken);

        const string sql = @"
        UPDATE Notifications SET IsRead = 1 WHERE Id = @Id;";

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@Id", notificationId);

        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task MarkAllNotificationsAsReadAsync(string userId, CancellationToken cancellationToken = default)
    {
        await using var connection = new MySqlConnection(ConnectionString);
        await connection.OpenAsync(cancellationToken);

        const string sql = @"
        UPDATE Notifications SET IsRead = 1 WHERE UserId = @UserId AND IsRead = 0;";

        await using var command = new MySqlCommand(sql, connection);
        command.Parameters.AddWithValue("@UserId", int.Parse(userId, System.Globalization.CultureInfo.InvariantCulture));
        await command.ExecuteNonQueryAsync(cancellationToken);

    }

    public async Task<IReadOnlyList<PlayHistoryDto>> GetRecentPlayHistoriesAsync(string userId, int limit = 10, CancellationToken cancellationToken = default)
    {
        await using var connection = new MySqlConnection(ConnectionString);
        await connection.OpenAsync(cancellationToken);

        const string sql = @"
    WITH RankedHistory AS (
    SELECT
        ph.Id,
        ph.MediaItemId,
        m.Title AS MediaTitle,
        art.Name AS ArtistName,
        COALESCE(m.CoverImageUrl, a.CoverImageUrl) AS CoverImageUrl,
        ph.PlayedAt,
        ROW_NUMBER() OVER(PARTITION BY ph.MediaItemId ORDER BY ph.PlayedAt DESC) as rn
    FROM PlayHistories ph
    INNER JOIN MediaItems m ON ph.MediaItemId = m.Id
    LEFT JOIN Albums a ON m.AlbumId = a.Id
    LEFT JOIN Artists art ON m.ArtistId = art.Id
    WHERE ph.UserId = @UserId
)
SELECT Id, MediaItemId, MediaTitle, ArtistName, CoverImageUrl, PlayedAt
FROM RankedHistory
WHERE rn = 1
ORDER BY PlayedAt DESC
LIMIT @Limit;
";
        
        await using var command = new MySqlCommand(sql,connection);
        command.Parameters.AddWithValue("@UserId", int.Parse(userId, System.Globalization.CultureInfo.InvariantCulture));
        command.Parameters.AddWithValue("@Limit", limit);

        var items = new List<PlayHistoryDto>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            items.Add(new PlayHistoryDto(
                reader.GetInt32(reader.GetOrdinal("Id")),
                reader.GetInt32(reader.GetOrdinal("MediaItemId")),
                reader.IsDBNull(reader.GetOrdinal("MediaTitle")) ? null : reader.GetString("MediaTitle"),
                reader.IsDBNull(reader.GetOrdinal("ArtistName")) ? null : reader.GetString("ArtistName"),
                reader.IsDBNull(reader.GetOrdinal("CoverImageUrl")) ? null : reader.GetString("CoverImageUrl"),
                reader.GetDateTime("PlayedAt")
            ));
        }
        return items;
    }

    // ── helpers ──────────────────────────────────────────────────────────

    /// <summary>
    /// Load media items, optionally filtered by mediaType. Pass null to load all types.
    /// </summary>
    private static async Task<IReadOnlyList<MediaItemDto>> LoadMediaItemsAsync(MySqlConnection connection, string? mediaType, CancellationToken cancellationToken)
    {
        var sql = mediaType is null
            ? @"SELECT m.Id, m.Title, m.FilePath, m.Duration, m.MediaType, m.ArtistId AS ArtistId, m.AlbumId, m.Description,
    a.Title AS AlbumTitle, art.Name AS ArtistName, COALESCE(m.CoverImageUrl, a.CoverImageUrl) AS CoverImageUrl
FROM MediaItems m
LEFT JOIN Albums a ON a.Id = m.AlbumId
LEFT JOIN Artists art ON art.Id = m.ArtistId
ORDER BY m.CreatedAt DESC;"
            : @"SELECT m.Id, m.Title, m.FilePath, m.Duration, m.MediaType, m.ArtistId AS ArtistId, m.AlbumId, m.Description,
    a.Title AS AlbumTitle, art.Name AS ArtistName, COALESCE(m.CoverImageUrl, a.CoverImageUrl) AS CoverImageUrl
FROM MediaItems m
LEFT JOIN Albums a ON a.Id = m.AlbumId
LEFT JOIN Artists art ON art.Id = m.ArtistId
WHERE m.MediaType = @MediaType
ORDER BY m.CreatedAt DESC;";

        await using var command = new MySqlCommand(sql, connection);
        if (mediaType is not null)
        {
            command.Parameters.AddWithValue("@MediaType", mediaType);
        }

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
LEFT JOIN Artists art ON art.Id = a.ArtistId
ORDER BY a.ReleaseDate DESC;";

        await using var command = new MySqlCommand(sql, connection);
        var items = new List<AlbumDto>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            items.Add(new AlbumDto(
                reader.GetInt32(reader.GetOrdinal("Id")),
                reader.GetString("Title"),
                reader.IsDBNull(reader.GetOrdinal("CoverImageUrl")) ? null : reader.GetString("CoverImageUrl"),
                reader.GetInt32(reader.GetOrdinal("ArtistId")),
                reader.IsDBNull(reader.GetOrdinal("ArtistName")) ? null : reader.GetString("ArtistName"),
                reader.GetString("ReleaseDate")));
        }

        return items;
    }

    private static async Task<IReadOnlyList<PlaylistDto>> LoadPlaylistsAsync(MySqlConnection connection, int? userId, CancellationToken cancellationToken)
    {
        const string sql = @"
SELECT p.Id, p.Name, p.Description, p.IsPublic, p.CreatedByUserId, COUNT(pt.MediaItemId) AS TrackCount,
    (
        SELECT COALESCE(m.CoverImageUrl, a.CoverImageUrl)
        FROM PlaylistTracks pt2
        INNER JOIN MediaItems m ON m.Id = pt2.MediaItemId
        LEFT JOIN Albums a ON a.Id = m.AlbumId
        WHERE pt2.PlaylistId = p.Id
        ORDER BY pt2.AddedAt DESC
        LIMIT 1
    ) AS CoverImageUrl
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
                reader.GetInt32(reader.GetOrdinal("Id")),
                reader.GetString("Name"),
                reader.IsDBNull(reader.GetOrdinal("Description")) ? null : reader.GetString("Description"),
                reader.GetBoolean("IsPublic"),
                reader.GetInt32(reader.GetOrdinal("CreatedByUserId")),
                Convert.ToInt32(reader["TrackCount"]),
                reader.IsDBNull(reader.GetOrdinal("CoverImageUrl")) ? null : reader.GetString("CoverImageUrl")));
        }

        return items;
    }

    private static MediaItemDto MapMediaItem(MySqlDataReader reader)
    {
        var id = reader.GetInt32(reader.GetOrdinal("Id"));
        var title = reader.GetString("Title");
        var filePath = reader.GetString("FilePath");
        var duration = reader.GetString("Duration");
        var mediaType = reader.GetString("MediaType");

        var description = reader.IsDBNull(reader.GetOrdinal("Description"))
            ? string.Empty
            : reader.GetString("Description");

        int? artistId = reader.IsDBNull(reader.GetOrdinal("ArtistId"))
            ? null
            : reader.GetInt32(reader.GetOrdinal("ArtistId"));

        int? albumId = reader.IsDBNull(reader.GetOrdinal("AlbumId"))
            ? null
            : reader.GetInt32(reader.GetOrdinal("AlbumId"));

        var albumTitle = reader.IsDBNull(reader.GetOrdinal("AlbumTitle"))
            ? null
            : reader.GetString("AlbumTitle");

        var artistName = reader.IsDBNull(reader.GetOrdinal("ArtistName"))
            ? null
            : reader.GetString("ArtistName");

        var coverImageUrl = reader.IsDBNull(reader.GetOrdinal("CoverImageUrl"))
            ? null
            : reader.GetString("CoverImageUrl");

        return new MediaItemDto(id, title, filePath, description, duration, mediaType, artistId, albumId, albumTitle, artistName, coverImageUrl);
    }

}