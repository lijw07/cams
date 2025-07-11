namespace cams.Backend.View
{
    public class UserRoleInfo
    {
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime AssignedAt { get; set; }
        public int? AssignedBy { get; set; }
        public string? AssignedByName { get; set; }
    }
}