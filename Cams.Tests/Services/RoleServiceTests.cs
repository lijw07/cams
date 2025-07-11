using Microsoft.EntityFrameworkCore;
using cams.Backend.Services;
using cams.Backend.Model;
using cams.Backend.View;
using Cams.Tests.Builders;
using Cams.Tests.Fixtures;

namespace Cams.Tests.Services;

public class RoleServiceTests : IClassFixture<DatabaseFixture>
{
    private readonly DatabaseFixture _fixture;
    private readonly Mock<ILogger<RoleService>> _loggerMock;

    public RoleServiceTests(DatabaseFixture fixture)
    {
        _fixture = fixture;
        _loggerMock = new Mock<ILogger<RoleService>>();
    }

    [Fact]
    public async Task GetRolesAsync_ReturnsPaginatedRoles()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var roles = new[]
        {
            new Role { Id = Guid.NewGuid(), Name = "Admin", Description = "Administrator role", IsActive = true },
            new Role { Id = Guid.NewGuid(), Name = "User", Description = "Regular user role", IsActive = true },
            new Role { Id = Guid.NewGuid(), Name = "Manager", Description = "Manager role", IsActive = true }
        };

        context.Roles.AddRange(roles);
        await context.SaveChangesAsync();

        var request = new PaginationRequest
        {
            PageNumber = 1,
            PageSize = 2,
            SortBy = "name",
            SortDirection = "asc"
        };

        var service = new RoleService(context, _loggerMock.Object);

