using System;
using System.ComponentModel.DataAnnotations;

namespace Backend.Domain.Entities;

public class Artist
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public string? Bio { get; set; }
    public string? AvatarUrl { get; set; }
}
