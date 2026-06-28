using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

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

    [Required]
    public int UserId { get; set; }

    // Navigation Properties
    [ForeignKey("UserId")]
    public virtual User? User { get; set; }
    public virtual ICollection<Album> Albums { get; set; } = new List<Album>();
}
