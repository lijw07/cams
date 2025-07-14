using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using cams.Backend.Data;
using cams.Backend.Model;
using cams.Backend.Constants;

namespace cams.Backend.Tests.Data
{
    public class DataSeederTests : IDisposable
    {
        private readonly ApplicationDbContext _context;

        public DataSeederTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        [Fact]
        public async Task SeedAsync_Should_Create_Database_And_Seed_All_Data()
        {
            // Act
            await DataSeeder.SeedAsync(_context);

            // Assert - Check roles were seeded
            var roles = await _context.Roles.ToListAsync();
            roles.Should().HaveCount(3);
            roles.Should().Contain(r => r.Name == RoleConstants.PLATFORM_ADMIN);
            roles.Should().Contain(r => r.Name == RoleConstants.ADMIN);
            roles.Should().Contain(r => r.Name == RoleConstants.USER);

            // Assert - Check users were seeded
            var users = await _context.Users.ToListAsync();
            users.Should().HaveCount(4);
            users.Should().Contain(u => u.Username == "platformadmin");
            users.Should().Contain(u => u.Username == "admin");
            users.Should().Contain(u => u.Username == "user");
            users.Should().Contain(u => u.Username == "testuser");

            // Assert - Check user roles were seeded
            var userRoles = await _context.UserRoles.ToListAsync();
            userRoles.Should().HaveCount(4);
        }

        [Fact]
        public async Task SeedAsync_Should_Not_Seed_Roles_If_Already_Exist()
        {
            // Arrange - Add existing role
            var existingRole = new Role
            {
                Name = "ExistingRole",
                Description = "Test role",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Roles.Add(existingRole);
            await _context.SaveChangesAsync();

            // Act
            await DataSeeder.SeedAsync(_context);

            // Assert - Should only have the existing role, no default roles added
            var roles = await _context.Roles.ToListAsync();
            roles.Should().HaveCount(1);
            roles.Should().Contain(r => r.Name == "ExistingRole");
        }

        [Fact]
        public async Task SeedAsync_Should_Not_Seed_Users_If_Already_Exist()
        {
            // Arrange - Add existing user
            var existingUser = new User
            {
                Username = "existinguser",
                Email = "existing@test.com",
                PasswordHash = "hashedpassword",
                FirstName = "Existing",
                LastName = "User",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Users.Add(existingUser);
            await _context.SaveChangesAsync();

            // Act
            await DataSeeder.SeedAsync(_context);

            // Assert - Should only have the existing user, no default users added
            var users = await _context.Users.ToListAsync();
            users.Should().HaveCount(1);
            users.Should().Contain(u => u.Username == "existinguser");
        }

        [Fact]
        public async Task SeedAsync_Should_Not_Seed_UserRoles_If_Already_Exist()
        {
            // Arrange - Seed roles and users first
            await SeedRolesAndUsers();

            // Add existing user role
            var platformAdminRole = await _context.Roles.FirstAsync(r => r.Name == RoleConstants.PLATFORM_ADMIN);
            var platformAdminUser = await _context.Users.FirstAsync(u => u.Username == "platformadmin");
            
            var existingUserRole = new UserRole
            {
                UserId = platformAdminUser.Id,
                RoleId = platformAdminRole.Id,
                AssignedAt = DateTime.UtcNow,
                IsActive = true
            };
            _context.UserRoles.Add(existingUserRole);
            await _context.SaveChangesAsync();

            // Act
            await DataSeeder.SeedAsync(_context);

            // Assert - Should only have the existing user role
            var userRoles = await _context.UserRoles.ToListAsync();
            userRoles.Should().HaveCount(1);
        }

        [Fact]
        public async Task SeedAsync_Should_Handle_Exception_And_Rethrow()
        {
            // Arrange - Dispose context to force an exception
            _context.Dispose();

            // Act & Assert
            var action = async () => await DataSeeder.SeedAsync(_context);
            await action.Should().ThrowAsync<Exception>();
        }

        [Fact]
        public async Task SeedRoles_Should_Create_All_Default_Roles_With_Correct_Properties()
        {
            // Act
            await DataSeeder.SeedAsync(_context);

            // Assert
            var platformAdminRole = await _context.Roles.FirstAsync(r => r.Name == RoleConstants.PLATFORM_ADMIN);
            platformAdminRole.Description.Should().Be(RoleConstants.RoleDescriptions[RoleConstants.PLATFORM_ADMIN]);
            platformAdminRole.IsActive.Should().BeTrue();
            platformAdminRole.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
            platformAdminRole.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));

            var adminRole = await _context.Roles.FirstAsync(r => r.Name == RoleConstants.ADMIN);
            adminRole.Description.Should().Be(RoleConstants.RoleDescriptions[RoleConstants.ADMIN]);
            adminRole.IsActive.Should().BeTrue();

            var userRole = await _context.Roles.FirstAsync(r => r.Name == RoleConstants.USER);
            userRole.Description.Should().Be(RoleConstants.RoleDescriptions[RoleConstants.USER]);
            userRole.IsActive.Should().BeTrue();
        }

