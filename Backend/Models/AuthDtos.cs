namespace Backend.Models;

public sealed record LoginRequest(string Username, string Password);
public sealed record RegisterRequest(string Username, string Email, string Password, string FullName);
public sealed record AuthResponse(string Token, int UserId, string Username, string Email, string FullName, string? AvatarUrl);

public sealed record UpdateProfileRequest(string FullName, string? AvatarUrl, string? Bio);
