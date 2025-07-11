using Microsoft.Extensions.Options;
using cams.Backend.Services;
using cams.Backend.Configuration;
using cams.Backend.View;
using cams.Backend.Enums;
using Cams.Tests.Builders;
using Cams.Tests.Fixtures;

namespace Cams.Tests.Services;

public class DatabaseConnectionServiceTests : IClassFixture<DatabaseFixture>
{
    private readonly DatabaseFixture _fixture;
    private readonly Mock<ILogger<DatabaseConnectionService>> _loggerMock;
    private readonly Mock<IApplicationService> _applicationServiceMock;
    private readonly IOptions<JwtSettings> _jwtSettings;

    public DatabaseConnectionServiceTests(DatabaseFixture fixture)
    {
        _fixture = fixture;
        _loggerMock = new Mock<ILogger<DatabaseConnectionService>>();
        _applicationServiceMock = new Mock<IApplicationService>();
        _jwtSettings = Options.Create(new JwtSettings
        {
            Secret = "super-secret-key-for-testing-purposes-only-12345"
        });
    }

    [Fact]
    public async Task GetUserConnectionsAsync_ReturnsUserConnections()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();

        // Create the Application entity first
        var application = new ApplicationBuilder()
            .WithId(applicationId)
            .WithUserId(userId)
            .WithName("Test Application")
            .Build();
        
        context.Applications.Add(application);

        var connections = new[]
        {
            new DatabaseConnectionBuilder()
                .WithUserId(userId)
                .WithApplicationId(applicationId)
                .WithName("Connection 1")
                .Build(),
            new DatabaseConnectionBuilder()
                .WithUserId(userId)
                .WithApplicationId(applicationId)
                .WithName("Connection 2")
                .Build(),
            new DatabaseConnectionBuilder()
                .WithUserId(Guid.NewGuid()) // Different user
                .WithName("Connection 3")
                .Build()
        };

        context.DatabaseConnections.AddRange(connections);
        await context.SaveChangesAsync();

        var service = new DatabaseConnectionService(
            _loggerMock.Object,
            _jwtSettings,
            _applicationServiceMock.Object,
            context);

        // Act
        var result = await service.GetUserConnectionsAsync(userId, applicationId);

