using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using cams.Backend.Controller;
using cams.Backend.Data;
using cams.Backend.Services;
using cams.Backend.View;
using cams.Backend.Model;
using Cams.Tests.Builders;
using Cams.Tests.Fixtures;
using Microsoft.Extensions.DependencyInjection;

namespace Cams.Tests.Controllers;

public class UsersControllerTests : ControllerTestBase, IClassFixture<DatabaseFixture>
{
    private readonly ApplicationDbContext _context;
    private readonly Mock<IRoleService> _roleServiceMock;
    private readonly Mock<ILogger<UsersController>> _loggerMock;
    private readonly Mock<ILoggingService> _loggingServiceMock;
    private readonly UsersController _controller;

    public UsersControllerTests(DatabaseFixture fixture)
    {
        _context = fixture.CreateContext();
        _roleServiceMock = new Mock<IRoleService>();
        _loggerMock = new Mock<ILogger<UsersController>>();
        _loggingServiceMock = new Mock<ILoggingService>();
        _controller = new UsersController(
            _context,
            _roleServiceMock.Object,
            _loggingServiceMock.Object,
            _loggerMock.Object);
    }
    
    private IServiceProvider CreateServiceProvider()
    {
        var services = new ServiceCollection();
        services.AddSingleton(_roleServiceMock.Object);
        services.AddSingleton(_loggerMock.Object);
        services.AddSingleton(_loggingServiceMock.Object);
        services.AddSingleton<ILogger<cams.Backend.Attributes.RequireRoleAttribute>>(new Mock<ILogger<cams.Backend.Attributes.RequireRoleAttribute>>().Object);
        return services.BuildServiceProvider();
    }
    
    private void SetupDefaultRoleAuthorization(Guid userId, params string[] allowedRoles)
    {
        // Setup default to return false for all roles
        _roleServiceMock
            .Setup(x => x.UserHasRoleAsync(It.IsAny<Guid>(), It.IsAny<string>()))
            .ReturnsAsync(false);
            
        // Then setup specific roles to return true for any user (including the one used by the attribute)
        foreach (var role in allowedRoles)
        {
            _roleServiceMock
                .Setup(x => x.UserHasRoleAsync(It.IsAny<Guid>(), role))
                .ReturnsAsync(true);
        }
    }

    #region GetUsers Tests

    [Fact]
    public async Task GetUsers_WithPlatformAdminRole_ReturnsAllUsers()
    {
        // Arrange
        var userId = Guid.NewGuid();
        
        // Setup role authorization BEFORE creating the controller context
        SetupDefaultRoleAuthorization(userId, "PlatformAdmin");
        
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());

        // Create test users
        var user1 = UserBuilder.Create().WithId(Guid.NewGuid()).WithUsername("user1").Build();
        var user2 = UserBuilder.Create().WithId(Guid.NewGuid()).WithUsername("user2").Build();
        
        _context.Users.AddRange(user1, user2);
        await _context.SaveChangesAsync();

        var request = new PaginationRequest { PageNumber = 1, PageSize = 10 };

        // Act
        var result = await _controller.GetUsers(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var paginatedResult = okResult.Value.Should().BeOfType<PaginatedResponse<UserWithRolesResponse>>().Subject;
        paginatedResult.Data.Should().HaveCount(2);
        paginatedResult.Pagination.TotalItems.Should().Be(2);

        _roleServiceMock.Verify(x => x.UserHasRoleAsync(It.IsAny<Guid>(), "PlatformAdmin"), Times.AtLeastOnce);
    }

