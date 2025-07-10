using cams.Backend.Model;
using cams.Backend.Constants;

namespace cams.Backend.Data
{
    public static class SharedUserRepository
    {
        private static readonly List<Role> _roles = new()
        {
            new Role { Id = 1, Name = RoleConstants.ADMIN, Description = "Administrator role", IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Role { Id = 2, Name = RoleConstants.PLATFORM_ADMIN, Description = "Platform administrator role", IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Role { Id = 3, Name = RoleConstants.USER, Description = "Regular user role", IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        };
        
        private static readonly List<UserRole> _userRoles = new()
        {
            new UserRole { Id = 1, UserId = 1, RoleId = 2, IsActive = true, AssignedAt = DateTime.UtcNow }, // PlatformAdmin for user 1
            new UserRole { Id = 2, UserId = 2, RoleId = 1, IsActive = true, AssignedAt = DateTime.UtcNow }, // Admin for user 2
            new UserRole { Id = 3, UserId = 3, RoleId = 3, IsActive = true, AssignedAt = DateTime.UtcNow }, // User for user 3
            new UserRole { Id = 4, UserId = 4, RoleId = 3, IsActive = true, AssignedAt = DateTime.UtcNow }  // User for testuser 4
        };
        
        private static readonly List<User> _users = new()
        {
            new User
            {
                Id = 1,
                Username = "platformadmin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("PlatformAdmin123!"),
                Email = "platformadmin@cams.local",
                FirstName = "Platform",
                LastName = "Administrator",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true
            },
            new User
            {
                Id = 2,
                Username = "admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                Email = "admin@cams.local",
                FirstName = "System",
                LastName = "Administrator",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true
            },
            new User
            {
                Id = 3,
                Username = "user",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("User123!"),
                Email = "user@cams.local",
                FirstName = "Demo",
                LastName = "User",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true
            },
            new User
            {
                Id = 4,
                Username = "testuser",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123"),
                Email = "testuser@cams.local",
                FirstName = "Test",
                LastName = "User",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true
            }
        };
        
        static SharedUserRepository()
        {
            // Set up navigation properties for mock data
            foreach (var user in _users)
            {
                user.UserRoles = _userRoles.Where(ur => ur.UserId == user.Id).ToList();
                foreach (var userRole in user.UserRoles)
                {
                    userRole.User = user;
                    userRole.Role = _roles.First(r => r.Id == userRole.RoleId);
                }
            }
        }
        
        public static List<User> GetUsers() => _users;
        public static List<Role> GetRoles() => _roles;
        public static List<UserRole> GetUserRoles() => _userRoles;
        
        public static User? GetUserById(int id) => _users.FirstOrDefault(u => u.Id == id && u.IsActive);
        public static User? GetUserByUsername(string username) => _users.FirstOrDefault(u => u.Username.Equals(username, StringComparison.OrdinalIgnoreCase) && u.IsActive);
        public static User? GetUserByEmail(string email) => _users.FirstOrDefault(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase) && u.IsActive);
        
        public static bool IsEmailTaken(string email, int excludeUserId = 0) => 
            _users.Any(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase) && u.Id != excludeUserId && u.IsActive);
            
        public static bool IsUsernameTaken(string username, int excludeUserId = 0) => 
            _users.Any(u => u.Username.Equals(username, StringComparison.OrdinalIgnoreCase) && u.Id != excludeUserId && u.IsActive);
            
        public static User CreateUser(User user, int defaultRoleId = 3) // Default to User role
        {
            // Assign next available ID
            user.Id = _users.Count > 0 ? _users.Max(u => u.Id) + 1 : 1;
            user.CreatedAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;
            user.IsActive = true;
            
            _users.Add(user);
            
            // Assign default role
            var userRole = new UserRole
            {
                Id = _userRoles.Count > 0 ? _userRoles.Max(ur => ur.Id) + 1 : 1,
                UserId = user.Id,
                RoleId = defaultRoleId,
                IsActive = true,
                AssignedAt = DateTime.UtcNow
            };
            
            _userRoles.Add(userRole);
            
            // Update navigation properties
            user.UserRoles = new List<UserRole> { userRole };
            userRole.User = user;
            userRole.Role = _roles.First(r => r.Id == defaultRoleId);
            
            return user;
        }
        
        public static bool AssignRoleToUser(int userId, int roleId)
        {
            var user = GetUserById(userId);
            var role = _roles.FirstOrDefault(r => r.Id == roleId && r.IsActive);
            
            if (user == null || role == null) return false;
            
            // Check if user already has this role
            if (_userRoles.Any(ur => ur.UserId == userId && ur.RoleId == roleId && ur.IsActive))
                return false;
                
            var userRole = new UserRole
            {
                Id = _userRoles.Count > 0 ? _userRoles.Max(ur => ur.Id) + 1 : 1,
                UserId = userId,
                RoleId = roleId,
                IsActive = true,
                AssignedAt = DateTime.UtcNow
            };
            
            _userRoles.Add(userRole);
            user.UserRoles.Add(userRole);
            userRole.User = user;
            userRole.Role = role;
            
            return true;
        }
    }
}