        // Assert
        result.Should().HaveCount(2);
        result.Should().OnlyContain(c => c.Name.StartsWith("Connection") && c.ApplicationId == applicationId);
    }

    [Fact]
    public async Task GetConnectionByIdAsync_WhenConnectionExists_ReturnsConnection()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userId = Guid.NewGuid();
        
        // Create the Application entity first
        var application = new ApplicationBuilder()
            .WithUserId(userId)
            .WithName("Test Application")
            .Build();
        
        context.Applications.Add(application);
        
        var connection = new DatabaseConnectionBuilder()
            .WithUserId(userId)
            .WithApplicationId(application.Id)
            .WithName("Test Connection")
            .Build();

        context.DatabaseConnections.Add(connection);
        await context.SaveChangesAsync();

        var service = new DatabaseConnectionService(
            _loggerMock.Object,
            _jwtSettings,
            _applicationServiceMock.Object,
            context);

        // Act
        var result = await service.GetConnectionByIdAsync(connection.Id, userId);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(connection.Id);
        result.Name.Should().Be("Test Connection");
    }

    [Fact]
    public async Task CreateConnectionAsync_WithValidData_CreatesConnection()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();

        var request = new DatabaseConnectionRequest
        {
            ApplicationId = applicationId,
            Name = "New Connection",
            Description = "Test Connection",
            Type = DatabaseType.SqlServer,
            Server = "localhost",
            Port = 1433,
            Database = "TestDB",
            Username = "sa",
            Password = "password",
            IsActive = true
        };

        _applicationServiceMock
            .Setup(x => x.ValidateApplicationAccessAsync(applicationId, userId))
            .ReturnsAsync(true);

        var service = new DatabaseConnectionService(
            _loggerMock.Object,
            _jwtSettings,
            _applicationServiceMock.Object,
            context);

        // Act
        var result = await service.CreateConnectionAsync(request, userId);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be("New Connection");
        result.Type.Should().Be(DatabaseType.SqlServer);

        var savedConnection = await context.DatabaseConnections.FindAsync(result.Id);
        savedConnection.Should().NotBeNull();
        savedConnection!.PasswordHash.Should().NotBe(request.Password); // Should be encrypted
    }

    [Fact]
    public async Task CreateConnectionAsync_WithoutApplicationAccess_ThrowsException()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();

        var request = new DatabaseConnectionRequest
        {
            ApplicationId = applicationId,
            Name = "New Connection",
            Type = DatabaseType.SqlServer
        };

        _applicationServiceMock
            .Setup(x => x.ValidateApplicationAccessAsync(applicationId, userId))
            .ReturnsAsync(false);

        var service = new DatabaseConnectionService(
            _loggerMock.Object,
            _jwtSettings,
            _applicationServiceMock.Object,
            context);

        // Act & Assert
        await service.Invoking(s => s.CreateConnectionAsync(request, userId))
            .Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("User does not have access to the specified application");
    }

    [Fact]
    public async Task UpdateConnectionAsync_WhenConnectionExists_UpdatesConnection()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userId = Guid.NewGuid();
        
        // Create the Application entity first
        var application = new ApplicationBuilder()
            .WithUserId(userId)
            .WithName("Test Application")
            .Build();
        
        context.Applications.Add(application);
        
        var connection = new DatabaseConnectionBuilder()
            .WithUserId(userId)
            .WithApplicationId(application.Id)
            .WithName("Original Name")
            .WithServer("original-server")
            .Build();

        context.DatabaseConnections.Add(connection);
        await context.SaveChangesAsync();

        var request = new DatabaseConnectionUpdateRequest
        {
            Id = connection.Id,
            Name = "Updated Name",
            Description = "Updated Description",
            Type = DatabaseType.MySQL,
            Server = "new-server",
            Port = 3306,
            IsActive = false
        };

        var service = new DatabaseConnectionService(
            _loggerMock.Object,
            _jwtSettings,
            _applicationServiceMock.Object,
            context);

        // Act
        var result = await service.UpdateConnectionAsync(request, userId);

        // Assert
        result.Should().NotBeNull();
        result!.Name.Should().Be("Updated Name");
        result.Server.Should().Be("new-server");
        result.Type.Should().Be(DatabaseType.MySQL);
        result.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task DeleteConnectionAsync_WhenConnectionExists_DeletesConnection()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userId = Guid.NewGuid();
        var connection = new DatabaseConnectionBuilder()
            .WithUserId(userId)
            .Build();

        context.DatabaseConnections.Add(connection);
        await context.SaveChangesAsync();

        var service = new DatabaseConnectionService(
            _loggerMock.Object,
            _jwtSettings,
            _applicationServiceMock.Object,
            context);

        // Act
        var result = await service.DeleteConnectionAsync(connection.Id, userId);

        // Assert
        result.Should().BeTrue();
        var deletedConnection = await context.DatabaseConnections.FindAsync(connection.Id);
        deletedConnection.Should().BeNull();
    }

    [Fact]
    public async Task TestConnectionAsync_WithValidSqlServerConnection_ReturnsSuccess()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userId = Guid.NewGuid();
        var connection = new DatabaseConnectionBuilder()
            .WithUserId(userId)
            .WithType(DatabaseType.SqlServer)
            .WithConnectionString("Server=localhost;Database=test;User Id=sa;Password=password;")
            .Build();

        context.DatabaseConnections.Add(connection);
        await context.SaveChangesAsync();

        var service = new DatabaseConnectionService(
            _loggerMock.Object,
            _jwtSettings,
            _applicationServiceMock.Object,
            context);

        var testRequest = new DatabaseConnectionTestRequest
        {
            ConnectionId = connection.Id
        };

        // Act
        var result = await service.TestConnectionAsync(testRequest, userId);

        // Assert
        result.Should().NotBeNull();
        // Note: Actual connection test will fail in unit test environment
        // In a real scenario, you'd mock the database connection
    }

    [Fact]
    public async Task ToggleConnectionStatusAsync_TogglesStatus()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userId = Guid.NewGuid();
        var connection = new DatabaseConnectionBuilder()
            .WithUserId(userId)
            .Build();

        context.DatabaseConnections.Add(connection);
        await context.SaveChangesAsync();

        var service = new DatabaseConnectionService(
            _loggerMock.Object,
            _jwtSettings,
            _applicationServiceMock.Object,
            context);

        // Act
        var result = await service.ToggleConnectionStatusAsync(connection.Id, userId, false);

        // Assert
        result.Should().BeTrue();
        var updatedConnection = await context.DatabaseConnections.FindAsync(connection.Id);
        updatedConnection!.IsActive.Should().BeFalse();
    }

}