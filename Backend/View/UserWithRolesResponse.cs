namespace cams.Backend.View
{
    public class UserWithRolesResponse
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? PhoneNumber { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public ICollection<RoleResponse> Roles { get; set; } = new List<RoleResponse>();
        public int ApplicationCount { get; set; }
        public int DatabaseConnectionCount { get; set; }
    }
}