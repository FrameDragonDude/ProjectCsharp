using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Backend.Domain.Entities;

public class Artist
{
    [Key]
    public int Id { get; set; } 

    [Required]
    [MaxLength(256)]
    public string Name { get; set; } = string.Empty;

    public string? Bio { get; set; }

    [MaxLength(512)]
    public string? AvatarUrl { get; set; }

    // Navigation Properties
    public virtual ICollection<Album> Albums { get; set; } = new List<Album>();
}
