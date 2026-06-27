public class ShareDto
{
    public int Id { get; set; }
    
    public int SenderUserId { get; set; }
    public string SenderFullName { get; set; } = string.Empty;
    
    public int ReceiverUserId { get; set; }
    public string ReceiverFullName { get; set; } = string.Empty;
    
    public int? MediaItemId { get; set; }
    public string? MediaItemTitle { get; set; }
    
    public DateTime SharedAt { get; set; }
}