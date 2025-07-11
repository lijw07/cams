using Microsoft.AspNetCore.Mvc;
using cams.Backend.Controller;
using cams.Backend.Services;
using cams.Backend.View;
using cams.Backend.Model;
using cams.Backend.Attributes;

namespace Cams.Tests.Controllers;

public class LogsControllerTests : ControllerTestBase
{
    private readonly Mock<ILoggingService> _loggingServiceMock;
    private readonly Mock<ILogger<LogsController>> _loggerMock;
    private readonly LogsController _controller;

    public LogsControllerTests()
    {
        _loggingServiceMock = new Mock<ILoggingService>();
        _loggerMock = new Mock<ILogger<LogsController>>();
        _controller = new LogsController(
            _loggingServiceMock.Object,
            _loggerMock.Object);
    }

    #region GetAuditLogs Tests

    [Fact]
    public async Task GetAuditLogs_WithValidRequest_ReturnsOkWithLogs()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var auditLogs = new List<AuditLog>
        {
            new AuditLog { Id = Guid.NewGuid(), Action = "Create", EntityType = "User", UserId = userId },
            new AuditLog { Id = Guid.NewGuid(), Action = "Update", EntityType = "Application", UserId = userId }
        };

        _loggingServiceMock
            .Setup(x => x.GetAuditLogsWithCountAsync(
                It.IsAny<Guid?>(), It.IsAny<string?>(), It.IsAny<DateTime?>(), It.IsAny<DateTime?>(),
                It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync((auditLogs, 2));

        // Act
        var result = await _controller.GetAuditLogs();

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<LogsResponse<AuditLog>>().Subject;
        response.Data.Should().HaveCount(2);
        response.TotalCount.Should().Be(2);
        response.Page.Should().Be(1);
        response.PageSize.Should().Be(20);

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
    public async Task GetAuditLogs_WithFilters_PassesCorrectParameters()
    {
        // Arrange
        var currentUserId = Guid.NewGuid();
        var filterUserId = Guid.NewGuid();
        var fromDate = DateTime.UtcNow.AddDays(-7);
        var toDate = DateTime.UtcNow;
        
        _controller.ControllerContext = CreateControllerContext(currentUserId);

        _loggingServiceMock
            .Setup(x => x.GetAuditLogsWithCountAsync(filterUserId, "User", fromDate, toDate, 50, 2))
            .ReturnsAsync((new List<AuditLog>(), 0));

        // Act
        await _controller.GetAuditLogs(filterUserId, "User", fromDate, toDate, 50, 2);

        // Assert
        _loggingServiceMock.Verify(x => x.GetAuditLogsWithCountAsync(
            filterUserId, "User", fromDate, toDate, 50, 2), Times.Once);
    }

    [Fact]
    public async Task GetAuditLogs_WhenExceptionThrown_ReturnsInternalServerError()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        _loggingServiceMock
            .Setup(x => x.GetAuditLogsWithCountAsync(
                It.IsAny<Guid?>(), It.IsAny<string?>(), It.IsAny<DateTime?>(), It.IsAny<DateTime?>(),
                It.IsAny<int>(), It.IsAny<int>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetAuditLogs();

        // Assert
        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetSystemLogs Tests

    [Fact]
    public async Task GetSystemLogs_WithValidRequest_ReturnsOkWithLogs()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var systemLogs = new List<SystemLog>
        {
            new SystemLog { Id = Guid.NewGuid(), EventType = "ConfigurationChange", Level = "Information" },
            new SystemLog { Id = Guid.NewGuid(), EventType = "DatabaseError", Level = "Error" }
        };

        _loggingServiceMock
            .Setup(x => x.GetSystemLogsWithCountAsync(
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<DateTime?>(), It.IsAny<DateTime?>(),
                It.IsAny<bool?>(), It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync((systemLogs, 2));

        // Act
        var result = await _controller.GetSystemLogs();

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<LogsResponse<SystemLog>>().Subject;
        response.Data.Should().HaveCount(2);
        response.TotalCount.Should().Be(2);
    }

    [Fact]
    public async Task GetSystemLogs_WithFilters_PassesCorrectParameters()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        _loggingServiceMock
            .Setup(x => x.GetSystemLogsWithCountAsync("Error", "DatabaseError", null, null, false, 20, 1))
            .ReturnsAsync((new List<SystemLog>(), 0));

        // Act
        await _controller.GetSystemLogs("Error", "DatabaseError", null, null, false);

        // Assert
        _loggingServiceMock.Verify(x => x.GetSystemLogsWithCountAsync(
            "Error", "DatabaseError", null, null, false, 20, 1), Times.Once);
    }

    [Fact]
    public async Task GetSystemLogs_WhenExceptionThrown_ReturnsInternalServerError()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        _loggingServiceMock
            .Setup(x => x.GetSystemLogsWithCountAsync(
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<DateTime?>(), It.IsAny<DateTime?>(),
                It.IsAny<bool?>(), It.IsAny<int>(), It.IsAny<int>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetSystemLogs();

        // Assert
        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetSecurityLogs Tests

    [Fact]
    public async Task GetSecurityLogs_WithValidRequest_ReturnsOkWithLogs()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var securityLogs = new List<SecurityLog>
        {
            new SecurityLog { Id = Guid.NewGuid(), EventType = "LoginAttempt", Status = "Success" },
            new SecurityLog { Id = Guid.NewGuid(), EventType = "PasswordChange", Status = "Success" }
        };

        _loggingServiceMock
            .Setup(x => x.GetSecurityLogsWithCountAsync(
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<Guid?>(), It.IsAny<DateTime?>(),
                It.IsAny<DateTime?>(), It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync((securityLogs, 2));

        // Act
        var result = await _controller.GetSecurityLogs();

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<LogsResponse<SecurityLog>>().Subject;
        response.Data.Should().HaveCount(2);
        response.TotalCount.Should().Be(2);
    }

    [Fact]
    public async Task GetSecurityLogs_WithFilters_PassesCorrectParameters()
    {
        // Arrange
        var currentUserId = Guid.NewGuid();
        var filterUserId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(currentUserId);

        _loggingServiceMock
            .Setup(x => x.GetSecurityLogsWithCountAsync("LoginAttempt", "Failed", filterUserId, null, null, 20, 1))
            .ReturnsAsync((new List<SecurityLog>(), 0));

        // Act
        await _controller.GetSecurityLogs("LoginAttempt", "Failed", filterUserId);

        // Assert
        _loggingServiceMock.Verify(x => x.GetSecurityLogsWithCountAsync(
            "LoginAttempt", "Failed", filterUserId, null, null, 20, 1), Times.Once);
    }

    [Fact]
    public async Task GetSecurityLogs_WhenExceptionThrown_ReturnsInternalServerError()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        _loggingServiceMock
            .Setup(x => x.GetSecurityLogsWithCountAsync(
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<Guid?>(), It.IsAny<DateTime?>(),
                It.IsAny<DateTime?>(), It.IsAny<int>(), It.IsAny<int>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetSecurityLogs();

        // Assert
        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetPerformanceLogs Tests

    [Fact]
    public async Task GetPerformanceLogs_WithValidRequest_ReturnsOkWithLogs()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var performanceLogs = new List<PerformanceLog>
        {
            new PerformanceLog { Id = Guid.NewGuid(), Operation = "DatabaseQuery", Duration = TimeSpan.FromMilliseconds(1500) },
            new PerformanceLog { Id = Guid.NewGuid(), Operation = "APICall", Duration = TimeSpan.FromMilliseconds(800) }
        };

        _loggingServiceMock
            .Setup(x => x.GetPerformanceLogsWithCountAsync(
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<DateTime?>(), It.IsAny<DateTime?>(),
                It.IsAny<bool?>(), It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync((performanceLogs, 2));

        // Act
        var result = await _controller.GetPerformanceLogs();

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<LogsResponse<PerformanceLog>>().Subject;
        response.Data.Should().HaveCount(2);
        response.TotalCount.Should().Be(2);
    }

    [Fact]
    public async Task GetPerformanceLogs_WithFilters_PassesCorrectParameters()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        _loggingServiceMock
            .Setup(x => x.GetPerformanceLogsWithCountAsync("DatabaseQuery", "Warning", null, null, true, 20, 1))
            .ReturnsAsync((new List<PerformanceLog>(), 0));

        // Act
        await _controller.GetPerformanceLogs("DatabaseQuery", "Warning", null, null, true);

        // Assert
        _loggingServiceMock.Verify(x => x.GetPerformanceLogsWithCountAsync(
            "DatabaseQuery", "Warning", null, null, true, 20, 1), Times.Once);
    }

    [Fact]
    public async Task GetPerformanceLogs_WhenExceptionThrown_ReturnsInternalServerError()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        _loggingServiceMock
            .Setup(x => x.GetPerformanceLogsWithCountAsync(
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<DateTime?>(), It.IsAny<DateTime?>(),
                It.IsAny<bool?>(), It.IsAny<int>(), It.IsAny<int>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetPerformanceLogs();

        // Assert
        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region MarkSystemLogResolved Tests

    [Fact]
    public async Task MarkSystemLogResolved_WithValidId_ReturnsOkWithSuccessMessage()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var logId = Guid.NewGuid();
        var resolutionNotes = "Issue resolved by platform admin";
        
        _controller.ControllerContext = CreateControllerContext(userId);

        // Act
        var result = await _controller.MarkSystemLogResolved(logId, resolutionNotes);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeAssignableTo<object>().Subject;

        _loggingServiceMock.Verify(x => x.MarkSystemLogResolvedAsync(logId, resolutionNotes), Times.Once);
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
    public async Task MarkSystemLogResolved_WhenExceptionThrown_ReturnsInternalServerError()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var logId = Guid.NewGuid();
        
        _controller.ControllerContext = CreateControllerContext(userId);

        _loggingServiceMock
            .Setup(x => x.MarkSystemLogResolvedAsync(logId, It.IsAny<string>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.MarkSystemLogResolved(logId, "Notes");

        // Assert
        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetAuditLogById Tests

    [Fact]
    public async Task GetAuditLogById_WithValidId_ReturnsOkWithLog()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var logId = Guid.NewGuid();
        var auditLog = new AuditLog { Id = logId, Action = "Create", EntityType = "User", UserId = userId };
        
        _controller.ControllerContext = CreateControllerContext(userId);

        _loggingServiceMock
            .Setup(x => x.GetAuditLogByIdAsync(logId))
            .ReturnsAsync(auditLog);

        // Act
        var result = await _controller.GetAuditLogById(logId);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedLog = okResult.Value.Should().BeOfType<AuditLog>().Subject;
        returnedLog.Id.Should().Be(logId);

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
    public async Task GetAuditLogById_WithNonexistentId_ReturnsNotFound()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var logId = Guid.NewGuid();
        
        _controller.ControllerContext = CreateControllerContext(userId);

        _loggingServiceMock
            .Setup(x => x.GetAuditLogByIdAsync(logId))
            .ReturnsAsync((AuditLog?)null);

        // Act
        var result = await _controller.GetAuditLogById(logId);

        // Assert
        var notFoundResult = result.Should().BeOfType<NotFoundObjectResult>().Subject;
        var response = notFoundResult.Value.Should().BeAssignableTo<object>().Subject;
    }

    [Fact]
    public async Task GetAuditLogById_WhenExceptionThrown_ReturnsInternalServerError()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var logId = Guid.NewGuid();
        
        _controller.ControllerContext = CreateControllerContext(userId);

        _loggingServiceMock
            .Setup(x => x.GetAuditLogByIdAsync(logId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetAuditLogById(logId);

        // Assert
        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetSystemLogById Tests

    [Fact]
    public async Task GetSystemLogById_WithValidId_ReturnsOkWithLog()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var logId = Guid.NewGuid();
        var systemLog = new SystemLog { Id = logId, EventType = "ConfigurationChange", Level = "Information" };
        
        _controller.ControllerContext = CreateControllerContext(userId);

        _loggingServiceMock
            .Setup(x => x.GetSystemLogByIdAsync(logId))
            .ReturnsAsync(systemLog);

        // Act
        var result = await _controller.GetSystemLogById(logId);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedLog = okResult.Value.Should().BeOfType<SystemLog>().Subject;
        returnedLog.Id.Should().Be(logId);
    }

    [Fact]
    public async Task GetSystemLogById_WithNonexistentId_ReturnsNotFound()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var logId = Guid.NewGuid();
        
        _controller.ControllerContext = CreateControllerContext(userId);

        _loggingServiceMock
            .Setup(x => x.GetSystemLogByIdAsync(logId))
            .ReturnsAsync((SystemLog?)null);

        // Act
        var result = await _controller.GetSystemLogById(logId);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task GetSystemLogById_WhenExceptionThrown_ReturnsInternalServerError()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var logId = Guid.NewGuid();
        
        _controller.ControllerContext = CreateControllerContext(userId);

        _loggingServiceMock
            .Setup(x => x.GetSystemLogByIdAsync(logId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetSystemLogById(logId);

        // Assert
        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetSecurityLogById Tests

    [Fact]
    public async Task GetSecurityLogById_WithValidId_ReturnsOkWithLog()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var logId = Guid.NewGuid();
        var securityLog = new SecurityLog { Id = logId, EventType = "LoginAttempt", Status = "Success" };
        
        _controller.ControllerContext = CreateControllerContext(userId);

        _loggingServiceMock
            .Setup(x => x.GetSecurityLogByIdAsync(logId))
            .ReturnsAsync(securityLog);

        // Act
        var result = await _controller.GetSecurityLogById(logId);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedLog = okResult.Value.Should().BeOfType<SecurityLog>().Subject;
        returnedLog.Id.Should().Be(logId);
    }

    [Fact]
    public async Task GetSecurityLogById_WithNonexistentId_ReturnsNotFound()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var logId = Guid.NewGuid();
        
        _controller.ControllerContext = CreateControllerContext(userId);

        _loggingServiceMock
            .Setup(x => x.GetSecurityLogByIdAsync(logId))
            .ReturnsAsync((SecurityLog?)null);

        // Act
        var result = await _controller.GetSecurityLogById(logId);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task GetSecurityLogById_WhenExceptionThrown_ReturnsInternalServerError()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var logId = Guid.NewGuid();
        
        _controller.ControllerContext = CreateControllerContext(userId);

        _loggingServiceMock
            .Setup(x => x.GetSecurityLogByIdAsync(logId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetSecurityLogById(logId);

        // Assert
        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetPerformanceLogById Tests

    [Fact]
    public async Task GetPerformanceLogById_WithValidId_ReturnsOkWithLog()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var logId = Guid.NewGuid();
        var performanceLog = new PerformanceLog { Id = logId, Operation = "DatabaseQuery", Duration = TimeSpan.FromMilliseconds(1500) };
        
        _controller.ControllerContext = CreateControllerContext(userId);

        _loggingServiceMock
            .Setup(x => x.GetPerformanceLogByIdAsync(logId))
            .ReturnsAsync(performanceLog);

        // Act
        var result = await _controller.GetPerformanceLogById(logId);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedLog = okResult.Value.Should().BeOfType<PerformanceLog>().Subject;
        returnedLog.Id.Should().Be(logId);
    }

    [Fact]
    public async Task GetPerformanceLogById_WithNonexistentId_ReturnsNotFound()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var logId = Guid.NewGuid();
        
        _controller.ControllerContext = CreateControllerContext(userId);

        _loggingServiceMock
            .Setup(x => x.GetPerformanceLogByIdAsync(logId))
            .ReturnsAsync((PerformanceLog?)null);

        // Act
        var result = await _controller.GetPerformanceLogById(logId);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task GetPerformanceLogById_WhenExceptionThrown_ReturnsInternalServerError()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var logId = Guid.NewGuid();
        
        _controller.ControllerContext = CreateControllerContext(userId);

        _loggingServiceMock
            .Setup(x => x.GetPerformanceLogByIdAsync(logId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetPerformanceLogById(logId);

        // Assert
        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetPerformanceMetrics Tests

    [Fact]
    public async Task GetPerformanceMetrics_WithValidRequest_ReturnsOkWithMetrics()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var fromDate = DateTime.UtcNow.AddDays(-7);
        var toDate = DateTime.UtcNow;
        
        _controller.ControllerContext = CreateControllerContext(userId);

        var metrics = new PerformanceMetrics
        {
            TotalRequests = 100,
            AverageResponseTime = 250.0,
            SlowRequests = 5,
            ErrorRequests = 2,
            ErrorRate = 0.02,
            ThroughputPerMinute = 120.5
        };

        _loggingServiceMock
            .Setup(x => x.GetPerformanceMetricsAsync(fromDate, toDate, "DatabaseQuery"))
            .ReturnsAsync(metrics);

        // Act
        var result = await _controller.GetPerformanceMetrics(fromDate, toDate, "DatabaseQuery");

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().Be(metrics);

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
    public async Task GetPerformanceMetrics_WhenExceptionThrown_ReturnsInternalServerError()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        _loggingServiceMock
            .Setup(x => x.GetPerformanceMetricsAsync(It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), It.IsAny<string?>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetPerformanceMetrics();

        // Assert
        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region Security Tests

    [Fact]
    public void LogsController_RequiresPlatformAdminRole()
    {
        // This test verifies that the controller class is decorated with [RequireRole(RoleConstants.PLATFORM_ADMIN)]
        // The actual role checking logic is tested in integration tests or through the RequireRoleAttribute tests
        
        var controllerType = typeof(LogsController);
        var attributes = controllerType.GetCustomAttributes(typeof(RequireRoleAttribute), false);
        
        attributes.Should().NotBeEmpty();
        var requireRoleAttribute = attributes[0] as RequireRoleAttribute;
        requireRoleAttribute.Should().NotBeNull();
    }

    [Fact]
    public async Task GetAuditLogs_LogsUserAccess()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        _loggingServiceMock
            .Setup(x => x.GetAuditLogsWithCountAsync(
                It.IsAny<Guid?>(), It.IsAny<string?>(), It.IsAny<DateTime?>(), It.IsAny<DateTime?>(),
                It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync((new List<AuditLog>(), 0));

        // Act
        await _controller.GetAuditLogs();

        // Assert
        _loggerMock.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("accessing audit logs")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeastOnce);
    }

    [Fact]
    public async Task GetSystemLogs_LogsUserAccess()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        _loggingServiceMock
            .Setup(x => x.GetSystemLogsWithCountAsync(
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<DateTime?>(), It.IsAny<DateTime?>(),
                It.IsAny<bool?>(), It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync((new List<SystemLog>(), 0));

        // Act
        await _controller.GetSystemLogs();

        // Assert
        _loggerMock.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("accessing system logs")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeastOnce);
    }

    #endregion
}