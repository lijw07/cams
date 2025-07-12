using Microsoft.AspNetCore.Mvc;
using cams.Backend.Controller;
using cams.Backend.Services;
using cams.Backend.View;
using cams.Backend.Model;
using cams.Backend.Enums;
using Cams.Tests.Builders;

namespace Cams.Tests.Controllers;

public class DatabaseConnectionControllerTests : ControllerTestBase
{
    private readonly Mock<IDatabaseConnectionService> _connectionServiceMock;
    private readonly Mock<ILogger<DatabaseConnectionController>> _loggerMock;
    private readonly Mock<ILoggingService> _loggingServiceMock;
    private readonly DatabaseConnectionController _controller;

    public DatabaseConnectionControllerTests()
    {
        _connectionServiceMock = new Mock<IDatabaseConnectionService>();
        _loggerMock = new Mock<ILogger<DatabaseConnectionController>>();
        _loggingServiceMock = new Mock<ILoggingService>();
        _controller = new DatabaseConnectionController(
            _connectionServiceMock.Object,
            _loggerMock.Object,
            _loggingServiceMock.Object);
    }

    #region GetConnections Tests

    [Fact]
    public async Task GetConnections_WithValidUser_ReturnsOkWithConnections()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var connections = new List<DatabaseConnectionResponse>
        {
            new DatabaseConnectionResponse { Id = Guid.NewGuid(), Name = "Test Connection 1" },
            new DatabaseConnectionResponse { Id = Guid.NewGuid(), Name = "Test Connection 2" }
        };

        _connectionServiceMock
            .Setup(x => x.GetUserConnectionsAsync(userId, null))
            .ReturnsAsync(connections);

        // Act
        var result = await _controller.GetConnections();

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedConnections = okResult.Value.Should().BeAssignableTo<IEnumerable<DatabaseConnectionResponse>>().Subject;
        returnedConnections.Should().HaveCount(2);

