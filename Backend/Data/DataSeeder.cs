using cams.Backend.Constants;
using cams.Backend.Model;
using Microsoft.EntityFrameworkCore;

namespace cams.Backend.Data
{
    /// <summary>
    /// Data seeder that creates initial roles and users with proper role assignments.
    /// 
    /// Role Structure:
    /// - PlatformAdmin: Full system access (assigned to 'platformadmin' user)
    /// - Admin: Administrative privileges (assigned to 'admin' user)
    /// - User: Regular user access (assigned to 'user' and 'testuser' users)
    /// </summary>
    public static class DataSeeder
    {
        public static async Task SeedAsync(ApplicationDbContext context)
        {
            try
            {
                Console.WriteLine("Starting database initialization...");

                // Check if we're using a relational database provider
                if (context.Database.IsRelational())
                {
                    // First check if tables exist but migration history is missing
                    var tablesExist = await CheckIfTablesExistAsync(context);
                    var hasMigrationHistory = await context.Database.GetAppliedMigrationsAsync();
                    
                    if (tablesExist && !hasMigrationHistory.Any())
                    {
                        Console.WriteLine("Tables exist but migration history is empty. Syncing migration history...");
                        await SyncMigrationHistoryAsync(context);
                    }
                    
                    Console.WriteLine("Checking for pending migrations...");
                    var pendingMigrations = await context.Database.GetPendingMigrationsAsync();
                    if (pendingMigrations.Any())
                    {
                        Console.WriteLine($"Applying {pendingMigrations.Count()} pending migrations...");
                        await context.Database.MigrateAsync();
                        Console.WriteLine("Migrations applied successfully.");
                    }
                    else
                    {
                        Console.WriteLine("No pending migrations found.");
                    }
                }
                else
                {
                    // For in-memory database (used in tests), use EnsureCreated
                    Console.WriteLine("Using in-memory database, creating schema...");
                    await context.Database.EnsureCreatedAsync();
                }

                Console.WriteLine("Database initialization completed. Starting data seeding...");

                // Seed roles
                await SeedRolesAsync(context);
                await context.SaveChangesAsync(); // Save roles to get IDs

                // Seed default users
                await SeedDefaultUsersAsync(context);
                await context.SaveChangesAsync(); // Save users to get IDs

                // Seed default user roles
                await SeedDefaultUserRolesAsync(context);
                await context.SaveChangesAsync(); // Save user roles
                Console.WriteLine("Data seeding completed successfully.");
            }
            catch (Exception ex)
            {
                // Log error in a real application
                Console.WriteLine($"Error seeding data: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
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
                },
                new User
                {
                    Username = "testuser",
                    Email = "testuser@cams.local",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123"),
                    FirstName = "Test",
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
            var testUser = await context.Users.FirstOrDefaultAsync(u => u.Username == "testuser");

            if (platformAdminUser == null || adminUser == null || regularUser == null || testUser == null)
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
                },
                // Test user also gets a User role
                new UserRole
                {
                    UserId = testUser.Id,
                    RoleId = userRole.Id,
                    AssignedAt = DateTime.UtcNow,
                    IsActive = true
                }
            };

            await context.UserRoles.AddRangeAsync(userRoles);
            Console.WriteLine($"Seeded {userRoles.Count} default user role assignments");
        }

        private static async Task<bool> CheckIfTablesExistAsync(ApplicationDbContext context)
        {
            try
            {
                // Check if the Roles table exists by trying to count records
                // This will throw if the table doesn't exist
                await context.Roles.CountAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        private static async Task SyncMigrationHistoryAsync(ApplicationDbContext context)
        {
            try
            {
                // Get all migrations defined in the assembly
                var allMigrations = context.Database.GetMigrations();
                
                // For each migration, add it to the history table
                foreach (var migration in allMigrations)
                {
                    var sql = @"
                        INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
                        SELECT @p0, @p1
                        WHERE NOT EXISTS (
                            SELECT 1 FROM ""__EFMigrationsHistory"" 
                            WHERE ""MigrationId"" = @p0
                        )";
                    
                    await context.Database.ExecuteSqlRawAsync(sql, migration, "8.0.11");
                }
                
                Console.WriteLine($"Synced {allMigrations.Count()} migrations to history table.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error syncing migration history: {ex.Message}");
                // Don't throw - let the normal migration process handle it
            }
        }
    }
}