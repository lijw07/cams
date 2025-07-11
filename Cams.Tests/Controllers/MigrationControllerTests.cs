using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using cams.Backend.Controller;
using cams.Backend.Services;
using cams.Backend.View;
using System.Security.Claims;

namespace Cams.Tests.Controllers;

public class MigrationControllerTests : ControllerTestBase
{
    private readonly Mock<IMigrationService> _migrationServiceMock;
    private readonly Mock<ILogger<MigrationController>> _loggerMock;
    private readonly Mock<ILoggingService> _loggingServiceMock;
    private readonly MigrationController _controller;

    public MigrationControllerTests()
    {
        _migrationServiceMock = new Mock<IMigrationService>();
        _loggerMock = new Mock<ILogger<MigrationController>>();
        _loggingServiceMock = new Mock<ILoggingService>();
        _controller = new MigrationController(
            _migrationServiceMock.Object,
            _loggerMock.Object,
            _loggingServiceMock.Object);
    }

    #region ValidateMigration Tests

    [Fact]
    public async Task ValidateMigration_WithAdminRole_ReturnsOkWithValidationResult()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithRole(userId, "Admin");

        var request = new BulkMigrationRequest
        {
            MigrationType = "Users",
            Data = "test data",
            ValidateOnly = true
        };

        var validationResult = new MigrationValidationResult
        {
            IsValid = true,
            TotalRecords = 10,
            Errors = new List<string>(),
            Warnings = new List<string>()
        };

        _migrationServiceMock
            .Setup(x => x.ValidateBulkImportAsync(request))
            .ReturnsAsync(validationResult);

