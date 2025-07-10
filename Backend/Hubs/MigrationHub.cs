using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace cams.Backend.Hubs
{
    [Authorize]
    public class MigrationHub : Hub
    {
        public async Task JoinMigrationGroup(string progressId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"migration_{progressId}");
        }

        public async Task LeaveMigrationGroup(string progressId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"migration_{progressId}");
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await base.OnDisconnectedAsync(exception);
        }
    }
}