using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using cams.Backend.Services;
using cams.Backend.Data;
using cams.Backend.Model;
using cams.Backend.View;
using cams.Backend.Hubs;
using Cams.Tests.Fixtures;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using System.Text.Json;
using Cams.Tests.Builders;

namespace Cams.Tests.Services
{
    public class MigrationServiceTests : IClassFixture<DatabaseFixture>
    {
        private readonly DatabaseFixture _fixture;
        private readonly Mock<ILogger<MigrationService>> _loggerMock;
        private readonly Mock<ILoggingService> _loggingServiceMock;
        private readonly Mock<IHubContext<MigrationHub>> _hubContextMock;
        private readonly Mock<IHubClients> _hubClientsMock;
        private readonly Mock<IClientProxy> _clientProxyMock;

        public MigrationServiceTests(DatabaseFixture fixture)
        {
            _fixture = fixture;
            _loggerMock = new Mock<ILogger<MigrationService>>();
            _loggingServiceMock = new Mock<ILoggingService>();
            _hubContextMock = new Mock<IHubContext<MigrationHub>>();
            _hubClientsMock = new Mock<IHubClients>();
            _clientProxyMock = new Mock<IClientProxy>();

            _hubContextMock.Setup(h => h.Clients).Returns(_hubClientsMock.Object);
            _hubClientsMock.Setup(c => c.Group(It.IsAny<string>())).Returns(_clientProxyMock.Object);
        }

        private MigrationService CreateService(ApplicationDbContext context)
        {
            return new MigrationService(_loggerMock.Object, _loggingServiceMock.Object, _hubContextMock.Object, context);
        }

        #region ValidateBulkImportAsync Tests

        [Fact]
        public async Task ValidateBulkImportAsync_WithValidUsersData_ReturnsValidResult()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var userImportRequest = new BulkUserImportRequest
            {
                Users = new List<UserImportDto>
                {
                    new() { Username = "user1", Email = "user1@test.com", FirstName = "John", LastName = "Doe" },
                    new() { Username = "user2", Email = "user2@test.com", FirstName = "Jane", LastName = "Smith" }
                }
            };

            var request = new BulkMigrationRequest
            {
                MigrationType = "USERS",
                Data = JsonSerializer.Serialize(userImportRequest)
            };

            // Act
            var result = await service.ValidateBulkImportAsync(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeTrue();
            result.TotalRecords.Should().Be(2);
            result.Errors.Should().BeEmpty();
        }

        [Fact]
        public async Task ValidateBulkImportAsync_WithDuplicateUsernames_ReturnsInvalidResult()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var userImportRequest = new BulkUserImportRequest
            {
                Users = new List<UserImportDto>
                {
                    new() { Username = "user1", Email = "user1@test.com" },
                    new() { Username = "user1", Email = "user2@test.com" } // Duplicate username
                }
            };

            var request = new BulkMigrationRequest
            {
                MigrationType = "USERS",
                Data = JsonSerializer.Serialize(userImportRequest)
            };

            // Act
            var result = await service.ValidateBulkImportAsync(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeFalse();
            result.TotalRecords.Should().Be(2);
            result.Errors.Should().Contain("Duplicate username in import data: user1");
        }

        [Fact]
        public async Task ValidateBulkImportAsync_WithExistingUsersInDatabase_ReturnsWarnings()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var existingUser = new UserBuilder().WithUsername("existinguser").WithEmail("existing@test.com").Build();
            context.Users.Add(existingUser);
            await context.SaveChangesAsync();

            var userImportRequest = new BulkUserImportRequest
            {
                Users = new List<UserImportDto>
                {
                    new() { Username = "existinguser", Email = "new@test.com" },
                    new() { Username = "newuser", Email = "existing@test.com" }
                }
            };

            var request = new BulkMigrationRequest
            {
                MigrationType = "USERS",
                Data = JsonSerializer.Serialize(userImportRequest)
            };

            // Act
            var result = await service.ValidateBulkImportAsync(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeTrue(); // Warnings don't make it invalid
            result.Warnings.Should().Contain("Username 'existinguser' already exists in database");
            result.Warnings.Should().Contain("Email 'existing@test.com' already exists in database");
        }

        [Fact]
        public async Task ValidateBulkImportAsync_WithInvalidJson_ReturnsError()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var request = new BulkMigrationRequest
            {
                MigrationType = "USERS",
                Data = "invalid json data"
            };

