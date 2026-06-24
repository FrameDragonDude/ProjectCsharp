namespace Backend.Models;

public sealed record MediaItemDto(
    int Id,
    string Title,
    string FilePath,
    string Description,
    string Duration,
    string MediaType,
    int? ArtistId,
    // int OwnerId,
    int? AlbumId,
    string? AlbumTitle,
    string? ArtistName,
    string? CoverImageUrl);

public sealed record AlbumDto(
    int Id,
    string Title,
    string? CoverImageUrl,
    int ArtistId,
    string? ArtistName,
    string ReleaseDate);

public sealed record ArtistSummaryDto(
    int Id,
    string Name,
    string? Bio,
    string? AvatarUrl,
    int AlbumCount,
    int TrackCount,
    string? CoverImageUrl);

public sealed record ArtistDetailDto(
    ArtistSummaryDto Artist,
    IReadOnlyList<AlbumDto> Albums,
    IReadOnlyList<MediaItemDto> Songs);

public sealed record PlaylistDto(
    int Id,
    string Name,
    string? Description,
    bool IsPublic,
    int CreatedByUserId,
    int TrackCount,
    string? CoverImageUrl);

public sealed record SearchResultDto(
    int Id,
    string Title,
    string Subtitle,
    string Type,
    string? MediaType,
    int? AlbumId,
    string? FilePath,
    string? CoverImageUrl);

public sealed record LibrarySummaryDto(
    IReadOnlyList<MediaItemDto> Songs,
    IReadOnlyList<AlbumDto> Albums,
    IReadOnlyList<PlaylistDto> Playlists);

public sealed record CreatePlaylistRequest(string Name, string? Description, int? CreatedByUserId);

public sealed record AddTrackRequest(string MediaItemId);

public sealed record CreateAlbumRequest(string Title, string ArtistName, string? CoverImageUrl, string? ReleaseDate);
public sealed record UpdateAlbumCoverRequest(string? CoverImageUrl);

public sealed record RecordPlayHistoryCommand(int UserId, int MediaItemId);

public sealed record ShareMediaCommand(
    int SenderUserId,
    int ReceiverUserId,
    int? MediaItemId,
    int? PlaylistId,
    string ? SenderName);

public sealed record NotificationDto(
    int Id,
    int UserId,
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
    int Id,
    int MediaItemId,
    string? MediaTitle,
    string? ArtistName,
    string? CoverImageUrl,
    DateTime PlayedAt
);