    [Fact]
    public async Task GetUsers_WithAdminRole_ReturnsFilteredUsers()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());

        // Create test users with roles
        var user1 = UserBuilder.Create().WithId(Guid.NewGuid()).WithUsername("user1").Build();
        var user2 = UserBuilder.Create().WithId(Guid.NewGuid()).WithUsername("user2").Build();
        var role = RoleBuilder.Create().WithName("User").Build();
        
        _context.Users.AddRange(user1, user2);
        _context.Roles.Add(role);
        _context.UserRoles.Add(new UserRole { UserId = user1.Id, RoleId = role.Id, IsActive = true });
        await _context.SaveChangesAsync();

        var request = new PaginationRequest { PageNumber = 1, PageSize = 10 };

        // Setup role authorization for the RequireRole attribute and controller checks
        // Admin role should return true, PlatformAdmin should return false
        _roleServiceMock
            .Setup(x => x.UserHasRoleAsync(It.IsAny<Guid>(), "PlatformAdmin"))
            .ReturnsAsync(false);
        _roleServiceMock
            .Setup(x => x.UserHasRoleAsync(It.IsAny<Guid>(), "Admin"))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.GetUsers(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var paginatedResult = okResult.Value.Should().BeOfType<PaginatedResponse<UserWithRolesResponse>>().Subject;
        paginatedResult.Data.Should().HaveCount(1); // Only user1 should be returned

        _roleServiceMock.Verify(x => x.UserHasRoleAsync(userId, "Admin"), Times.Once);
    }

    [Fact]
    public async Task GetUsers_WithoutPermission_ReturnsForbid()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());

        var request = new PaginationRequest { PageNumber = 1, PageSize = 10 };

        // Setup role authorization - no roles, should result in Forbid
        SetupDefaultRoleAuthorization(userId);

        // Act
        var result = await _controller.GetUsers(request);

        // Assert
        result.Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public async Task GetUsers_WithSearchTerm_ReturnsFilteredResults()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());

        var user1 = UserBuilder.Create().WithUsername("john.doe").WithEmail("john@example.com").Build();
        var user2 = UserBuilder.Create().WithUsername("jane.smith").WithEmail("jane@example.com").Build();
        
        _context.Users.AddRange(user1, user2);
        await _context.SaveChangesAsync();

        var request = new PaginationRequest { PageNumber = 1, PageSize = 10, SearchTerm = "john" };

        // Setup role authorization for the RequireRole attribute and controller checks
        SetupDefaultRoleAuthorization(userId, "PlatformAdmin");

        // Act
        var result = await _controller.GetUsers(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var paginatedResult = okResult.Value.Should().BeOfType<PaginatedResponse<UserWithRolesResponse>>().Subject;
        paginatedResult.Data.Should().HaveCount(1);
        paginatedResult.Data.First().Username.Should().Be("john.doe");
    }

    [Fact]
    public async Task GetUsers_WhenExceptionThrown_ReturnsInternalServerError()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());

        var request = new PaginationRequest { PageNumber = 1, PageSize = 10 };

        _roleServiceMock
            .Setup(x => x.UserHasRoleAsync(It.IsAny<Guid>(), "PlatformAdmin"))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetUsers(request);

        // Assert
        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetUserById Tests

    [Fact]
    public async Task GetUserById_WithValidId_ReturnsUser()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var targetUserId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());
        
        // Setup role authorization for the RequireRole attribute
        SetupDefaultRoleAuthorization(userId, "PlatformAdmin");

        var user = UserBuilder.Create().WithId(targetUserId).WithUsername("testuser").Build();
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Setup role authorization for the RequireRole attribute and controller checks
        SetupDefaultRoleAuthorization(userId, "PlatformAdmin");

        // Act
        var result = await _controller.GetUserById(targetUserId);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedUser = okResult.Value.Should().BeOfType<UserWithRolesResponse>().Subject;
        returnedUser.Id.Should().Be(targetUserId);
        returnedUser.Username.Should().Be("testuser");
    }

    [Fact]
    public async Task GetUserById_WithInvalidId_ReturnsNotFound()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var targetUserId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());
        
        // Setup role authorization for the RequireRole attribute
        SetupDefaultRoleAuthorization(userId, "PlatformAdmin");

        // Setup role authorization for the RequireRole attribute and controller checks
        SetupDefaultRoleAuthorization(userId, "PlatformAdmin");

        // Act
        var result = await _controller.GetUserById(targetUserId);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task GetUserById_WithoutPermission_ReturnsForbid()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var targetUserId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());
        
        // Setup role authorization for the RequireRole attribute
        SetupDefaultRoleAuthorization(userId, "PlatformAdmin");

        // Setup role authorization - no roles, should result in Forbid
        SetupDefaultRoleAuthorization(userId);

        // Act
        var result = await _controller.GetUserById(targetUserId);

        // Assert
        result.Should().BeOfType<ForbidResult>();
    }

    #endregion

    #region CreateUser Tests

    [Fact]
    public async Task CreateUser_WithValidData_ReturnsOkWithCreatedUser()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());
        
        // Setup role authorization for the RequireRole attribute
        SetupDefaultRoleAuthorization(userId, "PlatformAdmin");

        var request = new CreateUserRequest
        {
            Username = "newuser",
            Email = "newuser@example.com",
            Password = "StrongPassword123!",
            FirstName = "New",
            LastName = "User",
            IsActive = true
        };

        // Act
        var result = await _controller.CreateUser(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().NotBeNull();

        // Verify user was created in database
        var createdUser = await _context.Users.FirstOrDefaultAsync(u => u.Username == "newuser");
        createdUser.Should().NotBeNull();
        createdUser!.Email.Should().Be("newuser@example.com");
        BCrypt.Net.BCrypt.Verify("StrongPassword123!", createdUser.PasswordHash).Should().BeTrue();
    }

    [Fact]
    public async Task CreateUser_WithDuplicateUsername_ReturnsBadRequest()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());
        
        // Setup role authorization for the RequireRole attribute
        SetupDefaultRoleAuthorization(userId, "PlatformAdmin");

        var existingUser = UserBuilder.Create().WithUsername("existinguser").WithEmail("existing@example.com").Build();
        _context.Users.Add(existingUser);
        await _context.SaveChangesAsync();

        var request = new CreateUserRequest
        {
            Username = "existinguser",
            Email = "newemail@example.com",
            Password = "StrongPassword123!"
        };

        // Act
        var result = await _controller.CreateUser(request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task CreateUser_WithDuplicateEmail_ReturnsBadRequest()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());
        
        // Setup role authorization for the RequireRole attribute
        SetupDefaultRoleAuthorization(userId, "PlatformAdmin");

        var existingUser = UserBuilder.Create().WithUsername("existinguser").WithEmail("existing@example.com").Build();
        _context.Users.Add(existingUser);
        await _context.SaveChangesAsync();

        var request = new CreateUserRequest
        {
            Username = "newuser",
            Email = "existing@example.com",
            Password = "StrongPassword123!"
        };

        // Act
        var result = await _controller.CreateUser(request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task CreateUser_WhenExceptionThrown_ReturnsInternalServerError()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());

        // Dispose the context to cause an exception
        await _context.DisposeAsync();

        var request = new CreateUserRequest
        {
            Username = "newuser",
            Email = "newuser@example.com",
            Password = "StrongPassword123!"
        };

        // Act
        var result = await _controller.CreateUser(request);

        // Assert
        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region UpdateUser Tests

    [Fact]
    public async Task UpdateUser_WithValidData_ReturnsOkWithMessage()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var targetUserId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());
        
        // Setup role authorization for the RequireRole attribute
        SetupDefaultRoleAuthorization(userId, "PlatformAdmin");

        var user = UserBuilder.Create().WithId(targetUserId).WithUsername("olduser").WithEmail("old@example.com").Build();
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var request = new UpdateUserRequest
        {
            Username = "updateduser",
            Email = "updated@example.com",
            FirstName = "Updated",
            LastName = "User",
            IsActive = false
        };

        // Act
        var result = await _controller.UpdateUser(targetUserId, request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().NotBeNull();

        // Verify user was updated in database
        var updatedUser = await _context.Users.FindAsync(targetUserId);
        updatedUser.Should().NotBeNull();
        updatedUser!.Username.Should().Be("updateduser");
        updatedUser.Email.Should().Be("updated@example.com");
        updatedUser.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task UpdateUser_WithInvalidModelState_ReturnsBadRequest()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var targetUserId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());
        _controller.ModelState.AddModelError("Username", "Username is required");

        // Mock the role check for RequireRole attribute
        _roleServiceMock
            .Setup(x => x.UserHasRoleAsync(userId, It.IsAny<string>()))
            .ReturnsAsync(true);

        var request = new UpdateUserRequest();

        // Act
        var result = await _controller.UpdateUser(targetUserId, request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task UpdateUser_WithNonexistentUser_ReturnsNotFound()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var targetUserId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());
        
        // Setup role authorization for the RequireRole attribute
        SetupDefaultRoleAuthorization(userId, "PlatformAdmin");

        var request = new UpdateUserRequest
        {
            Username = "updateduser",
            Email = "updated@example.com"
        };

        // Act
        var result = await _controller.UpdateUser(targetUserId, request);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task UpdateUser_WithDuplicateUsername_ReturnsBadRequest()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var targetUserId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());
        
        // Setup role authorization for the RequireRole attribute
        SetupDefaultRoleAuthorization(userId, "PlatformAdmin");

        var user1 = UserBuilder.Create().WithId(targetUserId).WithUsername("user1").WithEmail("user1@example.com").Build();
        var user2 = UserBuilder.Create().WithUsername("user2").WithEmail("user2@example.com").Build();
        _context.Users.AddRange(user1, user2);
        await _context.SaveChangesAsync();

        var request = new UpdateUserRequest
        {
            Username = "user2", // Trying to use existing username
            Email = "updated@example.com"
        };

        // Act
        var result = await _controller.UpdateUser(targetUserId, request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    #endregion

    #region DeleteUser Tests

    [Fact]
    public async Task DeleteUser_WithValidId_ReturnsOkWithMessage()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var targetUserId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());
        
        // Setup role authorization for the RequireRole attribute
        SetupDefaultRoleAuthorization(userId, "PlatformAdmin");

        var user = UserBuilder.Create().WithId(targetUserId).WithUsername("userToDelete").Build();
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Act
        var result = await _controller.DeleteUser(targetUserId);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().NotBeNull();

        // Verify user was deleted from database
        var deletedUser = await _context.Users.FindAsync(targetUserId);
        deletedUser.Should().BeNull();
    }

    [Fact]
    public async Task DeleteUser_WithNonexistentUser_ReturnsNotFound()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var targetUserId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());
        
        // Setup role authorization for the RequireRole attribute
        SetupDefaultRoleAuthorization(userId, "PlatformAdmin");

        // Act
        var result = await _controller.DeleteUser(targetUserId);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task DeleteUser_TryingToDeleteOwnAccount_ReturnsBadRequest()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());

        var user = UserBuilder.Create().WithId(userId).WithUsername("currentuser").Build();
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Act
        var result = await _controller.DeleteUser(userId);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task DeleteUser_WithUserRoles_DeletesUserAndRoles()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var targetUserId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());
        
        // Setup role authorization for the RequireRole attribute
        SetupDefaultRoleAuthorization(userId, "PlatformAdmin");

        var user = UserBuilder.Create().WithId(targetUserId).WithUsername("userToDelete").Build();
        var role = RoleBuilder.Create().WithName("TestRole").Build();
        _context.Users.Add(user);
        _context.Roles.Add(role);
        _context.UserRoles.Add(new UserRole { UserId = targetUserId, RoleId = role.Id, IsActive = true });
        await _context.SaveChangesAsync();

        // Act
        var result = await _controller.DeleteUser(targetUserId);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().NotBeNull();

        // Verify user and user roles were deleted
        var deletedUser = await _context.Users.FindAsync(targetUserId);
        deletedUser.Should().BeNull();

        var userRoles = await _context.UserRoles.Where(ur => ur.UserId == targetUserId).ToListAsync();
        userRoles.Should().BeEmpty();
    }

    #endregion

    #region ToggleUserStatus Tests

    [Fact]
    public async Task ToggleUserStatus_WithValidRequest_ReturnsOkWithMessage()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var targetUserId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());
        
        // Setup role authorization for the RequireRole attribute
        SetupDefaultRoleAuthorization(userId, "PlatformAdmin");

        var user = UserBuilder.Create().WithId(targetUserId).WithActive(true).Build();
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var request = new ToggleUserStatusRequest { IsActive = false };

        // Act
        var result = await _controller.ToggleUserStatus(targetUserId, request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().NotBeNull();

        // Verify user status was toggled
        var updatedUser = await _context.Users.FindAsync(targetUserId);
        updatedUser.Should().NotBeNull();
        updatedUser!.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task ToggleUserStatus_WithNonexistentUser_ReturnsNotFound()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var targetUserId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());
        
        // Setup role authorization for the RequireRole attribute
        SetupDefaultRoleAuthorization(userId, "PlatformAdmin");

        var request = new ToggleUserStatusRequest { IsActive = false };

        // Act
        var result = await _controller.ToggleUserStatus(targetUserId, request);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    #endregion

    #region Role Assignment Tests

    [Fact]
    public async Task AssignRoles_WithValidRequest_ReturnsOkWithMessage()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var targetUserId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());
        
        // Setup role authorization for the RequireRole attribute
        SetupDefaultRoleAuthorization(userId, "PlatformAdmin");

        var user = UserBuilder.Create().WithId(targetUserId).Build();
        var role1 = RoleBuilder.Create().WithName("Role1").Build();
        var role2 = RoleBuilder.Create().WithName("Role2").Build();
        
        _context.Users.Add(user);
        _context.Roles.AddRange(role1, role2);
        await _context.SaveChangesAsync();

        var request = new UserRoleAssignmentRequest
        {
            UserId = targetUserId,
            RoleIds = new List<Guid> { role1.Id, role2.Id }
        };

        // Act
        var result = await _controller.AssignRoles(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().NotBeNull();

        // Verify roles were assigned
        var userRoles = await _context.UserRoles.Where(ur => ur.UserId == targetUserId).ToListAsync();
        userRoles.Should().HaveCount(2);
        userRoles.Should().Contain(ur => ur.RoleId == role1.Id);
        userRoles.Should().Contain(ur => ur.RoleId == role2.Id);
    }

    [Fact]
    public async Task AssignRoles_WithNonexistentUser_ReturnsNotFound()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var targetUserId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());
        
        // Setup role authorization for the RequireRole attribute
        SetupDefaultRoleAuthorization(userId, "PlatformAdmin");

        var request = new UserRoleAssignmentRequest
        {
            UserId = targetUserId,
            RoleIds = new List<Guid> { Guid.NewGuid() }
        };

        // Act
        var result = await _controller.AssignRoles(request);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task AssignRoles_ReplacesExistingRoles_ReturnsOkWithMessage()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var targetUserId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());
        
        // Setup role authorization for the RequireRole attribute
        SetupDefaultRoleAuthorization(userId, "PlatformAdmin");

        var user = UserBuilder.Create().WithId(targetUserId).Build();
        var oldRole = RoleBuilder.Create().WithName("OldRole").Build();
        var newRole = RoleBuilder.Create().WithName("NewRole").Build();
        
        _context.Users.Add(user);
        _context.Roles.AddRange(oldRole, newRole);
        _context.UserRoles.Add(new UserRole { UserId = targetUserId, RoleId = oldRole.Id, IsActive = true });
        await _context.SaveChangesAsync();

        var request = new UserRoleAssignmentRequest
        {
            UserId = targetUserId,
            RoleIds = new List<Guid> { newRole.Id }
        };

        // Act
        var result = await _controller.AssignRoles(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().NotBeNull();

        // Verify old role was removed and new role was assigned
        var userRoles = await _context.UserRoles.Where(ur => ur.UserId == targetUserId).ToListAsync();
        userRoles.Should().HaveCount(1);
        userRoles.First().RoleId.Should().Be(newRole.Id);
    }

    [Fact]
    public async Task RemoveRoles_WithValidRequest_ReturnsOkWithMessage()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var targetUserId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());
        
        // Setup role authorization for the RequireRole attribute
        SetupDefaultRoleAuthorization(userId, "PlatformAdmin");

        var user = UserBuilder.Create().WithId(targetUserId).Build();
        var role1 = RoleBuilder.Create().WithName("Role1").Build();
        var role2 = RoleBuilder.Create().WithName("Role2").Build();
        
        _context.Users.Add(user);
        _context.Roles.AddRange(role1, role2);
        _context.UserRoles.AddRange(
            new UserRole { UserId = targetUserId, RoleId = role1.Id, IsActive = true },
            new UserRole { UserId = targetUserId, RoleId = role2.Id, IsActive = true }
        );
        await _context.SaveChangesAsync();

        var request = new UserRoleAssignmentRequest
        {
            UserId = targetUserId,
            RoleIds = new List<Guid> { role1.Id }
        };

        // Act
        var result = await _controller.RemoveRoles(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().NotBeNull();

        // Verify only role1 was removed
        var userRoles = await _context.UserRoles.Where(ur => ur.UserId == targetUserId).ToListAsync();
        userRoles.Should().HaveCount(1);
        userRoles.First().RoleId.Should().Be(role2.Id);
    }

    #endregion

    #region GetUserStats Tests

    [Fact]
    public async Task GetUserStats_WithValidId_ReturnsOkWithStats()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var targetUserId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());
        
        // Setup role authorization for the RequireRole attribute
        SetupDefaultRoleAuthorization(userId, "PlatformAdmin");

        var user = UserBuilder.Create().WithId(targetUserId).Build();
        _context.Users.Add(user);

        // Add test applications and connections
        var app = ApplicationBuilder.Create().WithUserId(targetUserId).Build();
        var connection = DatabaseConnectionBuilder.Create().WithUserId(targetUserId).Build();
        _context.Applications.Add(app);
        _context.DatabaseConnections.Add(connection);
        await _context.SaveChangesAsync();

        // Act
        var result = await _controller.GetUserStats(targetUserId);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().NotBeNull();
    }

    [Fact]
    public async Task GetUserStats_WithNonexistentUser_ReturnsNotFound()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var targetUserId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());
        
        // Setup role authorization for the RequireRole attribute
        SetupDefaultRoleAuthorization(userId, "PlatformAdmin");

        // Act
        var result = await _controller.GetUserStats(targetUserId);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    #endregion

    #region ResetUserPassword Tests

    [Fact]
    public async Task ResetUserPassword_WithValidRequest_ReturnsOkWithMessage()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var targetUserId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());
        
        // Setup role authorization for the RequireRole attribute
        SetupDefaultRoleAuthorization(userId, "PlatformAdmin");

        var user = UserBuilder.Create().WithId(targetUserId).WithPasswordHash("oldPasswordHash").Build();
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var request = new ResetPasswordRequest { NewPassword = "NewStrongPassword123!" };

        // Act
        var result = await _controller.ResetUserPassword(targetUserId, request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().NotBeNull();

        // Verify password was reset
        var updatedUser = await _context.Users.FindAsync(targetUserId);
        updatedUser.Should().NotBeNull();
        BCrypt.Net.BCrypt.Verify("NewStrongPassword123!", updatedUser!.PasswordHash).Should().BeTrue();
    }

    [Fact]
    public async Task ResetUserPassword_WithNonexistentUser_ReturnsNotFound()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var targetUserId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());
        
        // Setup role authorization for the RequireRole attribute
        SetupDefaultRoleAuthorization(userId, "PlatformAdmin");

        var request = new ResetPasswordRequest { NewPassword = "NewStrongPassword123!" };

        // Act
        var result = await _controller.ResetUserPassword(targetUserId, request);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    #endregion

    #region ForcePasswordChange Tests

    [Fact]
    public async Task ForcePasswordChange_WithValidId_ReturnsOkWithMessage()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var targetUserId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());
        
        // Setup role authorization for the RequireRole attribute
        SetupDefaultRoleAuthorization(userId, "PlatformAdmin");

        var user = UserBuilder.Create().WithId(targetUserId).Build();
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Act
        var result = await _controller.ForcePasswordChange(targetUserId);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().NotBeNull();
    }

    [Fact]
    public async Task ForcePasswordChange_WithNonexistentUser_ReturnsNotFound()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var targetUserId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());
        
        // Setup role authorization for the RequireRole attribute
        SetupDefaultRoleAuthorization(userId, "PlatformAdmin");

        // Act
        var result = await _controller.ForcePasswordChange(targetUserId);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    #endregion

    #region Bulk Operations Tests

    [Fact]
    public async Task BulkToggleStatus_WithValidRequest_ReturnsOkWithResults()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());

        var user1 = UserBuilder.Create().WithActive(true).Build();
        var user2 = UserBuilder.Create().WithActive(true).Build();
        _context.Users.AddRange(user1, user2);
        await _context.SaveChangesAsync();

        var request = new BulkToggleUserStatusRequest
        {
            UserIds = new List<Guid> { user1.Id, user2.Id },
            IsActive = false
        };

        // Act
        var result = await _controller.BulkToggleStatus(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().NotBeNull();

        // Verify users were deactivated
        var updatedUser1 = await _context.Users.FindAsync(user1.Id);
        var updatedUser2 = await _context.Users.FindAsync(user2.Id);
        updatedUser1!.IsActive.Should().BeFalse();
        updatedUser2!.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task BulkToggleStatus_PreventsSelfDeactivation_ReturnsPartialSuccess()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());

        var currentUser = UserBuilder.Create().WithId(userId).WithActive(true).Build();
        var otherUser = UserBuilder.Create().WithActive(true).Build();
        _context.Users.AddRange(currentUser, otherUser);
        await _context.SaveChangesAsync();

        var request = new BulkToggleUserStatusRequest
        {
            UserIds = new List<Guid> { userId, otherUser.Id },
            IsActive = false
        };

        // Act
        var result = await _controller.BulkToggleStatus(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().NotBeNull();

        // Verify current user stayed active, other user was deactivated
        var updatedCurrentUser = await _context.Users.FindAsync(userId);
        var updatedOtherUser = await _context.Users.FindAsync(otherUser.Id);
        updatedCurrentUser!.IsActive.Should().BeTrue(); // Should remain active
        updatedOtherUser!.IsActive.Should().BeFalse();   // Should be deactivated
    }

    [Fact]
    public async Task BulkDelete_WithValidRequest_ReturnsOkWithResults()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());

        var user1 = UserBuilder.Create().Build();
        var user2 = UserBuilder.Create().Build();
        _context.Users.AddRange(user1, user2);
        await _context.SaveChangesAsync();

        var request = new BulkDeleteUsersRequest
        {
            UserIds = new List<Guid> { user1.Id, user2.Id }
        };

        // Act
        var result = await _controller.BulkDelete(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().NotBeNull();

        // Verify users were deactivated (soft delete in this implementation)
        var updatedUser1 = await _context.Users.FindAsync(user1.Id);
        var updatedUser2 = await _context.Users.FindAsync(user2.Id);
        updatedUser1!.IsActive.Should().BeFalse();
        updatedUser2!.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task BulkDelete_PreventsSelfDeletion_ReturnsPartialSuccess()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());

        var currentUser = UserBuilder.Create().WithId(userId).WithActive(true).Build();
        var otherUser = UserBuilder.Create().WithActive(true).Build();
        _context.Users.AddRange(currentUser, otherUser);
        await _context.SaveChangesAsync();

        var request = new BulkDeleteUsersRequest
        {
            UserIds = new List<Guid> { userId, otherUser.Id }
        };

        // Act
        var result = await _controller.BulkDelete(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().NotBeNull();

        // Verify current user stayed active, other user was deactivated
        var updatedCurrentUser = await _context.Users.FindAsync(userId);
        var updatedOtherUser = await _context.Users.FindAsync(otherUser.Id);
        updatedCurrentUser!.IsActive.Should().BeTrue();  // Should remain active
        updatedOtherUser!.IsActive.Should().BeFalse();   // Should be deactivated
    }

    #endregion

    #region SearchUsers Tests

    [Fact]
    public async Task SearchUsers_WithSearchTerm_ReturnsFilteredResults()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());

        var user1 = UserBuilder.Create().WithUsername("john.doe").WithEmail("john@example.com").Build();
        var user2 = UserBuilder.Create().WithUsername("jane.smith").WithEmail("jane@example.com").Build();
        _context.Users.AddRange(user1, user2);
        await _context.SaveChangesAsync();

        // Act
        var result = await _controller.SearchUsers("john");

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var users = okResult.Value.Should().BeAssignableTo<IEnumerable<object>>().Subject;
        users.Should().HaveCount(1);
    }

    [Fact]
    public async Task SearchUsers_WithActiveFilter_ReturnsFilteredResults()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());

        var activeUser = UserBuilder.Create().WithActive(true).Build();
        var inactiveUser = UserBuilder.Create().WithActive(false).Build();
        _context.Users.AddRange(activeUser, inactiveUser);
        await _context.SaveChangesAsync();

        // Act
        var result = await _controller.SearchUsers("", isActive: true);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var users = okResult.Value.Should().BeAssignableTo<IEnumerable<object>>().Subject;
        users.Should().HaveCount(1);
    }

    [Fact]
    public async Task SearchUsers_WhenExceptionThrown_ReturnsInternalServerError()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());

        // Dispose the context to cause an exception
        await _context.DisposeAsync();

        // Act
        var result = await _controller.SearchUsers("test");

        // Assert
        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetUserRoles Tests

    [Fact]
    public async Task GetUserRoles_WithValidId_ReturnsOkWithRoles()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var targetUserId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());
        
        // Setup role authorization for the RequireRole attribute
        SetupDefaultRoleAuthorization(userId, "PlatformAdmin");

        var userRoles = new List<UserRoleResponse>
        {
            new UserRoleResponse { UserId = targetUserId, RoleId = Guid.NewGuid(), RoleName = "Admin" },
            new UserRoleResponse { UserId = targetUserId, RoleId = Guid.NewGuid(), RoleName = "User" }
        };

        _roleServiceMock
            .Setup(x => x.GetUserRolesAsync(targetUserId))
            .ReturnsAsync(userRoles);

        // Act
        var result = await _controller.GetUserRoles(targetUserId);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedRoles = okResult.Value.Should().BeAssignableTo<IEnumerable<UserRoleResponse>>().Subject;
        returnedRoles.Should().HaveCount(2);

        _roleServiceMock.Verify(x => x.GetUserRolesAsync(targetUserId), Times.Once);
    }

    [Fact]
    public async Task GetUserRoles_WhenExceptionThrown_ReturnsInternalServerError()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var targetUserId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());
        
        // Setup role authorization for the RequireRole attribute
        SetupDefaultRoleAuthorization(userId, "PlatformAdmin");

        _roleServiceMock
            .Setup(x => x.GetUserRolesAsync(targetUserId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetUserRoles(targetUserId);

        // Assert
        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region Logging Tests

    [Fact]
    public async Task GetUsers_LogsAuditEvent()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());

        var request = new PaginationRequest { PageNumber = 1, PageSize = 10 };

        // Setup role authorization for the RequireRole attribute and controller checks
        SetupDefaultRoleAuthorization(userId, "PlatformAdmin");

        // Act
        await _controller.GetUsers(request);

        // Assert
        _loggingServiceMock.Verify(
            x => x.LogAuditAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string>()),
            Times.Once);
    }

    [Fact]
    public async Task CreateUser_LogsAuditAndSystemEvents()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());

        var request = new CreateUserRequest
        {
            Username = "newuser",
            Email = "newuser@example.com",
            Password = "StrongPassword123!"
        };

        // Act
        await _controller.CreateUser(request);

        // Assert
        _loggingServiceMock.Verify(
            x => x.LogAuditAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string>()),
            Times.Once);

        _loggingServiceMock.Verify(
            x => x.LogSystemEventAsync(
                It.IsAny<string>(),    // eventType
                It.IsAny<string>(),    // level
                It.IsAny<string>(),    // source
                It.IsAny<string>(),    // message
                It.IsAny<string?>(),   // details
                It.IsAny<string?>(),   // stackTrace
                It.IsAny<string?>(),   // correlationId
                It.IsAny<Guid?>(),     // userId
                It.IsAny<string?>(),   // ipAddress
                It.IsAny<string?>(),   // requestPath
                It.IsAny<string?>(),   // httpMethod
                It.IsAny<int?>(),      // statusCode
                It.IsAny<TimeSpan?>()),// duration
            Times.Once);
    }

    #endregion

    #region Security Tests

    [Fact]
    public async Task CreateUser_WithMaliciousInput_HandlesGracefully()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithServices(userId, CreateServiceProvider());

        var request = new CreateUserRequest
        {
            Username = "<script>alert('xss')</script>",
            Email = "'; DROP TABLE Users; --@example.com",
            Password = "StrongPassword123!",
            FirstName = "<img src=x onerror=alert('xss')>",
            LastName = "'; UPDATE Users SET IsActive=0; --"
        };

        // Act
        var result = await _controller.CreateUser(request);

        // Assert
        // The controller should handle the request normally,
        // with sanitization happening in the logging layer
        result.Should().BeOfType<OkObjectResult>();

        // Verify user was created with the input (unsanitized in the model)
        var createdUser = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
        createdUser.Should().NotBeNull();
        createdUser!.Username.Should().Be(request.Username);
    }

    #endregion
}