            // Act
            var result = await service.ValidateBulkImportAsync(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeFalse();
            result.Errors.Should().Contain("Invalid JSON format in migration data");
        }

        [Fact]
        public async Task ValidateBulkImportAsync_WithUnsupportedMigrationType_ReturnsError()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var request = new BulkMigrationRequest
            {
                MigrationType = "UNSUPPORTED",
                Data = "{}"
            };

            // Act
            var result = await service.ValidateBulkImportAsync(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeFalse();
            result.Errors.Should().Contain("Unsupported migration type: UNSUPPORTED");
        }

        [Theory]
        [InlineData("ROLES")]
        [InlineData("APPLICATIONS")]
        public async Task ValidateBulkImportAsync_WithRolesAndApplications_ReturnsValidResult(string migrationType)
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var data = migrationType switch
            {
                "ROLES" => JsonSerializer.Serialize(new BulkRoleImportRequest
                {
                    Roles = new List<RoleImportDto> { new() { Name = "TestRole", Description = "Test Role" } }
                }),
                "APPLICATIONS" => JsonSerializer.Serialize(new BulkApplicationImportRequest
                {
                    Applications = new List<ApplicationImportDto> { new() { Name = "TestApp", Description = "Test App" } }
                }),
                _ => "{}"
            };

            var request = new BulkMigrationRequest
            {
                MigrationType = migrationType,
                Data = data
            };

            // Act
            var result = await service.ValidateBulkImportAsync(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeTrue();
            result.TotalRecords.Should().Be(1);
        }

        #endregion

        #region ProcessBulkMigrationAsync Tests

        [Fact]
        public async Task ProcessBulkMigrationAsync_WithValidateOnlyTrue_ReturnsValidationResult()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var userImportRequest = new BulkUserImportRequest
            {
                Users = new List<UserImportDto>
                {
                    new() { Username = "user1", Email = "user1@test.com" }
                }
            };

            var request = new BulkMigrationRequest
            {
                MigrationType = "USERS",
                Data = JsonSerializer.Serialize(userImportRequest),
                ValidateOnly = true
            };

            var currentUserId = Guid.NewGuid();

            // Act
            var result = await service.ProcessBulkMigrationAsync(request, currentUserId);

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
            result.Message.Should().Be("Validation completed successfully");
            result.TotalRecords.Should().Be(1);
            result.ValidationSummary.Should().Contain("Total records: 1");
        }

        [Fact]
        public async Task ProcessBulkMigrationAsync_WithUsersType_CallsImportUsersAsync()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var userImportRequest = new BulkUserImportRequest
            {
                Users = new List<UserImportDto>
                {
                    new() { Username = "user1", Email = "user1@test.com", Password = "Password123!" }
                }
            };

            var request = new BulkMigrationRequest
            {
                MigrationType = "USERS",
                Data = JsonSerializer.Serialize(userImportRequest),
                ValidateOnly = false
            };

            var currentUserId = Guid.NewGuid();

            // Act
            var result = await service.ProcessBulkMigrationAsync(request, currentUserId);

