namespace cams.Backend.View
{
    public class UserRoleResponse
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public Guid RoleId { get; set; }
        public string RoleName { get; set; } = string.Empty;
        public DateTime AssignedAt { get; set; }
        public Guid? AssignedBy { get; set; }
        public string? AssignedByUsername { get; set; }
        public bool IsActive { get; set; }
    }
}