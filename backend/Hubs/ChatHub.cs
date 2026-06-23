using System;
using System.Security.Claims;
using backend.Authorization;
using backend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace backend.Hubs;

/// <summary>Realtime chat: client gọi JoinRoom sau khi có JWT (query access_token hoặc header).</summary>
[Authorize(Policy = AuthPolicies.Member)]
public class ChatHub : Hub
{
    private readonly IServiceScopeFactory _scopeFactory;

    public ChatHub(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    public static string RoomGroupName(int roomId) => $"chat_room_{roomId}";

    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        Console.WriteLine($"[SignalR ChatHub] Client connected: ConnectionId={Context.ConnectionId}, UserId={userId}, UserAuthenticated={Context.User?.Identity?.IsAuthenticated}");
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        Console.WriteLine($"[SignalR ChatHub] Client disconnected: ConnectionId={Context.ConnectionId}, Exception={exception?.Message}");
        await base.OnDisconnectedAsync(exception);
    }

    public async Task JoinRoom(int roomId)
    {
        var userId = GetUserId();
        Console.WriteLine($"[SignalR ChatHub] JoinRoom request: ConnectionId={Context.ConnectionId}, UserId={userId}, RoomId={roomId}");
        if (userId == 0)
        {
            Console.WriteLine($"[SignalR ChatHub] JoinRoom failed: UserId is 0");
            return;
        }

        await using var scope = _scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var isMember = await db.ChatRoomMembers.AnyAsync(m => m.RoomId == roomId && m.UserId == userId);
        Console.WriteLine($"[SignalR ChatHub] JoinRoom check member: RoomId={roomId}, UserId={userId}, IsMember={isMember}");
        if (!isMember)
        {
            Console.WriteLine($"[SignalR ChatHub] JoinRoom failed: User is not member of room {roomId}");
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, RoomGroupName(roomId));
        Console.WriteLine($"[SignalR ChatHub] JoinRoom success: Added ConnectionId={Context.ConnectionId} to group {RoomGroupName(roomId)}");
    }

    public async Task LeaveRoom(int roomId)
    {
        Console.WriteLine($"[SignalR ChatHub] LeaveRoom request: ConnectionId={Context.ConnectionId}, RoomId={roomId}");
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, RoomGroupName(roomId));
    }

    private int GetUserId()
    {
        var sub = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        Console.WriteLine($"[SignalR ChatHub] GetUserId debug: sub={sub}");
        return int.TryParse(sub, out var id) ? id : 0;
    }
}
