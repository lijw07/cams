namespace cams.Backend.View
{
    public class DatabaseConnectionTestRequest
    {
        public Guid? ConnectionId { get; set; }
        public DatabaseConnectionRequest? ConnectionDetails { get; set; }
    }
}