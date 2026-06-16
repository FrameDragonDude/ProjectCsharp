namespace Backend.Models;

public sealed record MediaItemDto(
    string Id,
    string Title,
    string FilePath,
    string Duration,
    string MediaType,
    string OwnerId,
    string? AlbumId,
    string? AlbumTitle,
    string? ArtistName,
    string? CoverImageUrl);

public sealed record AlbumDto(
    string Id,
    string Title,
    string? CoverImageUrl,
    string ArtistId,
    string? ArtistName,
    string ReleaseDate);

public sealed record PlaylistDto(
    string Id,
    string Name,
    string? Description,
    bool IsPublic,
    string CreatedByUserId,
    int TrackCount,
    string? CoverImageUrl);

public sealed record SearchResultDto(
    string Id,
    string Title,
    string Subtitle,
    string Type,
    string? MediaType,
    string? AlbumId,
    string? FilePath,
    string? CoverImageUrl);

public sealed record LibrarySummaryDto(
    IReadOnlyList<MediaItemDto> Songs,
    IReadOnlyList<AlbumDto> Albums,
    IReadOnlyList<PlaylistDto> Playlists);

public sealed record CreatePlaylistRequest(string Name, string? Description, string? CreatedByUserId);

public sealed record AddTrackRequest(string MediaItemId);

public sealed record CreateAlbumRequest(string Title, string ArtistName, string? CoverImageUrl, string? ReleaseDate);
public sealed record UpdateAlbumCoverRequest(string? CoverImageUrl);

public sealed record RecordPlayHistoryCommand(string UserId, string MediaItemId);

public sealed record ShareMediaCommand(
    string SenderUserId,
    string ReceiverUserId,
    string? MediaItemId,
    string? PlaylistId,
    string ? SenderName);

public sealed record NotificationDto(
    string Id,
    string UserId,
    string Type,
    string PayloadJson,
    bool IsRead,
    DateTime CreatedAt);

public sealed record RecommendationContextDto(
    IReadOnlyList<MediaItemDto> RecentPlays,
    IReadOnlyList<MediaItemDto> CandidateItems);

public sealed record SongRecommendationDto(
    MediaItemDto Item,
    string Reason);

public sealed record PlayHistoryDto(
    string Id,
    string MediaItemId,
    string? MediaTitle,
    DateTime PlayedAt
);