        [Fact]
        public async Task SeedUsers_Should_Create_All_Default_Users_With_Correct_Properties()
        {
            // Act
            await DataSeeder.SeedAsync(_context);

            // Assert
            var platformAdminUser = await _context.Users.FirstAsync(u => u.Username == "platformadmin");
            platformAdminUser.Email.Should().Be("platformadmin@cams.local");
            platformAdminUser.FirstName.Should().Be("Platform");
            platformAdminUser.LastName.Should().Be("Administrator");
            platformAdminUser.IsActive.Should().BeTrue();
            platformAdminUser.PasswordHash.Should().NotBeNullOrEmpty();
            BCrypt.Net.BCrypt.Verify("PlatformAdmin123!", platformAdminUser.PasswordHash).Should().BeTrue();

            var adminUser = await _context.Users.FirstAsync(u => u.Username == "admin");
            adminUser.Email.Should().Be("admin@cams.local");
            adminUser.FirstName.Should().Be("System");
            adminUser.LastName.Should().Be("Administrator");
            adminUser.IsActive.Should().BeTrue();
            BCrypt.Net.BCrypt.Verify("Admin123!", adminUser.PasswordHash).Should().BeTrue();

            var regularUser = await _context.Users.FirstAsync(u => u.Username == "user");
            regularUser.Email.Should().Be("user@cams.local");
            regularUser.FirstName.Should().Be("Demo");
            regularUser.LastName.Should().Be("User");
            regularUser.IsActive.Should().BeTrue();
            BCrypt.Net.BCrypt.Verify("User123!", regularUser.PasswordHash).Should().BeTrue();

            var testUser = await _context.Users.FirstAsync(u => u.Username == "testuser");
            testUser.Email.Should().Be("testuser@cams.local");
            testUser.FirstName.Should().Be("Test");
            testUser.LastName.Should().Be("User");
            testUser.IsActive.Should().BeTrue();
            BCrypt.Net.BCrypt.Verify("Password123", testUser.PasswordHash).Should().BeTrue();
        }

        [Fact]
        public async Task SeedUserRoles_Should_Assign_Correct_Roles_To_Users()
        {
            // Act
            await DataSeeder.SeedAsync(_context);

            // Assert
            var platformAdminUser = await _context.Users.FirstAsync(u => u.Username == "platformadmin");
            var adminUser = await _context.Users.FirstAsync(u => u.Username == "admin");
            var regularUser = await _context.Users.FirstAsync(u => u.Username == "user");
            var testUser = await _context.Users.FirstAsync(u => u.Username == "testuser");

            var platformAdminRole = await _context.Roles.FirstAsync(r => r.Name == RoleConstants.PLATFORM_ADMIN);
            var adminRole = await _context.Roles.FirstAsync(r => r.Name == RoleConstants.ADMIN);
            var userRole = await _context.Roles.FirstAsync(r => r.Name == RoleConstants.USER);

            var userRoles = await _context.UserRoles.ToListAsync();

            // Platform admin should have Platform_Admin role
            userRoles.Should().Contain(ur => ur.UserId == platformAdminUser.Id && ur.RoleId == platformAdminRole.Id);

            // Admin should have Admin role
            userRoles.Should().Contain(ur => ur.UserId == adminUser.Id && ur.RoleId == adminRole.Id);

            // Regular user should have User role
            userRoles.Should().Contain(ur => ur.UserId == regularUser.Id && ur.RoleId == userRole.Id);

            // Test user should have User role
            userRoles.Should().Contain(ur => ur.UserId == testUser.Id && ur.RoleId == userRole.Id);
        }

