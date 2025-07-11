namespace cams.Backend.View
{
    public class RoleStatsResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int TotalUsers { get; set; }
        public int ActiveUsers { get; set; }
        public int RecentAssignments { get; set; }
        public DateTime? LastAssigned { get; set; }
        public List<UserRoleAssignmentStat> RecentAssignmentHistory { get; set; } = new();
        public List<string> TopPermissions { get; set; } = new();
    }

    public class UserRoleAssignmentStat
    {
        public DateTime AssignedDate { get; set; }
        public int AssignedCount { get; set; }
        public int RemovedCount { get; set; }
    }
}