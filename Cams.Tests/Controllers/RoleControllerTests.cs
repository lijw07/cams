using Microsoft.AspNetCore.Mvc;
using cams.Backend.Controller;
using cams.Backend.Services;
using cams.Backend.View;
using Cams.Tests.Builders;

namespace Cams.Tests.Controllers;

public class RoleControllerTests : ControllerTestBase
{
    private readonly Mock<IRoleService> _roleServiceMock;
    private readonly Mock<ILogger<RoleController>> _loggerMock;
    private readonly Mock<ILoggingService> _loggingServiceMock;
    private readonly RoleController _controller;

    public RoleControllerTests()
    {
        _roleServiceMock = new Mock<IRoleService>();
        _loggerMock = new Mock<ILogger<RoleController>>();
        _loggingServiceMock = new Mock<ILoggingService>();
        _controller = new RoleController(
            _roleServiceMock.Object,
            _loggingServiceMock.Object,
            _loggerMock.Object);
    }

    #region GetRoles Tests

    [Fact]
    public async Task GetRoles_WithValidRequest_ReturnsOkWithPaginatedRoles()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var request = new PaginationRequest { PageNumber = 1, PageSize = 10 };
        var roles = new List<RoleResponse>
        {
            new RoleResponse { Id = Guid.NewGuid(), Name = "Admin", Description = "Administrator role" },
            new RoleResponse { Id = Guid.NewGuid(), Name = "User", Description = "Regular user role" }
        };

        var paginatedResult = new PaginatedResponse<RoleResponse>
        {
            Data = roles,
            Pagination = new PaginationMetadata
            {
                CurrentPage = 1,
                PerPage = 10,
                TotalItems = 2,
                TotalPages = 1
            }
        };

        _roleServiceMock
            .Setup(x => x.GetRolesAsync(request))
            .ReturnsAsync(paginatedResult);

        // Act
        var result = await _controller.GetRoles(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedResult = okResult.Value.Should().BeOfType<PaginatedResponse<RoleResponse>>().Subject;
        returnedResult.Data.Should().HaveCount(2);
        returnedResult.Pagination.TotalItems.Should().Be(2);

        _roleServiceMock.Verify(x => x.GetRolesAsync(request), Times.Once);
    }

    [Fact]
    public async Task GetRoles_WhenExceptionThrown_ReturnsInternalServerError()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var request = new PaginationRequest { PageNumber = 1, PageSize = 10 };

        _roleServiceMock
            .Setup(x => x.GetRolesAsync(request))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetRoles(request);

        // Assert
        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetAllRoles Tests

    [Fact]
    public async Task GetAllRoles_ReturnsOkWithAllRoles()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var roles = new List<RoleResponse>
        {
            new RoleResponse { Id = Guid.NewGuid(), Name = "Admin", Description = "Administrator role" },
            new RoleResponse { Id = Guid.NewGuid(), Name = "User", Description = "Regular user role" },
            new RoleResponse { Id = Guid.NewGuid(), Name = "Manager", Description = "Manager role" }
        };

        _roleServiceMock
            .Setup(x => x.GetAllRolesAsync())
            .ReturnsAsync(roles);

        // Act
        var result = await _controller.GetAllRoles();

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedRoles = okResult.Value.Should().BeAssignableTo<IEnumerable<RoleResponse>>().Subject;
        returnedRoles.Should().HaveCount(3);

