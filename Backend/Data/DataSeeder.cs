using cams.Backend.Constants;
using cams.Backend.Model;
using Microsoft.EntityFrameworkCore;

namespace cams.Backend.Data
{
    public static class DataSeeder
    {
        public static async Task SeedAsync(ApplicationDbContext context)
        {
            try
            {
                // Ensure database is created
                await context.Database.EnsureCreatedAsync();
                
                // Seed roles
                await SeedRolesAsync(context);
                
                // Seed default users
                await SeedDefaultUsersAsync(context);
                
                // Seed default user roles
                await SeedDefaultUserRolesAsync(context);
                
                await context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // Log error in a real application
                Console.WriteLine($"Error seeding data: {ex.Message}");
                throw;
            }
        }
        
        private static async Task SeedRolesAsync(ApplicationDbContext context)
        {
            // Check if roles already exist
            if (await context.Roles.AnyAsync())
            {
                return; // Roles already seeded
            }
            
            var roles = new List<Role>();
            
            foreach (var roleName in RoleConstants.DefaultRoles)
            {
                var role = new Role
                {
                    Name = roleName,
                    Description = RoleConstants.RoleDescriptions[roleName],
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                
                roles.Add(role);
            }
            
            await context.Roles.AddRangeAsync(roles);
            Console.WriteLine($"Seeded {roles.Count} default roles");
        }
        
        private static async Task SeedDefaultUsersAsync(ApplicationDbContext context)
        {
            // Check if users already exist
            if (await context.Users.AnyAsync())
            {
                return; // Users already seeded
            }
            
            var users = new List<User>
            {
                new User
                {
                    Username = "platformadmin",
                    Email = "platformadmin@cams.local",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("PlatformAdmin123!"),
                    FirstName = "Platform",
                    LastName = "Administrator",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new User
                {
                    Username = "admin",
                    Email = "admin@cams.local",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                    FirstName = "System",
                    LastName = "Administrator",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new User
                {
                    Username = "user",
                    Email = "user@cams.local",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("User123!"),
                    FirstName = "Demo",
                    LastName = "User",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };
            
            await context.Users.AddRangeAsync(users);
            Console.WriteLine($"Seeded {users.Count} default users");
        }
        
        private static async Task SeedDefaultUserRolesAsync(ApplicationDbContext context)
        {
            // Check if user roles already exist
            if (await context.UserRoles.AnyAsync())
            {
                return; // User roles already seeded
            }
            
            // Get roles
            var platformAdminRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == RoleConstants.PLATFORM_ADMIN);
            var adminRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == RoleConstants.ADMIN);
            var userRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == RoleConstants.USER);
            
            if (platformAdminRole == null || adminRole == null || userRole == null)
            {
                Console.WriteLine("Roles not found, cannot seed user roles");
                return;
            }
            
            // Get users by username
            var platformAdminUser = await context.Users.FirstOrDefaultAsync(u => u.Username == "platformadmin");
            var adminUser = await context.Users.FirstOrDefaultAsync(u => u.Username == "admin");
            var regularUser = await context.Users.FirstOrDefaultAsync(u => u.Username == "user");
            
            if (platformAdminUser == null || adminUser == null || regularUser == null)
            {
                Console.WriteLine("Users not found, cannot seed user roles");
                return;
            }
            
            var userRoles = new List<UserRole>
            {
                // Platform Admin user gets Platform_Admin role
                new UserRole
                {
                    UserId = platformAdminUser.Id,
                    RoleId = platformAdminRole.Id,
                    AssignedAt = DateTime.UtcNow,
                    IsActive = true
                },
                // Admin user gets Admin role
                new UserRole
                {
                    UserId = adminUser.Id,
                    RoleId = adminRole.Id,
                    AssignedAt = DateTime.UtcNow,
                    IsActive = true
                },
                // Regular user gets User role
                new UserRole
                {
                    UserId = regularUser.Id,
                    RoleId = userRole.Id,
                    AssignedAt = DateTime.UtcNow,
                    IsActive = true
                }
            };
            
            await context.UserRoles.AddRangeAsync(userRoles);
            Console.WriteLine($"Seeded {userRoles.Count} default user role assignments");
        }
    }
}