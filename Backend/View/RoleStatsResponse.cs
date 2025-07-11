namespace cams.Backend.View
{
    public class RoleStatsResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int TotalUsers { get; set; }
        public int ActiveUsers { get; set; }
        public int RecentAssignments { get; set; }
        public DateTime? LastAssigned { get; set; }
        public List<UserRoleAssignmentStat> RecentAssignmentHistory { get; set; } = new();
        public List<string> TopPermissions { get; set; } = new();
    }
}