        _connectionServiceMock.Verify(x => x.GetUserConnectionsAsync(userId, null), Times.Once);
    }

    [Fact]
    public async Task GetConnections_WithApplicationFilter_ReturnsFilteredConnections()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var connections = new List<DatabaseConnectionResponse>
        {
            new DatabaseConnectionResponse { Id = Guid.NewGuid(), Name = "App Connection" }
        };

        _connectionServiceMock
            .Setup(x => x.GetUserConnectionsAsync(userId, applicationId))
            .ReturnsAsync(connections);

        // Act
        var result = await _controller.GetConnections(applicationId);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedConnections = okResult.Value.Should().BeAssignableTo<IEnumerable<DatabaseConnectionResponse>>().Subject;
        returnedConnections.Should().HaveCount(1);

        _connectionServiceMock.Verify(x => x.GetUserConnectionsAsync(userId, applicationId), Times.Once);
    }

    [Fact]
    public async Task GetConnections_WhenExceptionThrown_ReturnsInternalServerError()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        _connectionServiceMock
            .Setup(x => x.GetUserConnectionsAsync(userId, null))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetConnections();

        // Assert
        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetConnection Tests

    [Fact]
    public async Task GetConnection_WithValidId_ReturnsOkWithConnection()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var connectionId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var connection = new DatabaseConnectionResponse 
        { 
            Id = connectionId, 
            Name = "Test Connection",
            ApplicationId = Guid.NewGuid(),
            ApplicationName = "Test App"
        };

        _connectionServiceMock
            .Setup(x => x.GetConnectionByIdAsync(connectionId, userId))
            .ReturnsAsync(connection);

        // Act
        var result = await _controller.GetConnection(connectionId);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedConnection = okResult.Value.Should().BeOfType<DatabaseConnectionResponse>().Subject;
        returnedConnection.Id.Should().Be(connectionId);

        _connectionServiceMock.Verify(x => x.GetConnectionByIdAsync(connectionId, userId), Times.Once);
    }

    [Fact]
    public async Task GetConnection_WhenConnectionNotFound_ReturnsNotFound()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var connectionId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        _connectionServiceMock
            .Setup(x => x.GetConnectionByIdAsync(connectionId, userId))
            .ReturnsAsync((DatabaseConnectionResponse?)null);

        // Act
        var result = await _controller.GetConnection(connectionId);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task GetConnection_WhenUnauthorizedAccess_ReturnsUnauthorized()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var connectionId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        _connectionServiceMock
            .Setup(x => x.GetConnectionByIdAsync(connectionId, userId))
            .ThrowsAsync(new UnauthorizedAccessException());

        // Act
        var result = await _controller.GetConnection(connectionId);

        // Assert
        result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    #endregion

    #region CreateConnection Tests

    [Fact]
    public async Task CreateConnection_WithValidData_ReturnsCreatedAtAction()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var request = new DatabaseConnectionRequest
        {
            Name = "New Connection",
            ApplicationId = Guid.NewGuid(),
            Type = DatabaseType.SqlServer,
            Server = "localhost",
            Port = 1433,
            Database = "TestDB",
            Username = "testuser",
            Password = "testpass",
            IsActive = true
        };

        var createdConnection = new DatabaseConnectionResponse
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            ApplicationId = request.ApplicationId,
            ApplicationName = "Test App"
        };

        _connectionServiceMock
            .Setup(x => x.CreateConnectionAsync(request, userId))
            .ReturnsAsync(createdConnection);

        // Act
        var result = await _controller.CreateConnection(request);

        // Assert
        var createdResult = result.Should().BeOfType<CreatedAtActionResult>().Subject;
        createdResult.ActionName.Should().Be("GetConnection");
        createdResult.RouteValues!["id"].Should().Be(createdConnection.Id);

        var returnedConnection = createdResult.Value.Should().BeOfType<DatabaseConnectionResponse>().Subject;
        returnedConnection.Name.Should().Be(request.Name);

        _connectionServiceMock.Verify(x => x.CreateConnectionAsync(request, userId), Times.Once);
    }

    [Fact]
    public async Task CreateConnection_WithInvalidModelState_ReturnsBadRequest()
    {
        // Arrange
        _controller.ModelState.AddModelError("Name", "Name is required");
        var request = new DatabaseConnectionRequest();

        // Act
        var result = await _controller.CreateConnection(request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
        _connectionServiceMock.Verify(x => x.CreateConnectionAsync(It.IsAny<DatabaseConnectionRequest>(), It.IsAny<Guid>()), Times.Never);
    }

    [Fact]
    public async Task CreateConnection_WhenServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var request = new DatabaseConnectionRequest
        {
            Name = "New Connection",
            ApplicationId = Guid.NewGuid(),
            Type = DatabaseType.SqlServer
        };

        _connectionServiceMock
            .Setup(x => x.CreateConnectionAsync(request, userId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.CreateConnection(request);

        // Assert
        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region UpdateConnection Tests

    [Fact]
    public async Task UpdateConnection_WithValidData_ReturnsOkWithUpdatedConnection()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var connectionId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var request = new DatabaseConnectionUpdateRequest
        {
            Id = connectionId,
            Name = "Updated Connection",
            Description = "Updated description"
        };

        var updatedConnection = new DatabaseConnectionResponse
        {
            Id = connectionId,
            Name = request.Name,
            Description = request.Description,
            ApplicationId = Guid.NewGuid(),
            ApplicationName = "Test App"
        };

        _connectionServiceMock
            .Setup(x => x.UpdateConnectionAsync(request, userId))
            .ReturnsAsync(updatedConnection);

        // Act
        var result = await _controller.UpdateConnection(connectionId, request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedConnection = okResult.Value.Should().BeOfType<DatabaseConnectionResponse>().Subject;
        returnedConnection.Name.Should().Be(request.Name);

        _connectionServiceMock.Verify(x => x.UpdateConnectionAsync(request, userId), Times.Once);
    }

    [Fact]
    public async Task UpdateConnection_WithMismatchedIds_ReturnsBadRequest()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var connectionId = Guid.NewGuid();
        var differentId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var request = new DatabaseConnectionUpdateRequest
        {
            Id = differentId,
            Name = "Updated Connection"
        };

        // Act
        var result = await _controller.UpdateConnection(connectionId, request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
        _connectionServiceMock.Verify(x => x.UpdateConnectionAsync(It.IsAny<DatabaseConnectionUpdateRequest>(), It.IsAny<Guid>()), Times.Never);
    }

    [Fact]
    public async Task UpdateConnection_WhenConnectionNotFound_ReturnsNotFound()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var connectionId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var request = new DatabaseConnectionUpdateRequest
        {
            Id = connectionId,
            Name = "Updated Connection"
        };

        _connectionServiceMock
            .Setup(x => x.UpdateConnectionAsync(request, userId))
            .ReturnsAsync((DatabaseConnectionResponse?)null);

        // Act
        var result = await _controller.UpdateConnection(connectionId, request);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    #endregion

    #region DeleteConnection Tests

    [Fact]
    public async Task DeleteConnection_WithValidId_ReturnsNoContent()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var connectionId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        _connectionServiceMock
            .Setup(x => x.DeleteConnectionAsync(connectionId, userId))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.DeleteConnection(connectionId);

        // Assert
        result.Should().BeOfType<NoContentResult>();
        _connectionServiceMock.Verify(x => x.DeleteConnectionAsync(connectionId, userId), Times.Once);
    }

    [Fact]
    public async Task DeleteConnection_WhenConnectionNotFound_ReturnsNotFound()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var connectionId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        _connectionServiceMock
            .Setup(x => x.DeleteConnectionAsync(connectionId, userId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.DeleteConnection(connectionId);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task DeleteConnection_WhenUnauthorizedAccess_ReturnsUnauthorized()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var connectionId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        _connectionServiceMock
            .Setup(x => x.DeleteConnectionAsync(connectionId, userId))
            .ThrowsAsync(new UnauthorizedAccessException());

        // Act
        var result = await _controller.DeleteConnection(connectionId);

        // Assert
        result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    #endregion

    #region TestConnection Tests

    [Fact]
    public async Task TestConnection_WithValidRequest_ReturnsOkWithTestResult()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var request = new DatabaseConnectionTestRequest
        {
            ConnectionDetails = new DatabaseConnectionRequest
            {
                Type = DatabaseType.SqlServer,
                ApplicationId = Guid.NewGuid(),
                Name = "Test Connection",
                Server = "localhost",
                Port = 1433,
                Database = "TestDB",
                Username = "testuser",
                Password = "testpass"
            }
        };

        var testResult = new DatabaseConnectionTestResponse
        {
            IsSuccessful = true,
            Message = "Connection successful",
            ResponseTime = TimeSpan.FromMilliseconds(150),
            TestedAt = DateTime.UtcNow
        };

        _connectionServiceMock
            .Setup(x => x.TestConnectionAsync(request, userId))
            .ReturnsAsync(testResult);

        // Act
        var result = await _controller.TestConnection(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedResult = okResult.Value.Should().BeOfType<DatabaseConnectionTestResponse>().Subject;
        returnedResult.IsSuccessful.Should().BeTrue();
        returnedResult.Message.Should().Be("Connection successful");

        _connectionServiceMock.Verify(x => x.TestConnectionAsync(request, userId), Times.Once);
    }

    [Fact]
    public async Task TestConnection_WithInvalidModelState_ReturnsBadRequest()
    {
        // Arrange
        _controller.ModelState.AddModelError("Server", "Server is required");
        var request = new DatabaseConnectionTestRequest();

        // Act
        var result = await _controller.TestConnection(request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
        _connectionServiceMock.Verify(x => x.TestConnectionAsync(It.IsAny<DatabaseConnectionTestRequest>(), It.IsAny<Guid>()), Times.Never);
    }

    [Fact]
    public async Task TestConnection_WhenTestFails_ReturnsOkWithFailureResult()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var request = new DatabaseConnectionTestRequest
        {
            ConnectionDetails = new DatabaseConnectionRequest
            {
                Type = DatabaseType.SqlServer,
                ApplicationId = Guid.NewGuid(),
                Name = "Test Connection",
                Server = "invalid-server",
                Port = 1433,
                Database = "TestDB",
                Username = "testuser",
                Password = "testpass"
            }
        };

        var testResult = new DatabaseConnectionTestResponse
        {
            IsSuccessful = false,
            Message = "Connection failed: Server not found",
            ResponseTime = TimeSpan.FromMilliseconds(5000),
            TestedAt = DateTime.UtcNow
        };

        _connectionServiceMock
            .Setup(x => x.TestConnectionAsync(request, userId))
            .ReturnsAsync(testResult);

        // Act
        var result = await _controller.TestConnection(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedResult = okResult.Value.Should().BeOfType<DatabaseConnectionTestResponse>().Subject;
        returnedResult.IsSuccessful.Should().BeFalse();
        returnedResult.Message.Should().Contain("Connection failed");
    }

    #endregion

    #region ToggleConnectionStatus Tests

    [Fact]
    public async Task ToggleConnectionStatus_WithValidRequest_ReturnsOkWithToggledConnection()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var connectionId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var request = new ToggleConnectionStatusRequest
        {
            IsActive = false
        };

        _connectionServiceMock
            .Setup(x => x.ToggleConnectionStatusAsync(connectionId, userId, request.IsActive))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.ToggleConnectionStatus(connectionId, request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().NotBeNull();

        _connectionServiceMock.Verify(x => x.ToggleConnectionStatusAsync(connectionId, userId, request.IsActive), Times.Once);
    }

    [Fact]
    public async Task ToggleConnectionStatus_WhenConnectionNotFound_ReturnsNotFound()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var connectionId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var request = new ToggleConnectionStatusRequest
        {
            IsActive = false
        };

        _connectionServiceMock
            .Setup(x => x.ToggleConnectionStatusAsync(connectionId, userId, request.IsActive))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.ToggleConnectionStatus(connectionId, request);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    #endregion

    #region GetSupportedDatabaseTypes Tests

    [Fact]
    public void GetSupportedDatabaseTypes_ReturnsOkWithDatabaseTypes()
    {
        // Act
        var result = _controller.GetSupportedDatabaseTypes();

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var databaseTypes = okResult.Value.Should().BeAssignableTo<object>().Subject;
        databaseTypes.Should().NotBeNull();
    }

    #endregion

    #region BuildConnectionString Tests

    [Fact]
    public void BuildConnectionString_WithValidRequest_ReturnsOkWithConnectionString()
    {
        // Arrange
        var request = new DatabaseConnectionRequest
        {
            Type = DatabaseType.SqlServer,
            Server = "localhost",
            Port = 1433,
            Database = "TestDB",
            Username = "testuser",
            Password = "testpass"
        };

        // Act
        var result = _controller.BuildConnectionString(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().NotBeNull();
    }

    [Fact]
    public void BuildConnectionString_WithInvalidModelState_ReturnsBadRequest()
    {
        // Arrange
        _controller.ModelState.AddModelError("Server", "Server is required");
        var request = new DatabaseConnectionRequest();

        // Act
        var result = _controller.BuildConnectionString(request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    #endregion

    #region ValidateConnectionString Tests

    [Fact]
    public void ValidateConnectionString_WithValidConnectionString_ReturnsOkWithValidationResult()
    {
        // Arrange
        var request = new ValidateConnectionStringRequest
        {
            ConnectionString = "Server=localhost;Database=TestDB;Trusted_Connection=true;",
            DatabaseType = DatabaseType.SqlServer
        };

        var validationResponse = new ConnectionStringValidationResponse
        {
            IsValid = true,
            Message = "Connection string is valid",
            ParsedComponents = new ConnectionStringComponents
            {
                Server = "localhost",
                Database = "TestDB",
                UseIntegratedSecurity = true
            }
        };

        _connectionServiceMock
            .Setup(x => x.ValidateConnectionString(request.ConnectionString, request.DatabaseType))
            .Returns(validationResponse);

        // Act
        var result = _controller.ValidateConnectionString(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedValidation = okResult.Value.Should().BeOfType<ConnectionStringValidationResponse>().Subject;
        returnedValidation.IsValid.Should().BeTrue();
        returnedValidation.Message.Should().Be("Connection string is valid");
        returnedValidation.ParsedComponents.Should().NotBeNull();
        returnedValidation.ParsedComponents!.Server.Should().Be("localhost");
        returnedValidation.ParsedComponents.Database.Should().Be("TestDB");
        returnedValidation.ParsedComponents.UseIntegratedSecurity.Should().BeTrue();

        _connectionServiceMock.Verify(x => x.ValidateConnectionString(request.ConnectionString, request.DatabaseType), Times.Once);
    }

    [Fact]
    public void ValidateConnectionString_WithInvalidModelState_ReturnsBadRequest()
    {
        // Arrange
        _controller.ModelState.AddModelError("ConnectionString", "Connection string is required");
        var request = new ValidateConnectionStringRequest();

        // Act
        var result = _controller.ValidateConnectionString(request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    #endregion

    #region BulkToggleStatus Tests

    [Fact]
    public async Task BulkToggleStatus_WithValidRequest_ReturnsOkWithBulkResult()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var connectionIds = new Guid[] { Guid.NewGuid(), Guid.NewGuid() };
        var request = new BulkToggleRequest
        {
            ConnectionIds = connectionIds,
            IsActive = false
        };

        var bulkResult = new BulkOperationResponse
        {
            Successful = connectionIds,
            Failed = Array.Empty<BulkOperationError>(),
            Message = "All operations completed successfully"
        };

        _connectionServiceMock
            .Setup(x => x.BulkToggleStatusAsync(connectionIds, request.IsActive, userId))
            .ReturnsAsync(bulkResult);

        // Act
        var result = await _controller.BulkToggleStatus(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedResult = okResult.Value.Should().BeOfType<BulkOperationResponse>().Subject;
        returnedResult.Successful.Should().HaveCount(2);
        returnedResult.Failed.Should().BeEmpty();

        _connectionServiceMock.Verify(x => x.BulkToggleStatusAsync(connectionIds, request.IsActive, userId), Times.Once);
    }

    [Fact]
    public async Task BulkToggleStatus_WithInvalidModelState_ReturnsBadRequest()
    {
        // Arrange
        _controller.ModelState.AddModelError("ConnectionIds", "Connection IDs are required");
        var request = new BulkToggleRequest();

        // Act
        var result = await _controller.BulkToggleStatus(request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
        _connectionServiceMock.Verify(x => x.BulkToggleStatusAsync(It.IsAny<Guid[]>(), It.IsAny<bool>(), It.IsAny<Guid>()), Times.Never);
    }

    #endregion

    #region BulkDelete Tests

    [Fact]
    public async Task BulkDelete_WithValidRequest_ReturnsOkWithBulkResult()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var connectionIds = new Guid[] { Guid.NewGuid(), Guid.NewGuid() };
        var request = new BulkDeleteRequest
        {
            ConnectionIds = connectionIds
        };

        var bulkResult = new BulkOperationResponse
        {
            Successful = connectionIds,
            Failed = Array.Empty<BulkOperationError>(),
            Message = "All deletions completed successfully"
        };

        _connectionServiceMock
            .Setup(x => x.BulkDeleteAsync(connectionIds, userId))
            .ReturnsAsync(bulkResult);

        // Act
        var result = await _controller.BulkDelete(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedResult = okResult.Value.Should().BeOfType<BulkOperationResponse>().Subject;
        returnedResult.Successful.Should().HaveCount(2);

        _connectionServiceMock.Verify(x => x.BulkDeleteAsync(connectionIds, userId), Times.Once);
    }

    [Fact]
    public async Task BulkDelete_WithInvalidModelState_ReturnsBadRequest()
    {
        // Arrange
        _controller.ModelState.AddModelError("ConnectionIds", "Connection IDs are required");
        var request = new BulkDeleteRequest();

        // Act
        var result = await _controller.BulkDelete(request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
        _connectionServiceMock.Verify(x => x.BulkDeleteAsync(It.IsAny<Guid[]>(), It.IsAny<Guid>()), Times.Never);
    }

    #endregion

    #region Logging Tests

    [Fact]
    public async Task GetConnections_LogsAuditEvent()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var connections = new List<DatabaseConnectionResponse>();

        _connectionServiceMock
            .Setup(x => x.GetUserConnectionsAsync(userId, null))
            .ReturnsAsync(connections);

        // Act
        await _controller.GetConnections();

        // Assert
        _loggingServiceMock.Verify(
            x => x.LogAuditAsync(
                userId,
                "Read",
                "DatabaseConnection",
                null,
                null,
                null,
                null,
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                "Information"),
            Times.Once);
    }

    [Fact]
    public async Task CreateConnection_LogsAuditEvent()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var request = new DatabaseConnectionRequest
        {
            Name = "New Connection",
            ApplicationId = Guid.NewGuid(),
            Type = DatabaseType.SqlServer
        };

        var createdConnection = new DatabaseConnectionResponse
        {
            Id = Guid.NewGuid(),
            Name = request.Name
        };

        _connectionServiceMock
            .Setup(x => x.CreateConnectionAsync(request, userId))
            .ReturnsAsync(createdConnection);

        // Act
        await _controller.CreateConnection(request);

        // Assert
        _loggingServiceMock.Verify(
            x => x.LogAuditAsync(
                userId,
                "Create",
                "DatabaseConnection",
                createdConnection.Id,
                createdConnection.Name,
                null,
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                "Information"),
            Times.Once);
    }

    [Fact]
    public async Task DeleteConnection_LogsAuditEvent()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var connectionId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        _connectionServiceMock
            .Setup(x => x.DeleteConnectionAsync(connectionId, userId))
            .ReturnsAsync(true);

        // Act
        await _controller.DeleteConnection(connectionId);

        // Assert
        _loggingServiceMock.Verify(
            x => x.LogAuditAsync(
                userId,
                "Delete",
                "DatabaseConnection",
                connectionId,
                null,
                null,
                null,
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                "Information"),
            Times.Once);
    }

    #endregion

    #region Security Tests

    [Fact]
    public async Task GetConnections_WithMaliciousInput_HandlesGracefully()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var connections = new List<DatabaseConnectionResponse>();

        _connectionServiceMock
            .Setup(x => x.GetUserConnectionsAsync(userId, It.IsAny<Guid?>()))
            .ReturnsAsync(connections);

        // Act - Testing with potential GUID that could be malicious
        var result = await _controller.GetConnections(Guid.Empty);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        _connectionServiceMock.Verify(x => x.GetUserConnectionsAsync(userId, Guid.Empty), Times.Once);
    }

    [Fact]
    public async Task CreateConnection_WithMaliciousConnectionString_ShouldBeHandledByService()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var request = new DatabaseConnectionRequest
        {
            Name = "<script>alert('xss')</script>",
            ApplicationId = Guid.NewGuid(),
            Type = DatabaseType.SqlServer,
            Server = "'; DROP TABLE Users; --",
            Database = "TestDB"
        };

        _connectionServiceMock
            .Setup(x => x.CreateConnectionAsync(request, userId))
            .ThrowsAsync(new ArgumentException("Invalid input detected"));

        // Act
        var result = await _controller.CreateConnection(request);

        // Assert
        var badRequestResult = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        badRequestResult.Value.Should().BeEquivalentTo(new { message = "Invalid input detected" });
    }

    #endregion
}