        _roleServiceMock.Verify(x => x.GetAllRolesAsync(), Times.Once);
    }

    [Fact]
    public async Task GetAllRoles_WhenExceptionThrown_ReturnsInternalServerError()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        _roleServiceMock
            .Setup(x => x.GetAllRolesAsync())
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetAllRoles();

        // Assert
        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetRoleById Tests

    [Fact]
    public async Task GetRoleById_WithValidId_ReturnsOkWithRole()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var roleId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var role = new RoleResponse 
        { 
            Id = roleId, 
            Name = "Admin", 
            Description = "Administrator role",
            IsActive = true
        };

        _roleServiceMock
            .Setup(x => x.GetRoleByIdAsync(roleId))
            .ReturnsAsync(role);

        // Act
        var result = await _controller.GetRoleById(roleId);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedRole = okResult.Value.Should().BeOfType<RoleResponse>().Subject;
        returnedRole.Id.Should().Be(roleId);
        returnedRole.Name.Should().Be("Admin");

        _roleServiceMock.Verify(x => x.GetRoleByIdAsync(roleId), Times.Once);
    }

    [Fact]
    public async Task GetRoleById_WhenRoleNotFound_ReturnsNotFound()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var roleId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        _roleServiceMock
            .Setup(x => x.GetRoleByIdAsync(roleId))
            .ReturnsAsync((RoleResponse?)null);

        // Act
        var result = await _controller.GetRoleById(roleId);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task GetRoleById_WhenExceptionThrown_ReturnsInternalServerError()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var roleId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        _roleServiceMock
            .Setup(x => x.GetRoleByIdAsync(roleId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetRoleById(roleId);

        // Assert
        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region CreateRole Tests

    [Fact]
    public async Task CreateRole_WithValidData_ReturnsCreatedAtAction()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var request = new RoleRequest
        {
            Name = "New Role",
            Description = "A new role for testing",
            IsActive = true
        };

        var createdRole = new RoleResponse
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description,
            IsActive = request.IsActive
        };

        _roleServiceMock
            .Setup(x => x.CreateRoleAsync(request))
            .ReturnsAsync(createdRole);

        // Act
        var result = await _controller.CreateRole(request);

        // Assert
        var createdResult = result.Should().BeOfType<CreatedAtActionResult>().Subject;
        createdResult.ActionName.Should().Be("GetRoleById");
        createdResult.RouteValues!["id"].Should().Be(createdRole.Id);

        var returnedRole = createdResult.Value.Should().BeOfType<RoleResponse>().Subject;
        returnedRole.Name.Should().Be(request.Name);

        _roleServiceMock.Verify(x => x.CreateRoleAsync(request), Times.Once);
    }

    [Fact]
    public async Task CreateRole_WithInvalidModelState_ReturnsBadRequest()
    {
        // Arrange
        _controller.ModelState.AddModelError("Name", "Name is required");
        var request = new RoleRequest();

        // Act
        var result = await _controller.CreateRole(request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
        _roleServiceMock.Verify(x => x.CreateRoleAsync(It.IsAny<RoleRequest>()), Times.Never);
    }

    [Fact]
    public async Task CreateRole_WhenServiceThrowsInvalidOperationException_ReturnsBadRequest()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var request = new RoleRequest
        {
            Name = "Duplicate Role",
            Description = "This role already exists"
        };

        _roleServiceMock
            .Setup(x => x.CreateRoleAsync(request))
            .ThrowsAsync(new InvalidOperationException("Role name already exists"));

        // Act
        var result = await _controller.CreateRole(request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task CreateRole_WhenServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var request = new RoleRequest
        {
            Name = "New Role",
            Description = "A new role for testing"
        };

        _roleServiceMock
            .Setup(x => x.CreateRoleAsync(request))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.CreateRole(request);

        // Assert
        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region UpdateRole Tests

    [Fact]
    public async Task UpdateRole_WithValidData_ReturnsOkWithUpdatedRole()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var roleId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var request = new RoleRequest
        {
            Name = "Updated Role",
            Description = "Updated description",
            IsActive = false
        };

        var updatedRole = new RoleResponse
        {
            Id = roleId,
            Name = request.Name,
            Description = request.Description,
            IsActive = request.IsActive
        };

        _roleServiceMock
            .Setup(x => x.UpdateRoleAsync(roleId, request))
            .ReturnsAsync(updatedRole);

        // Act
        var result = await _controller.UpdateRole(roleId, request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedRole = okResult.Value.Should().BeOfType<RoleResponse>().Subject;
        returnedRole.Name.Should().Be(request.Name);
        returnedRole.Description.Should().Be(request.Description);

        _roleServiceMock.Verify(x => x.UpdateRoleAsync(roleId, request), Times.Once);
    }

    [Fact]
    public async Task UpdateRole_WithInvalidModelState_ReturnsBadRequest()
    {
        // Arrange
        var roleId = Guid.NewGuid();
        _controller.ModelState.AddModelError("Name", "Name is required");
        var request = new RoleRequest();

        // Act
        var result = await _controller.UpdateRole(roleId, request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
        _roleServiceMock.Verify(x => x.UpdateRoleAsync(It.IsAny<Guid>(), It.IsAny<RoleRequest>()), Times.Never);
    }

    [Fact]
    public async Task UpdateRole_WhenRoleNotFound_ReturnsNotFound()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var roleId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var request = new RoleRequest
        {
            Name = "Updated Role",
            Description = "Updated description"
        };

        _roleServiceMock
            .Setup(x => x.UpdateRoleAsync(roleId, request))
            .ReturnsAsync((RoleResponse?)null);

        // Act
        var result = await _controller.UpdateRole(roleId, request);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task UpdateRole_WhenServiceThrowsInvalidOperationException_ReturnsBadRequest()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var roleId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var request = new RoleRequest
        {
            Name = "Duplicate Role",
            Description = "This role name is taken"
        };

        _roleServiceMock
            .Setup(x => x.UpdateRoleAsync(roleId, request))
            .ThrowsAsync(new InvalidOperationException("Role name already exists"));

        // Act
        var result = await _controller.UpdateRole(roleId, request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    #endregion

    #region ToggleRoleStatus Tests

    [Fact]
    public async Task ToggleRoleStatus_WithValidId_ReturnsOkWithMessage()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var roleId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        _roleServiceMock
            .Setup(x => x.ToggleRoleStatusAsync(roleId))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.ToggleRoleStatus(roleId);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().NotBeNull();

        _roleServiceMock.Verify(x => x.ToggleRoleStatusAsync(roleId), Times.Once);
    }

    [Fact]
    public async Task ToggleRoleStatus_WhenRoleNotFound_ReturnsNotFound()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var roleId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        _roleServiceMock
            .Setup(x => x.ToggleRoleStatusAsync(roleId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.ToggleRoleStatus(roleId);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task ToggleRoleStatus_WhenExceptionThrown_ReturnsInternalServerError()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var roleId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        _roleServiceMock
            .Setup(x => x.ToggleRoleStatusAsync(roleId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.ToggleRoleStatus(roleId);

        // Assert
        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region DeleteRole Tests

    [Fact]
    public async Task DeleteRole_WithValidId_ReturnsOkWithMessage()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var roleId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        _roleServiceMock
            .Setup(x => x.DeleteRoleAsync(roleId))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.DeleteRole(roleId);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().NotBeNull();

        _roleServiceMock.Verify(x => x.DeleteRoleAsync(roleId), Times.Once);
    }

    [Fact]
    public async Task DeleteRole_WhenRoleNotFound_ReturnsNotFound()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var roleId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        _roleServiceMock
            .Setup(x => x.DeleteRoleAsync(roleId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.DeleteRole(roleId);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task DeleteRole_WhenServiceThrowsInvalidOperationException_ReturnsBadRequest()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var roleId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        _roleServiceMock
            .Setup(x => x.DeleteRoleAsync(roleId))
            .ThrowsAsync(new InvalidOperationException("Cannot delete role with assigned users"));

        // Act
        var result = await _controller.DeleteRole(roleId);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    #endregion

    #region Role Assignment Tests

    [Fact]
    public async Task AssignRoleToUser_WithValidIds_ReturnsOkWithMessage()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var roleId = Guid.NewGuid();
        var targetUserId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        _roleServiceMock
            .Setup(x => x.AssignRoleToUserAsync(targetUserId, roleId, userId))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.AssignRoleToUser(roleId, targetUserId);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().NotBeNull();

        _roleServiceMock.Verify(x => x.AssignRoleToUserAsync(targetUserId, roleId, userId), Times.Once);
    }

    [Fact]
    public async Task AssignRoleToUser_WhenAssignmentFails_ReturnsBadRequest()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var roleId = Guid.NewGuid();
        var targetUserId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        _roleServiceMock
            .Setup(x => x.AssignRoleToUserAsync(targetUserId, roleId, userId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.AssignRoleToUser(roleId, targetUserId);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task RemoveRoleFromUser_WithValidIds_ReturnsOkWithMessage()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var roleId = Guid.NewGuid();
        var targetUserId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        _roleServiceMock
            .Setup(x => x.RemoveRoleFromUserAsync(targetUserId, roleId))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.RemoveRoleFromUser(roleId, targetUserId);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().NotBeNull();

        _roleServiceMock.Verify(x => x.RemoveRoleFromUserAsync(targetUserId, roleId), Times.Once);
    }

    [Fact]
    public async Task RemoveRoleFromUser_WhenRemovalFails_ReturnsNotFound()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var roleId = Guid.NewGuid();
        var targetUserId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        _roleServiceMock
            .Setup(x => x.RemoveRoleFromUserAsync(targetUserId, roleId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.RemoveRoleFromUser(roleId, targetUserId);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    #endregion

    #region GetUserRoles Tests

    [Fact]
    public async Task GetUserRoles_WithValidUserId_ReturnsOkWithUserRoles()
    {
        // Arrange
        var currentUserId = Guid.NewGuid();
        var targetUserId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(currentUserId);

        var userRoles = new List<UserRoleResponse>
        {
            new UserRoleResponse { RoleId = Guid.NewGuid(), RoleName = "Admin", UserId = targetUserId },
            new UserRoleResponse { RoleId = Guid.NewGuid(), RoleName = "User", UserId = targetUserId }
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
        var currentUserId = Guid.NewGuid();
        var targetUserId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(currentUserId);

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

    #region Additional Role Methods Tests

    [Fact]
    public async Task CheckRoleNameAvailability_WithAvailableName_ReturnsOkWithTrue()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var roleName = "NewRole";

        _roleServiceMock
            .Setup(x => x.CheckRoleNameAvailabilityAsync(roleName, null))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.CheckRoleNameAvailability(roleName);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().NotBeNull();

        _roleServiceMock.Verify(x => x.CheckRoleNameAvailabilityAsync(roleName, null), Times.Once);
    }

    [Fact]
    public async Task GetSystemRoles_ReturnsOkWithSystemRoles()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var systemRoles = new List<RoleResponse>
        {
            new RoleResponse { Id = Guid.NewGuid(), Name = "System Admin", Description = "System administrator" },
            new RoleResponse { Id = Guid.NewGuid(), Name = "Platform Admin", Description = "Platform administrator" }
        };

        _roleServiceMock
            .Setup(x => x.GetSystemRolesAsync())
            .ReturnsAsync(systemRoles);

        // Act
        var result = await _controller.GetSystemRoles();

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedRoles = okResult.Value.Should().BeAssignableTo<IEnumerable<RoleResponse>>().Subject;
        returnedRoles.Should().HaveCount(2);

        _roleServiceMock.Verify(x => x.GetSystemRolesAsync(), Times.Once);
    }

    [Fact]
    public async Task BulkDeleteRoles_WithValidRequest_ReturnsOkWithResult()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var roleIds = new List<Guid> { Guid.NewGuid(), Guid.NewGuid() };
        var request = new BulkDeleteRolesRequest { RoleIds = roleIds };

        var bulkResult = new BulkDeleteRoleResult
        {
            SuccessfulCount = 2,
            FailedCount = 0,
            Failed = new List<BulkDeleteRoleError>(),
            Successful = new List<Guid> { roleIds[0], roleIds[1] }
        };

        _roleServiceMock
            .Setup(x => x.BulkDeleteRolesAsync(roleIds, userId))
            .ReturnsAsync(bulkResult);

        // Act
        var result = await _controller.BulkDeleteRoles(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedResult = okResult.Value.Should().BeOfType<BulkDeleteRoleResult>().Subject;
        returnedResult.SuccessfulCount.Should().Be(2);
        returnedResult.FailedCount.Should().Be(0);

        _roleServiceMock.Verify(x => x.BulkDeleteRolesAsync(roleIds, userId), Times.Once);
    }

    [Fact]
    public async Task GetRoleHierarchy_ReturnsOkWithHierarchy()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var hierarchy = new RoleHierarchyResponse
        {
            Roles = new List<RoleHierarchyNode>(),
            TotalRoles = 2,
            MaxDepth = 2
        };

        _roleServiceMock
            .Setup(x => x.GetRoleHierarchyAsync())
            .ReturnsAsync(hierarchy);

        // Act
        var result = await _controller.GetRoleHierarchy();

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedHierarchy = okResult.Value.Should().BeOfType<RoleHierarchyResponse>().Subject;
        returnedHierarchy.TotalRoles.Should().Be(2);

        _roleServiceMock.Verify(x => x.GetRoleHierarchyAsync(), Times.Once);
    }

    [Fact]
    public async Task GetRoleStats_WithValidId_ReturnsOkWithStats()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var roleId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var stats = new RoleStatsResponse
        {
            Id = roleId,
            Name = "Test Role",
            TotalUsers = 10,
            ActiveUsers = 8,
            RecentAssignments = 2
        };

        _roleServiceMock
            .Setup(x => x.GetRoleStatsAsync(roleId))
            .ReturnsAsync(stats);

        // Act
        var result = await _controller.GetRoleStats(roleId);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedStats = okResult.Value.Should().BeOfType<RoleStatsResponse>().Subject;
        returnedStats.TotalUsers.Should().Be(10);

        _roleServiceMock.Verify(x => x.GetRoleStatsAsync(roleId), Times.Once);
    }

    [Fact]
    public async Task GetRoleStats_WhenRoleNotFound_ReturnsNotFound()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var roleId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        _roleServiceMock
            .Setup(x => x.GetRoleStatsAsync(roleId))
            .ThrowsAsync(new ArgumentException("Role not found"));

        // Act
        var result = await _controller.GetRoleStats(roleId);

        // Assert
        var notFoundResult = result.Should().BeOfType<NotFoundObjectResult>().Subject;
        notFoundResult.StatusCode.Should().Be(404);
        notFoundResult.Value.Should().NotBeNull();
        
        // The value should contain a message property with "Role not found"
        var valueType = notFoundResult.Value?.GetType();
        valueType.Should().NotBeNull();
        var messageProperty = valueType!.GetProperty("message");
        messageProperty.Should().NotBeNull();
        var message = messageProperty!.GetValue(notFoundResult.Value) as string;
        message.Should().Be("Role not found");
    }

    #endregion

    #region Bulk User Assignment Tests

    [Fact]
    public async Task AssignUsersToRole_WithValidRequest_ReturnsOkWithMessage()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var roleId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var userIds = new List<Guid> { Guid.NewGuid(), Guid.NewGuid() };
        var request = new AssignUsersToRoleRequest { UserIds = userIds };

        _roleServiceMock
            .Setup(x => x.AssignUsersToRoleAsync(roleId, userIds, userId))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.AssignUsersToRole(roleId, request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().NotBeNull();

        _roleServiceMock.Verify(x => x.AssignUsersToRoleAsync(roleId, userIds, userId), Times.Once);
    }

    [Fact]
    public async Task AssignUsersToRole_WhenAssignmentFails_ReturnsBadRequest()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var roleId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var userIds = new List<Guid> { Guid.NewGuid(), Guid.NewGuid() };
        var request = new AssignUsersToRoleRequest { UserIds = userIds };

        _roleServiceMock
            .Setup(x => x.AssignUsersToRoleAsync(roleId, userIds, userId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.AssignUsersToRole(roleId, request);

        // Assert
        var badRequestResult = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        badRequestResult.StatusCode.Should().Be(400);
        badRequestResult.Value.Should().NotBeNull();
        
        // The value should contain a message property with "Failed to assign users to role"
        var valueType = badRequestResult.Value?.GetType();
        valueType.Should().NotBeNull();
        var messageProperty = valueType!.GetProperty("message");
        messageProperty.Should().NotBeNull();
        var message = messageProperty!.GetValue(badRequestResult.Value) as string;
        message.Should().Be("Failed to assign users to role");
    }

    [Fact]
    public async Task RemoveUsersFromRole_WithValidRequest_ReturnsOkWithMessage()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var roleId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var userIds = new List<Guid> { Guid.NewGuid(), Guid.NewGuid() };
        var request = new RemoveUsersFromRoleRequest { UserIds = userIds };

        _roleServiceMock
            .Setup(x => x.RemoveUsersFromRoleAsync(roleId, userIds))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.RemoveUsersFromRole(roleId, request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().NotBeNull();

        _roleServiceMock.Verify(x => x.RemoveUsersFromRoleAsync(roleId, userIds), Times.Once);
    }

    [Fact]
    public async Task GetRoleUsers_WithValidId_ReturnsOkWithUsers()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var roleId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var users = new List<UserRoleInfo>
        {
            new UserRoleInfo { UserId = Guid.NewGuid(), Username = "user1", Email = "user1@example.com" },
            new UserRoleInfo { UserId = Guid.NewGuid(), Username = "user2", Email = "user2@example.com" }
        };

        _roleServiceMock
            .Setup(x => x.GetRoleUsersAsync(roleId))
            .ReturnsAsync(users);

        // Act
        var result = await _controller.GetRoleUsers(roleId);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedUsers = okResult.Value.Should().BeAssignableTo<IEnumerable<UserRoleInfo>>().Subject;
        returnedUsers.Should().HaveCount(2);

        _roleServiceMock.Verify(x => x.GetRoleUsersAsync(roleId), Times.Once);
    }

    #endregion

    #region Logging Tests

    [Fact]
    public async Task GetRoles_LogsAuditEvent()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var request = new PaginationRequest { PageNumber = 1, PageSize = 10 };
        var paginatedResult = new PaginatedResponse<RoleResponse>
        {
            Data = new List<RoleResponse>(),
            Pagination = new PaginationMetadata { TotalItems = 0 }
        };

        _roleServiceMock
            .Setup(x => x.GetRolesAsync(request))
            .ReturnsAsync(paginatedResult);

        // Act
        await _controller.GetRoles(request);

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
    public async Task CreateRole_LogsAuditEvent()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var request = new RoleRequest
        {
            Name = "New Role",
            Description = "A new role for testing"
        };

        var createdRole = new RoleResponse
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description
        };

        _roleServiceMock
            .Setup(x => x.CreateRoleAsync(request))
            .ReturnsAsync(createdRole);

        // Act
        await _controller.CreateRole(request);

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

    #endregion

    #region Security Tests

    [Fact]
    public async Task CreateRole_WithMaliciousInput_HandlesGracefully()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var request = new RoleRequest
        {
            Name = "<script>alert('xss')</script>",
            Description = "'; DROP TABLE Roles; --"
        };

        var createdRole = new RoleResponse
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description
        };

        _roleServiceMock
            .Setup(x => x.CreateRoleAsync(request))
            .ReturnsAsync(createdRole);

        // Act
        var result = await _controller.CreateRole(request);

        // Assert
        // The controller should handle the request normally, 
        // with sanitization happening in the logging layer
        result.Should().BeOfType<CreatedAtActionResult>();
        _roleServiceMock.Verify(x => x.CreateRoleAsync(request), Times.Once);
    }

    #endregion
}