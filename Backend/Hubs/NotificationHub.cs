using Microsoft.AspNetCore.SignalR;

namespace Backend.Hubs;

public sealed class NotificationHub : Hub
{
    public async Task JoinUserGroup(string userId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"user:{userId}");
    }
}