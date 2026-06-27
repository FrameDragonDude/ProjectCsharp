 using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Backend.Data;
using Backend.Models;

namespace Backend.Services;

public interface IClaudeRecommendationService
{
    Task<IReadOnlyList<SongRecommendationDto>> RecommendSongsAsync(
        string userId,
        int count = 5,
        CancellationToken cancellationToken = default);
}

public sealed class ClaudeRecommendationService(
    HttpClient httpClient,
    IConfiguration configuration,
    IMusicCatalogRepository repository) : IClaudeRecommendationService
{
    private const string AnthropicVersion = "2023-06-01";

    public async Task<IReadOnlyList<SongRecommendationDto>> RecommendSongsAsync(
        string userId,
        int count = 5,
        CancellationToken cancellationToken = default)
    {
        var normalizedCount = Math.Clamp(count, 1, 10);
        var context = await repository.GetRecommendationContextAsync(userId, 20, 50, cancellationToken);

        if (context.CandidateItems.Count == 0)
        {
            return Array.Empty<SongRecommendationDto>();
        }

        if (context.RecentPlays.Count == 0)
        {
            return context.CandidateItems
                .Take(normalizedCount)
                .Select(item => new SongRecommendationDto(item, "Người dùng chưa có lịch sử nghe, gợi ý bài mới trong thư viện."))
                .ToList();
        }

        var apiKey = configuration["Claude:ApiKey"]
            ?? Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY");

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException("Missing Claude API key. Set Claude:ApiKey or ANTHROPIC_API_KEY.");
        }

        var model = configuration["Claude:Model"] ?? "claude-sonnet-4-5";

        var prompt = BuildPrompt(context, normalizedCount);

        var requestBody = new
        {
            model,
            max_tokens = 800,
            temperature = 0.4,
            system = "You are a music recommendation assistant. Return only valid JSON. Recommend only candidate mediaItemIds provided by the app.",
            messages = new[]
            {
                new
                {
                    role = "user",
                    content = prompt
                }
            }
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.anthropic.com/v1/messages");
        request.Headers.Add("x-api-key", apiKey);
        request.Headers.Add("anthropic-version", AnthropicVersion);
        request.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
        request.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");

        using var response = await httpClient.SendAsync(request, cancellationToken);
        var responseText = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"Claude API request failed with {(int)response.StatusCode}: {responseText}");
        }

        var claudeText = ExtractClaudeText(responseText);
        return MapRecommendations(claudeText, context.CandidateItems, normalizedCount);
    }

    private static string BuildPrompt(RecommendationContextDto context, int count)
    {
        var recent = context.RecentPlays.Select(item => new
        {
            mediaItemId = item.Id,
            item.Title,
            item.MediaType,
            item.ArtistName,
            item.AlbumTitle,
            item.Duration
        });

        var candidates = context.CandidateItems.Select(item => new
        {
            mediaItemId = item.Id,
            item.Title,
            item.MediaType,
            item.ArtistName,
            item.AlbumTitle,
            item.Duration
        });

        return $$"""
        Based on this user's recent listening history, choose {{count}} suitable recommendations from the candidate list.

        Recent history JSON:
        {{JsonSerializer.Serialize(recent)}}

        Candidate items JSON:
        {{JsonSerializer.Serialize(candidates)}}

        Return exactly this JSON shape, no markdown:
        {
        "recommendations": [
            { "mediaItemId": "id from candidates", "reason": "short Vietnamese reason" }
        ]
        }
        """;
    }

    private static string ExtractClaudeText(string responseText)
    {
        using var document = JsonDocument.Parse(responseText);
        var content = document.RootElement.GetProperty("content");

        foreach (var block in content.EnumerateArray())
        {
            if (block.TryGetProperty("type", out var type)
                && type.GetString() == "text"
                && block.TryGetProperty("text", out var text))
            {
                return text.GetString() ?? string.Empty;
            }
        }

        return string.Empty;
    }

    private static IReadOnlyList<SongRecommendationDto> MapRecommendations(
        string claudeText,
        IReadOnlyList<MediaItemDto> candidateItems,
        int count)
    {
        using var document = JsonDocument.Parse(claudeText);
        var byId = candidateItems.ToDictionary(item => item.Id);
        var recommendations = new List<SongRecommendationDto>();

        if (!document.RootElement.TryGetProperty("recommendations", out var items))
        {
            return recommendations;
        }

        foreach (var item in items.EnumerateArray())
        {
            var mediaItemId = item.GetProperty("mediaItemId").GetInt32();

            if (!byId.TryGetValue(mediaItemId, out var mediaItem))
            {
                continue;
            }

            var reason = item.TryGetProperty("reason", out var reasonElement)
                ? reasonElement.GetString() ?? "Phù hợp với lịch sử nghe gần đây."
                : "Phù hợp với lịch sử nghe gần đây.";

            recommendations.Add(new SongRecommendationDto(mediaItem, reason));

            if (recommendations.Count == count)
            {
                break;
            }
        }

        return recommendations;
    }
}