        [Fact]
        public async Task SeedUserRoles_Should_Set_Correct_Properties()
        {
            // Act
            await DataSeeder.SeedAsync(_context);

            // Assert
            var userRoles = await _context.UserRoles.ToListAsync();
            
            foreach (var userRole in userRoles)
            {
                userRole.IsActive.Should().BeTrue();
                userRole.AssignedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
                userRole.AssignedBy.Should().BeNull(); // No assigned by user for seeded data
            }
        }

        [Fact]
        public async Task SeedAsync_Should_Create_Complete_User_Role_Relationships()
        {
            // Act
            await DataSeeder.SeedAsync(_context);

            // Assert - Verify specific user-role relationships
            var platformAdminUser = await _context.Users.FirstAsync(u => u.Username == "platformadmin");
            var adminUser = await _context.Users.FirstAsync(u => u.Username == "admin");
            var regularUser = await _context.Users.FirstAsync(u => u.Username == "user");
            var testUser = await _context.Users.FirstAsync(u => u.Username == "testuser");

            var platformAdminRole = await _context.Roles.FirstAsync(r => r.Name == RoleConstants.PLATFORM_ADMIN);
            var adminRole = await _context.Roles.FirstAsync(r => r.Name == RoleConstants.ADMIN);
            var userRole = await _context.Roles.FirstAsync(r => r.Name == RoleConstants.USER);

            var userRoles = await _context.UserRoles.ToListAsync();

            // Verify each user has exactly one role assigned
            var platformAdminUserRole = userRoles.Single(ur => ur.UserId == platformAdminUser.Id);
            platformAdminUserRole.RoleId.Should().Be(platformAdminRole.Id);
            platformAdminUserRole.IsActive.Should().BeTrue();

            var adminUserRole = userRoles.Single(ur => ur.UserId == adminUser.Id);
            adminUserRole.RoleId.Should().Be(adminRole.Id);
            adminUserRole.IsActive.Should().BeTrue();

            var regularUserRole = userRoles.Single(ur => ur.UserId == regularUser.Id);
            regularUserRole.RoleId.Should().Be(userRole.Id);
            regularUserRole.IsActive.Should().BeTrue();

            var testUserRole = userRoles.Single(ur => ur.UserId == testUser.Id);
            testUserRole.RoleId.Should().Be(userRole.Id);
            testUserRole.IsActive.Should().BeTrue();
        }

        [Fact]
        public async Task SeedAsync_Should_Handle_Incremental_Seeding()
        {
            // Arrange - First seed only roles
            await SeedRolesOnly();

            // Act - Run full seeding
            await DataSeeder.SeedAsync(_context);

            // Assert - Should add users and user roles to existing roles
            var roles = await _context.Roles.ToListAsync();
            var users = await _context.Users.ToListAsync();
            var userRoles = await _context.UserRoles.ToListAsync();

            roles.Should().HaveCount(3); // No duplicate roles
            users.Should().HaveCount(4); // Users were added
            userRoles.Should().HaveCount(4); // User roles were added
        }

        [Fact]
        public async Task SeedAsync_Should_Handle_Multiple_Calls_Gracefully()
        {
            // Act - Call seed multiple times
            await DataSeeder.SeedAsync(_context);
            await DataSeeder.SeedAsync(_context);
            await DataSeeder.SeedAsync(_context);

            // Assert - Should still only have seeded data once
            var roles = await _context.Roles.ToListAsync();
            var users = await _context.Users.ToListAsync();
            var userRoles = await _context.UserRoles.ToListAsync();

            roles.Should().HaveCount(3);
            users.Should().HaveCount(4);
            userRoles.Should().HaveCount(4);
        }

