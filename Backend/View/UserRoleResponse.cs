namespace cams.Backend.View
{
    public class UserRoleResponse
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public int RoleId { get; set; }
        public string RoleName { get; set; } = string.Empty;
        public DateTime AssignedAt { get; set; }
        public int? AssignedBy { get; set; }
        public string? AssignedByUsername { get; set; }
        public bool IsActive { get; set; }
    }
}