        // Act
        var result = await _controller.ValidateMigration(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedResult = okResult.Value.Should().BeOfType<MigrationValidationResult>().Subject;
        returnedResult.IsValid.Should().BeTrue();
        returnedResult.TotalRecords.Should().Be(10);

        _migrationServiceMock.Verify(x => x.ValidateBulkImportAsync(request), Times.Once);
        _loggingServiceMock.Verify(x => x.LogAuditAsync(
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
    public async Task ValidateMigration_WithPlatformAdminRole_ReturnsOkWithValidationResult()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithRole(userId, "PlatformAdmin");

        var request = new BulkMigrationRequest
        {
            MigrationType = "Applications",
            Data = "test data"
        };

        var validationResult = new MigrationValidationResult
        {
            IsValid = false,
            TotalRecords = 5,
            Errors = new List<string> { "Invalid data format" }
        };

        _migrationServiceMock
            .Setup(x => x.ValidateBulkImportAsync(request))
            .ReturnsAsync(validationResult);

        // Act
        var result = await _controller.ValidateMigration(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedResult = okResult.Value.Should().BeOfType<MigrationValidationResult>().Subject;
        returnedResult.IsValid.Should().BeFalse();
        returnedResult.Errors.Should().Contain("Invalid data format");
    }

    [Fact]
    public async Task ValidateMigration_WithUserRole_ReturnsForbid()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithRole(userId, "User");

        var request = new BulkMigrationRequest
        {
            MigrationType = "Users",
            Data = "test data"
        };

        // Act
        var result = await _controller.ValidateMigration(request);

        // Assert
        result.Should().BeOfType<ForbidResult>();
        _migrationServiceMock.Verify(x => x.ValidateBulkImportAsync(It.IsAny<BulkMigrationRequest>()), Times.Never);
    }

    [Fact]
    public async Task ValidateMigration_WhenExceptionThrown_ReturnsInternalServerError()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithRole(userId, "Admin");

        var request = new BulkMigrationRequest
        {
            MigrationType = "Users",
            Data = "test data"
        };

        _migrationServiceMock
            .Setup(x => x.ValidateBulkImportAsync(request))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.ValidateMigration(request);

        // Assert
        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region ImportData Tests

    [Fact]
    public async Task ImportData_WithValidRequest_ReturnsOkWithMigrationResult()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithRole(userId, "Admin");

        var request = new BulkMigrationRequest
        {
            MigrationType = "Users",
            Data = "test data",
            ValidateOnly = false
        };

        var migrationResult = new MigrationResult
        {
            Success = true,
            TotalRecords = 10,
            SuccessfulRecords = 8,
            FailedRecords = 2,
            Message = "Migration completed"
        };

        _migrationServiceMock
            .Setup(x => x.ProcessBulkMigrationAsync(request, userId))
            .ReturnsAsync(migrationResult);

        // Act
        var result = await _controller.ImportData(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedResult = okResult.Value.Should().BeOfType<MigrationResult>().Subject;
        returnedResult.Success.Should().BeTrue();
        returnedResult.TotalRecords.Should().Be(10);

        _migrationServiceMock.Verify(x => x.ProcessBulkMigrationAsync(request, userId), Times.Once);
        _loggingServiceMock.Verify(x => x.LogAuditAsync(
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
    public async Task ImportData_WithLargeImport_LogsSecurityEvent()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithRole(userId, "PlatformAdmin");

        var request = new BulkMigrationRequest
        {
            MigrationType = "Applications",
            Data = "large data set",
            ValidateOnly = false
        };

        var migrationResult = new MigrationResult
        {
            Success = true,
            TotalRecords = 150, // Large import
            SuccessfulRecords = 150,
            FailedRecords = 0
        };

        _migrationServiceMock
            .Setup(x => x.ProcessBulkMigrationAsync(request, userId))
            .ReturnsAsync(migrationResult);

        // Act
        var result = await _controller.ImportData(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        
        _loggingServiceMock.Verify(x => x.LogSecurityEventAsync(
            It.IsAny<string>(),    // eventType
            It.IsAny<string>(),    // status
            It.IsAny<Guid?>(),     // userId
            It.IsAny<string?>(),   // username
            It.IsAny<string?>(),   // description
            It.IsAny<string?>(),   // ipAddress
            It.IsAny<string?>(),   // userAgent
            It.IsAny<string?>(),   // sessionId
            It.IsAny<string?>(),   // resource
            It.IsAny<string?>(),   // metadata
            It.IsAny<string>(),    // severity
            It.IsAny<string?>()),  // failureReason
            Times.Once);
    }

    [Fact]
    public async Task ImportData_WithValidateOnlyTrue_DoesNotLogSecurityEvent()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithRole(userId, "Admin");

        var request = new BulkMigrationRequest
        {
            MigrationType = "Users",
            Data = "test data",
            ValidateOnly = true
        };

        var migrationResult = new MigrationResult
        {
            Success = true,
            TotalRecords = 10,
            SuccessfulRecords = 10,
            FailedRecords = 0
        };

        _migrationServiceMock
            .Setup(x => x.ProcessBulkMigrationAsync(request, userId))
            .ReturnsAsync(migrationResult);

        // Act
        var result = await _controller.ImportData(request);

        // Assert
        _loggingServiceMock.Verify(x => x.LogSecurityEventAsync(
            It.IsAny<string>(),    // eventType
            It.IsAny<string>(),    // status
            It.IsAny<Guid?>(),     // userId
            It.IsAny<string?>(),   // username
            It.IsAny<string?>(),   // description
            It.IsAny<string?>(),   // ipAddress
            It.IsAny<string?>(),   // userAgent
            It.IsAny<string?>(),   // sessionId
            It.IsAny<string?>(),   // resource
            It.IsAny<string?>(),   // metadata
            It.IsAny<string>(),    // severity
            It.IsAny<string?>()),  // failureReason
            Times.Never);
    }

    [Fact]
    public async Task ImportData_WithUserRole_ReturnsForbid()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithRole(userId, "User");

        var request = new BulkMigrationRequest
        {
            MigrationType = "Users",
            Data = "test data"
        };

        // Act
        var result = await _controller.ImportData(request);

        // Assert
        result.Should().BeOfType<ForbidResult>();
        _migrationServiceMock.Verify(x => x.ProcessBulkMigrationAsync(
            It.IsAny<BulkMigrationRequest>(), It.IsAny<Guid>()), Times.Never);
    }

    [Fact]
    public async Task ImportData_WhenExceptionThrown_ReturnsInternalServerError()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithRole(userId, "Admin");

        var request = new BulkMigrationRequest
        {
            MigrationType = "Users",
            Data = "test data"
        };

        _migrationServiceMock
            .Setup(x => x.ProcessBulkMigrationAsync(request, userId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.ImportData(request);

        // Assert
        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region ImportUsers Tests

    [Fact]
    public async Task ImportUsers_WithValidRequest_ReturnsOkWithMigrationResult()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithRole(userId, "Admin");

        var request = new BulkUserImportRequest
        {
            Users = new List<UserImportDto>
            {
                new UserImportDto { Username = "user1", Email = "user1@example.com" },
                new UserImportDto { Username = "user2", Email = "user2@example.com" }
            },
            SendWelcomeEmails = true
        };

        var migrationResult = new MigrationResult
        {
            Success = true,
            TotalRecords = 2,
            SuccessfulRecords = 2,
            FailedRecords = 0
        };

        _migrationServiceMock
            .Setup(x => x.ImportUsersAsync(It.IsAny<BulkUserImportRequest>(), It.IsAny<Guid>(), It.IsAny<string>()))
            .ReturnsAsync(migrationResult);

        // Act
        var result = await _controller.ImportUsers(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedResult = okResult.Value.Should().BeOfType<MigrationResult>().Subject;
        returnedResult.Success.Should().BeTrue();

        _migrationServiceMock.Verify(x => x.ImportUsersAsync(request, userId, It.IsAny<string>()), Times.Once);
        _loggingServiceMock.Verify(x => x.LogAuditAsync(
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
    public async Task ImportUsers_WithUserRole_ReturnsForbid()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithRole(userId, "User");

        var request = new BulkUserImportRequest();

        // Act
        var result = await _controller.ImportUsers(request);

        // Assert
        result.Should().BeOfType<ForbidResult>();
        _migrationServiceMock.Verify(x => x.ImportUsersAsync(
            It.IsAny<BulkUserImportRequest>(), It.IsAny<Guid>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task ImportUsers_WhenExceptionThrown_ReturnsInternalServerError()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithRole(userId, "Admin");

        var request = new BulkUserImportRequest();

        _migrationServiceMock
            .Setup(x => x.ImportUsersAsync(request, userId, It.IsAny<string>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.ImportUsers(request);

        // Assert
        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region ImportRoles Tests

    [Fact]
    public async Task ImportRoles_WithValidRequest_ReturnsOkWithMigrationResult()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithRole(userId, "PlatformAdmin");

        var request = new BulkRoleImportRequest
        {
            Roles = new List<RoleImportDto>
            {
                new RoleImportDto { Name = "TestRole", Description = "Test role" }
            }
        };

        var migrationResult = new MigrationResult
        {
            Success = true,
            TotalRecords = 1,
            SuccessfulRecords = 1,
            FailedRecords = 0
        };

        _migrationServiceMock
            .Setup(x => x.ImportRolesAsync(It.IsAny<BulkRoleImportRequest>(), It.IsAny<Guid>(), It.IsAny<string>()))
            .ReturnsAsync(migrationResult);

        // Act
        var result = await _controller.ImportRoles(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedResult = okResult.Value.Should().BeOfType<MigrationResult>().Subject;
        returnedResult.Success.Should().BeTrue();

        _migrationServiceMock.Verify(x => x.ImportRolesAsync(request, userId, It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task ImportRoles_WithUserRole_ReturnsForbid()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithRole(userId, "User");

        var request = new BulkRoleImportRequest();

        // Act
        var result = await _controller.ImportRoles(request);

        // Assert
        result.Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public async Task ImportRoles_WhenExceptionThrown_ReturnsInternalServerError()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithRole(userId, "Admin");

        var request = new BulkRoleImportRequest();

        _migrationServiceMock
            .Setup(x => x.ImportRolesAsync(request, userId, It.IsAny<string>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.ImportRoles(request);

        // Assert
        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region ImportApplications Tests

    [Fact]
    public async Task ImportApplications_WithValidRequest_ReturnsOkWithMigrationResult()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithRole(userId, "Admin");

        var request = new BulkApplicationImportRequest
        {
            Applications = new List<ApplicationImportDto>
            {
                new ApplicationImportDto { Name = "TestApp", Description = "Test application" }
            }
        };

        var migrationResult = new MigrationResult
        {
            Success = true,
            TotalRecords = 1,
            SuccessfulRecords = 1,
            FailedRecords = 0
        };

        _migrationServiceMock
            .Setup(x => x.ImportApplicationsAsync(request, userId, It.IsAny<string>()))
            .ReturnsAsync(migrationResult);

        // Act
        var result = await _controller.ImportApplications(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedResult = okResult.Value.Should().BeOfType<MigrationResult>().Subject;
        returnedResult.Success.Should().BeTrue();

        _migrationServiceMock.Verify(x => x.ImportApplicationsAsync(request, userId, It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task ImportApplications_WithUserRole_ReturnsForbid()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithRole(userId, "User");

        var request = new BulkApplicationImportRequest();

        // Act
        var result = await _controller.ImportApplications(request);

        // Assert
        result.Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public async Task ImportApplications_WhenExceptionThrown_ReturnsInternalServerError()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithRole(userId, "Admin");

        var request = new BulkApplicationImportRequest();

        _migrationServiceMock
            .Setup(x => x.ImportApplicationsAsync(request, userId, It.IsAny<string>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.ImportApplications(request);

        // Assert
        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetTemplate Tests

    [Fact]
    public async Task GetTemplate_WithUsersType_ReturnsOkWithUserTemplate()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithRole(userId, "Admin");

        // Act
        var result = await _controller.GetTemplate("users");

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().NotBeNull();

        _loggingServiceMock.Verify(x => x.LogAuditAsync(
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
    public async Task GetTemplate_WithRolesType_ReturnsOkWithRoleTemplate()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithRole(userId, "PlatformAdmin");

        // Act
        var result = await _controller.GetTemplate("roles");

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().NotBeNull();
    }

    [Fact]
    public async Task GetTemplate_WithApplicationsType_ReturnsOkWithApplicationTemplate()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithRole(userId, "Admin");

        // Act
        var result = await _controller.GetTemplate("applications");

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().NotBeNull();
    }

    [Fact]
    public async Task GetTemplate_WithInvalidType_ReturnsBadRequest()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithRole(userId, "Admin");

        // Act
        var result = await _controller.GetTemplate("invalid");

        // Assert
        var badRequestResult = result.Should().BeOfType<BadRequestObjectResult>().Subject;
    }

    [Fact]
    public async Task GetTemplate_WithUserRole_ReturnsForbid()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithRole(userId, "User");

        // Act
        var result = await _controller.GetTemplate("users");

        // Assert
        result.Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public async Task GetTemplate_WhenExceptionThrown_ReturnsInternalServerError()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContextWithRole(userId, "Admin");

        // Force an exception by creating an invalid controller scenario
        // Remove the controller context to cause UserHelper.GetCurrentUserId to fail
        _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal();

        // Act
        var result = await _controller.GetTemplate("users");

        // Assert
        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region Helper Methods

    private ControllerContext CreateControllerContextWithRole(Guid userId, string role)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, role)
        };

        var identity = new ClaimsIdentity(claims, "test");
        var principal = new ClaimsPrincipal(identity);

        var context = CreateControllerContext(userId);
        context.HttpContext.User = principal;
        return context;
    }

    #endregion

    #region Security Tests

    [Fact]
    public void MigrationController_AllEndpoints_RequireAuthentication()
    {
        // Verify all endpoints are decorated with [Authorize]
        var controllerType = typeof(MigrationController);
        var authorizeAttributes = controllerType.GetCustomAttributes(typeof(AuthorizeAttribute), false);
        
        authorizeAttributes.Should().NotBeEmpty();
    }

    [Fact]
    public async Task MigrationController_AllImportEndpoints_CheckAdminRole()
    {
        // This test verifies that all import endpoints properly check for Admin or PlatformAdmin roles
        // The actual role checking logic is tested in the individual method tests above
        
        var userId = Guid.NewGuid();
        var unauthorizedUser = CreateControllerContextWithRole(userId, "User");
        _controller.ControllerContext = unauthorizedUser;

        // Test all endpoints return Forbid for non-admin users
        var results = new List<IActionResult>
        {
            await _controller.ValidateMigration(new BulkMigrationRequest()),
            await _controller.ImportData(new BulkMigrationRequest()),
            await _controller.ImportUsers(new BulkUserImportRequest()),
            await _controller.ImportRoles(new BulkRoleImportRequest()),
            await _controller.ImportApplications(new BulkApplicationImportRequest()),
            await _controller.GetTemplate("users")
        };

        results.Should().AllBeOfType<ForbidResult>();
    }

    #endregion
}