            // Assert
            result.Should().NotBeNull();
            result.TotalRecords.Should().Be(1);
            result.ProgressId.Should().NotBeNullOrEmpty();
        }

        [Theory]
        [InlineData("ROLES")]
        [InlineData("APPLICATIONS")]
        public async Task ProcessBulkMigrationAsync_WithNotImplementedTypes_ReturnsNotImplementedError(string migrationType)
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var data = migrationType switch
            {
                "ROLES" => JsonSerializer.Serialize(new BulkRoleImportRequest
                {
                    Roles = new List<RoleImportDto> { new() { Name = "TestRole" } }
                }),
                "APPLICATIONS" => JsonSerializer.Serialize(new BulkApplicationImportRequest
                {
                    Applications = new List<ApplicationImportDto> { new() { Name = "TestApp" } }
                }),
                _ => "{}"
            };

            var request = new BulkMigrationRequest
            {
                MigrationType = migrationType,
                Data = data,
                ValidateOnly = false
            };

            var currentUserId = Guid.NewGuid();

            // Act
            var result = await service.ProcessBulkMigrationAsync(request, currentUserId);

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeFalse();
            result.Message.Should().Contain("not implemented");
            result.Errors.Should().Contain($"{migrationType.ToLower().TrimEnd('s').Substring(0, 1).ToUpper()}{migrationType.ToLower().TrimEnd('s').Substring(1)} import functionality not implemented");
        }

        #endregion

        #region ImportUsersAsync Tests

        [Fact]
        public async Task ImportUsersAsync_WithNewUsers_CreatesUsersSuccessfully()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            // Create a default User role for testing
            var userRole = new Role { Name = "User", Description = "Default user role", IsActive = true };
            context.Roles.Add(userRole);
            await context.SaveChangesAsync();

            var request = new BulkUserImportRequest
            {
                Users = new List<UserImportDto>
                {
                    new() { 
                        Username = "newuser1", 
                        Email = "newuser1@test.com", 
                        Password = "Password123!",
                        FirstName = "John",
                        LastName = "Doe"
                    },
                    new() { 
                        Username = "newuser2", 
                        Email = "newuser2@test.com",
                        FirstName = "Jane",
                        LastName = "Smith"
                    }
                }
            };

            var currentUserId = Guid.NewGuid();

            // Act
            var result = await service.ImportUsersAsync(request, currentUserId);

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
            result.TotalRecords.Should().Be(2);
            result.SuccessfulRecords.Should().Be(2);
            result.FailedRecords.Should().Be(0);
            result.Message.Should().Contain("Successfully imported 2 users");

            // Verify users were created in database
            var createdUsers = await context.Users.Where(u => u.Username.StartsWith("newuser")).ToListAsync();
            createdUsers.Should().HaveCount(2);

            // Verify logging service was called
            _loggingServiceMock.Verify(x => x.LogAuditAsync(
                currentUserId,
                "Create",
                "User",
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()), Times.Exactly(2));
        }

        [Fact]
        public async Task ImportUsersAsync_WithExistingUsersAndOverwriteFalse_SkipsExistingUsers()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var existingUser = new UserBuilder()
                .WithUsername("existinguser")
                .WithEmail("existing@test.com")
                .Build();
            context.Users.Add(existingUser);
            await context.SaveChangesAsync();

            var request = new BulkUserImportRequest
            {
                Users = new List<UserImportDto>
                {
                    new() { Username = "existinguser", Email = "existing@test.com" },
                    new() { Username = "newuser", Email = "new@test.com", Password = "Password123!" }
                },
                OverwriteExisting = false
            };

            var currentUserId = Guid.NewGuid();

            // Act
            var result = await service.ImportUsersAsync(request, currentUserId);

            // Assert
            result.Should().NotBeNull();
            result.TotalRecords.Should().Be(2);
            result.SuccessfulRecords.Should().Be(1); // Only the new user
            result.Warnings.Should().Contain("User 'existinguser' already exists and was skipped");
        }

        [Fact]
        public async Task ImportUsersAsync_WithExistingUsersAndOverwriteTrue_UpdatesExistingUsers()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var existingUser = new UserBuilder()
                .WithUsername("existinguser")
                .WithEmail("existing@test.com")
                .WithFirstName("OldFirst")
                .WithLastName("OldLast")
                .Build();
            context.Users.Add(existingUser);
            await context.SaveChangesAsync();

            var request = new BulkUserImportRequest
            {
                Users = new List<UserImportDto>
                {
                    new() { 
                        Username = "existinguser", 
                        Email = "existing@test.com", 
                        FirstName = "NewFirst",
                        LastName = "NewLast",
                        Password = "NewPassword123!"
                    }
                },
                OverwriteExisting = true
            };

            var currentUserId = Guid.NewGuid();

            // Act
            var result = await service.ImportUsersAsync(request, currentUserId);

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
            result.SuccessfulRecords.Should().Be(1);

            // Verify user was updated
            var updatedUser = await context.Users.FirstAsync(u => u.Username == "existinguser");
            updatedUser.FirstName.Should().Be("NewFirst");
            updatedUser.LastName.Should().Be("NewLast");

            // Verify audit log was created for update
            _loggingServiceMock.Verify(x => x.LogAuditAsync(
                currentUserId,
                "Update",
                "User",
                existingUser.Id,
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task ImportUsersAsync_WithUsersHavingRoles_AddsWarningForRoleAssignment()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var request = new BulkUserImportRequest
            {
                Users = new List<UserImportDto>
                {
                    new() { 
                        Username = "userwithroles", 
                        Email = "user@test.com",
                        Password = "Password123!",
                        Roles = new List<string> { "Admin", "Manager" }
                    }
                }
            };

            var currentUserId = Guid.NewGuid();

            // Act
            var result = await service.ImportUsersAsync(request, currentUserId);

            // Assert
            result.Should().NotBeNull();
            result.Warnings.Should().Contain(w => w.Contains("Role assignment not implemented"));
        }

        [Fact]
        public async Task ImportUsersAsync_WithSendWelcomeEmailsTrue_AddsWarningForEmailFunctionality()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var request = new BulkUserImportRequest
            {
                Users = new List<UserImportDto>
                {
                    new() { Username = "testuser", Email = "test@test.com", Password = "Password123!" }
                },
                SendWelcomeEmails = true
            };

            var currentUserId = Guid.NewGuid();

            // Act
            var result = await service.ImportUsersAsync(request, currentUserId);

            // Assert
            result.Should().NotBeNull();
            result.Warnings.Should().Contain(w => w.Contains("Welcome email functionality has been removed"));
        }

        [Fact]
        public async Task ImportUsersAsync_WithProgressTracking_SendsProgressUpdates()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var request = new BulkUserImportRequest
            {
                Users = new List<UserImportDto>
                {
                    new() { Username = "user1", Email = "user1@test.com", Password = "Password123!" },
                    new() { Username = "user2", Email = "user2@test.com", Password = "Password123!" }
                }
            };

            var currentUserId = Guid.NewGuid();
            var progressId = "test-progress-id";

            // Act
            var result = await service.ImportUsersAsync(request, currentUserId, progressId);

            // Assert
            result.Should().NotBeNull();
            result.ProgressId.Should().Be(progressId);

            // Verify progress updates were sent
            _clientProxyMock.Verify(x => x.SendCoreAsync(
                "ProgressUpdate",
                It.IsAny<object[]>(),
                default), Times.AtLeast(2));
        }

        #endregion

        #region ImportRolesAsync Tests

        [Fact]
        public async Task ImportRolesAsync_ReturnsNotImplementedResult()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var request = new BulkRoleImportRequest
            {
                Roles = new List<RoleImportDto>
                {
                    new() { Name = "TestRole", Description = "Test Role" }
                }
            };

            var currentUserId = Guid.NewGuid();
            var progressId = "test-progress-id";

            // Act
            var result = await service.ImportRolesAsync(request, currentUserId, progressId);

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeFalse();
            result.Message.Should().Be("Role import not implemented in this version");
            result.TotalRecords.Should().Be(1);
            result.SuccessfulRecords.Should().Be(0);
            result.FailedRecords.Should().Be(1);
            result.Errors.Should().Contain("Role import functionality not implemented");
            result.ProgressId.Should().Be(progressId);
        }

        #endregion

        #region ImportApplicationsAsync Tests

        [Fact]
        public async Task ImportApplicationsAsync_ReturnsNotImplementedResult()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var request = new BulkApplicationImportRequest
            {
                Applications = new List<ApplicationImportDto>
                {
                    new() { Name = "TestApp", Description = "Test Application" }
                }
            };

            var currentUserId = Guid.NewGuid();
            var progressId = "test-progress-id";

            // Act
            var result = await service.ImportApplicationsAsync(request, currentUserId, progressId);

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeFalse();
            result.Message.Should().Be("Application import not implemented in this version");
            result.TotalRecords.Should().Be(1);
            result.SuccessfulRecords.Should().Be(0);
            result.FailedRecords.Should().Be(1);
            result.Errors.Should().Contain("Application import functionality not implemented");
            result.ProgressId.Should().Be(progressId);
        }

        #endregion

        #region Constructor Tests

        [Fact]
        public void Constructor_WithValidParameters_CreatesInstance()
        {
            // Arrange
            using var context = _fixture.CreateContext();

            // Act
            var service = CreateService(context);

            // Assert
            service.Should().NotBeNull();
            service.Should().BeOfType<MigrationService>();
        }

        [Fact]
        public void Constructor_WithNullLogger_CreatesInstanceWithoutValidation()
        {
            // Arrange
            using var context = _fixture.CreateContext();

            // Act & Assert
            // Primary constructors don't validate null parameters by default
            var service = new MigrationService(null!, _loggingServiceMock.Object, _hubContextMock.Object, context);
            service.Should().NotBeNull();
        }

        [Fact]
        public void Constructor_WithNullLoggingService_CreatesInstanceWithoutValidation()
        {
            // Arrange
            using var context = _fixture.CreateContext();

            // Act & Assert
            // Primary constructors don't validate null parameters by default
            var service = new MigrationService(_loggerMock.Object, null!, _hubContextMock.Object, context);
            service.Should().NotBeNull();
        }

        [Fact]
        public void Constructor_WithNullHubContext_CreatesInstanceWithoutValidation()
        {
            // Arrange
            using var context = _fixture.CreateContext();

            // Act & Assert
            // Primary constructors don't validate null parameters by default
            var service = new MigrationService(_loggerMock.Object, _loggingServiceMock.Object, null!, context);
            service.Should().NotBeNull();
        }

        [Fact]
        public void Constructor_WithNullContext_CreatesInstanceWithoutValidation()
        {
            // Act & Assert
            // Primary constructors don't validate null parameters by default
            var service = new MigrationService(_loggerMock.Object, _loggingServiceMock.Object, _hubContextMock.Object, null!);
            service.Should().NotBeNull();
        }

        #endregion

        #region Error Handling Tests

        [Fact]
        public async Task ImportUsersAsync_WithDatabaseError_HandlesExceptionGracefully()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            // Dispose the context to simulate database error
            await context.DisposeAsync();

            var request = new BulkUserImportRequest
            {
                Users = new List<UserImportDto>
                {
                    new() { Username = "testuser", Email = "test@test.com", Password = "Password123!" }
                }
            };

            var currentUserId = Guid.NewGuid();

            // Act
            var result = await service.ImportUsersAsync(request, currentUserId);

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeFalse();
            result.Message.Should().Contain("errors"); // The actual message is "Completed with X errors..."
            result.Errors.Should().NotBeEmpty();
            result.SuccessfulRecords.Should().Be(0);
            result.FailedRecords.Should().Be(1);
        }

        [Fact]
        public async Task ProcessBulkMigrationAsync_WithException_ReturnsErrorResult()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var request = new BulkMigrationRequest
            {
                MigrationType = "INVALID_TYPE",
                Data = "{}",
                ValidateOnly = false
            };

            var currentUserId = Guid.NewGuid();

            // Act
            var result = await service.ProcessBulkMigrationAsync(request, currentUserId);

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeFalse();
            result.Message.Should().Be("Migration failed with unexpected error");
            result.Errors.Should().NotBeEmpty();
        }

        #endregion

        #region Validation Logic Tests

        [Fact]
        public async Task ValidateBulkImportAsync_WithDuplicateEmailsInImport_ReturnsValidationErrors()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var userImportRequest = new BulkUserImportRequest
            {
                Users = new List<UserImportDto>
                {
                    new() { Username = "user1", Email = "duplicate@test.com" },
                    new() { Username = "user2", Email = "duplicate@test.com" } // Duplicate email
                }
            };

            var request = new BulkMigrationRequest
            {
                MigrationType = "USERS",
                Data = JsonSerializer.Serialize(userImportRequest)
            };

            // Act
            var result = await service.ValidateBulkImportAsync(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeFalse();
            result.Errors.Should().Contain("Duplicate email in import data: duplicate@test.com");
        }

        [Fact]
        public async Task ValidateBulkImportAsync_WithRolesHavingDuplicateNames_ReturnsValidationErrors()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var roleImportRequest = new BulkRoleImportRequest
            {
                Roles = new List<RoleImportDto>
                {
                    new() { Name = "Admin", Description = "Admin Role" },
                    new() { Name = "Admin", Description = "Another Admin Role" } // Duplicate name
                }
            };

            var request = new BulkMigrationRequest
            {
                MigrationType = "ROLES",
                Data = JsonSerializer.Serialize(roleImportRequest)
            };

            // Act
            var result = await service.ValidateBulkImportAsync(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeFalse();
            result.Errors.Should().Contain("Duplicate role name in import data: Admin");
        }

        [Fact]
        public async Task ValidateBulkImportAsync_WithApplicationsHavingDuplicateNames_ReturnsValidationErrors()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var appImportRequest = new BulkApplicationImportRequest
            {
                Applications = new List<ApplicationImportDto>
                {
                    new() { Name = "MyApp", Description = "My Application" },
                    new() { Name = "MyApp", Description = "Another Application" } // Duplicate name
                }
            };

            var request = new BulkMigrationRequest
            {
                MigrationType = "APPLICATIONS",
                Data = JsonSerializer.Serialize(appImportRequest)
            };

            // Act
            var result = await service.ValidateBulkImportAsync(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeFalse();
            result.Errors.Should().Contain("Duplicate application name in import data: MyApp");
        }

        #endregion
    }
}