        // Act
        var result = await service.GetRolesAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.Pagination.TotalItems.Should().Be(3);
        result.Data.Should().HaveCount(2);
        result.Data.First().Name.Should().Be("Admin");
    }

    [Fact]
    public async Task GetRoleByIdAsync_WhenRoleExists_ReturnsRole()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var role = new Role
        {
            Id = Guid.NewGuid(),
            Name = "TestRole",
            Description = "Test Description",
            IsActive = true
        };

        context.Roles.Add(role);
        await context.SaveChangesAsync();

        var service = new RoleService(context, _loggerMock.Object);

        // Act
        var result = await service.GetRoleByIdAsync(role.Id);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(role.Id);
        result.Name.Should().Be("TestRole");
    }

    [Fact]
    public async Task CreateRoleAsync_CreatesNewRole()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var request = new RoleRequest
        {
            Name = "NewRole",
            Description = "New role description"
        };

        var service = new RoleService(context, _loggerMock.Object);

        // Act
        var result = await service.CreateRoleAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be("NewRole");
        result.Description.Should().Be("New role description");
        result.IsActive.Should().BeTrue();

        var savedRole = await context.Roles.FindAsync(result.Id);
        savedRole.Should().NotBeNull();
    }

    [Fact]
    public async Task CreateRoleAsync_WithDuplicateName_ThrowsException()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var existingRole = new Role
        {
            Id = Guid.NewGuid(),
            Name = "ExistingRole",
            IsActive = true
        };

        context.Roles.Add(existingRole);
        await context.SaveChangesAsync();

        var request = new RoleRequest
        {
            Name = "ExistingRole",
            Description = "Duplicate role"
        };

        var service = new RoleService(context, _loggerMock.Object);

        // Act & Assert
        await service.Invoking(s => s.CreateRoleAsync(request))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("A role with the name 'ExistingRole' already exists.");
    }

    [Fact]
    public async Task UpdateRoleAsync_WhenRoleExists_UpdatesRole()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var role = new Role
        {
            Id = Guid.NewGuid(),
            Name = "OriginalName",
            Description = "Original description",
            IsActive = true
        };

        context.Roles.Add(role);
        await context.SaveChangesAsync();

        var request = new RoleRequest
        {
            Name = "UpdatedName",
            Description = "Updated description"
        };

        var service = new RoleService(context, _loggerMock.Object);

        // Act
        var result = await service.UpdateRoleAsync(role.Id, request);

        // Assert
        result.Should().NotBeNull();
        result!.Name.Should().Be("UpdatedName");
        result.Description.Should().Be("Updated description");
    }

    [Fact]
    public async Task DeleteRoleAsync_WhenRoleExists_DeletesRole()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var role = new Role
        {
            Id = Guid.NewGuid(),
            Name = "RoleToDelete",
            IsActive = true
        };

        context.Roles.Add(role);
        await context.SaveChangesAsync();

        var service = new RoleService(context, _loggerMock.Object);

        // Act
        var result = await service.DeleteRoleAsync(role.Id);

        // Assert
        result.Should().BeTrue();
        var deletedRole = await context.Roles.FindAsync(role.Id);
        deletedRole.Should().BeNull();
    }

    [Fact]
    public async Task AssignRoleToUserAsync_AssignsRoleSuccessfully()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userId = Guid.NewGuid();
        var role = new Role
        {
            Id = Guid.NewGuid(),
            Name = "TestRole",
            IsActive = true
        };

        var user = new UserBuilder()
            .WithId(userId)
            .Build();

        context.Roles.Add(role);
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var service = new RoleService(context, _loggerMock.Object);

        // Act
        await service.AssignRoleToUserAsync(role.Id, userId);

        // Assert
        var userRole = await context.UserRoles
            .FirstOrDefaultAsync(ur => ur.UserId == userId && ur.RoleId == role.Id);
        userRole.Should().NotBeNull();
        userRole!.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task RemoveRoleFromUserAsync_RemovesRoleSuccessfully()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userId = Guid.NewGuid();
        var roleId = Guid.NewGuid();

        var userRole = new UserRole
        {
            UserId = userId,
            RoleId = roleId,
            IsActive = true,
            AssignedAt = DateTime.UtcNow
        };

        context.UserRoles.Add(userRole);
        await context.SaveChangesAsync();

        var service = new RoleService(context, _loggerMock.Object);

        // Act
        await service.RemoveRoleFromUserAsync(roleId, userId);

        // Assert
        var removedUserRole = await context.UserRoles
            .FirstOrDefaultAsync(ur => ur.UserId == userId && ur.RoleId == roleId);
        removedUserRole.Should().BeNull();
    }

    [Fact]
    public async Task UserHasRoleAsync_WhenUserHasActiveRole_ReturnsTrue()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userId = Guid.NewGuid();
        var role = new Role
        {
            Id = Guid.NewGuid(),
            Name = "TestRole",
            IsActive = true
        };

        var userRole = new UserRole
        {
            UserId = userId,
            RoleId = role.Id,
            Role = role,
            IsActive = true,
            AssignedAt = DateTime.UtcNow
        };

        context.Roles.Add(role);
        context.UserRoles.Add(userRole);
        await context.SaveChangesAsync();

        var service = new RoleService(context, _loggerMock.Object);

        // Act
        var result = await service.UserHasRoleAsync(userId, "TestRole");

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task UserHasRoleAsync_WhenUserDoesNotHaveRole_ReturnsFalse()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userId = Guid.NewGuid();
        var service = new RoleService(context, _loggerMock.Object);

        // Act
        var result = await service.UserHasRoleAsync(userId, "NonExistentRole");

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task GetUserRolesAsync_ReturnsUserRoles()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userId = Guid.NewGuid();
        var roles = new[]
        {
            new Role { Id = Guid.NewGuid(), Name = "Role1", IsActive = true },
            new Role { Id = Guid.NewGuid(), Name = "Role2", IsActive = true }
        };

        var userRoles = roles.Select(r => new UserRole
        {
            UserId = userId,
            RoleId = r.Id,
            Role = r,
            IsActive = true,
            AssignedAt = DateTime.UtcNow
        }).ToArray();

        context.Roles.AddRange(roles);
        context.UserRoles.AddRange(userRoles);
        await context.SaveChangesAsync();

        var service = new RoleService(context, _loggerMock.Object);

        // Act
        var result = await service.GetUserRolesAsync(userId);

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain(r => r.RoleName == "Role1");
        result.Should().Contain(r => r.RoleName == "Role2");
    }

    [Fact]
    public async Task ToggleRoleStatusAsync_TogglesStatus()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var role = new Role
        {
            Id = Guid.NewGuid(),
            Name = "TestRole",
            IsActive = true
        };

        context.Roles.Add(role);
        await context.SaveChangesAsync();

        var service = new RoleService(context, _loggerMock.Object);

        // Act
        var result = await service.ToggleRoleStatusAsync(role.Id);

        // Assert
        result.Should().BeTrue();
        var updatedRole = await context.Roles.FindAsync(role.Id);
        updatedRole!.IsActive.Should().BeFalse();
    }
}