        [Fact]
        public async Task SeedAsync_Should_Maintain_Data_Integrity()
        {
            // Act
            await DataSeeder.SeedAsync(_context);

            // Assert - Check that all user roles reference valid users and roles
            var userRoles = await _context.UserRoles
                .Include(ur => ur.User)
                .Include(ur => ur.Role)
                .ToListAsync();

            foreach (var userRole in userRoles)
            {
                userRole.User.Should().NotBeNull();
                userRole.Role.Should().NotBeNull();
                userRole.User.IsActive.Should().BeTrue();
                userRole.Role.IsActive.Should().BeTrue();
            }
        }

        [Fact]
        public async Task SeedAsync_Should_Create_Unique_Guids_For_All_Entities()
        {
            // Act
            await DataSeeder.SeedAsync(_context);

            // Assert
            var roleIds = await _context.Roles.Select(r => r.Id).ToListAsync();
            var userIds = await _context.Users.Select(u => u.Id).ToListAsync();
            var userRoleIds = await _context.UserRoles.Select(ur => ur.Id).ToListAsync();

            // All IDs should be unique
            roleIds.Should().OnlyHaveUniqueItems();
            userIds.Should().OnlyHaveUniqueItems();
            userRoleIds.Should().OnlyHaveUniqueItems();

            // No ID should be empty GUID
            roleIds.Should().NotContain(Guid.Empty);
            userIds.Should().NotContain(Guid.Empty);
            userRoleIds.Should().NotContain(Guid.Empty);
        }

        [Fact]
        public async Task SeedAsync_Should_Set_Timestamps_Correctly()
        {
            // Arrange
            var beforeSeed = DateTime.UtcNow;

            // Act
            await DataSeeder.SeedAsync(_context);
            var afterSeed = DateTime.UtcNow;

            // Assert
            var roles = await _context.Roles.ToListAsync();
            var users = await _context.Users.ToListAsync();
            var userRoles = await _context.UserRoles.ToListAsync();

            foreach (var role in roles)
            {
                role.CreatedAt.Should().BeOnOrAfter(beforeSeed);
                role.CreatedAt.Should().BeOnOrBefore(afterSeed);
                role.UpdatedAt.Should().BeOnOrAfter(beforeSeed);
                role.UpdatedAt.Should().BeOnOrBefore(afterSeed);
            }

            foreach (var user in users)
            {
                user.CreatedAt.Should().BeOnOrAfter(beforeSeed);
                user.CreatedAt.Should().BeOnOrBefore(afterSeed);
                user.UpdatedAt.Should().BeOnOrAfter(beforeSeed);
                user.UpdatedAt.Should().BeOnOrBefore(afterSeed);
            }

            foreach (var userRole in userRoles)
            {
                userRole.AssignedAt.Should().BeOnOrAfter(beforeSeed);
                userRole.AssignedAt.Should().BeOnOrBefore(afterSeed);
            }
        }

        [Theory]
        [InlineData("platformadmin", "PlatformAdmin123!")]
        [InlineData("admin", "Admin123!")]
        [InlineData("user", "User123!")]
        [InlineData("testuser", "Password123")]
        public async Task SeedAsync_Should_Hash_Passwords_Correctly(string username, string password)
        {
            // Act
            await DataSeeder.SeedAsync(_context);

            // Assert
            var user = await _context.Users.FirstAsync(u => u.Username == username);
            user.PasswordHash.Should().NotBe(password); // Should be hashed, not plain text
            user.PasswordHash.Should().NotBeNullOrEmpty();
            
            // Verify the hash is correct
            BCrypt.Net.BCrypt.Verify(password, user.PasswordHash).Should().BeTrue();
        }

        private async Task SeedRolesAndUsers()
        {
            // Seed roles
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
            await _context.Roles.AddRangeAsync(roles);

            // Seed users
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
                }
            };
            await _context.Users.AddRangeAsync(users);
            await _context.SaveChangesAsync();
        }

        private async Task SeedRolesOnly(ApplicationDbContext? context = null)
        {
            var ctx = context ?? _context;
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
            await ctx.Roles.AddRangeAsync(roles);
            await ctx.SaveChangesAsync();
        }

        private async Task SeedUsersOnly(ApplicationDbContext? context = null)
        {
            var ctx = context ?? _context;
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
                }
            };
            await ctx.Users.AddRangeAsync(users);
            await ctx.SaveChangesAsync();
        }
    }
}