using Microsoft.EntityFrameworkCore;
using cams.Backend.Services;
using cams.Backend.View;
using cams.Backend.Model;
using Cams.Tests.Builders;
using Cams.Tests.Fixtures;

namespace Cams.Tests.Services;

public class ApplicationServiceTests : IClassFixture<DatabaseFixture>
{
    private readonly DatabaseFixture _fixture;
    private readonly Mock<ILogger<ApplicationService>> _loggerMock;

    public ApplicationServiceTests(DatabaseFixture fixture)
    {
        _fixture = fixture;
        _loggerMock = new Mock<ILogger<ApplicationService>>();
    }

    [Fact]
    public async Task GetUserApplicationsAsync_ReturnsUserApplications()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userId = Guid.NewGuid();
        var applications = new[]
        {
            new ApplicationBuilder().WithUserId(userId).WithName("App1").Build(),
            new ApplicationBuilder().WithUserId(userId).WithName("App2").Build(),
            new ApplicationBuilder().WithUserId(Guid.NewGuid()).WithName("App3").Build() // Different user
        };
        
        context.Applications.AddRange(applications);
        await context.SaveChangesAsync();

        var service = new ApplicationService(_loggerMock.Object, context);

        // Act
        var result = await service.GetUserApplicationsAsync(userId);

        // Assert
        result.Should().HaveCount(2);
        result.Should().OnlyContain(a => a.Name == "App1" || a.Name == "App2");
        result.Should().BeInAscendingOrder(a => a.Name);
    }

    [Fact]
    public async Task GetApplicationByIdAsync_WhenApplicationExists_ReturnsApplication()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userId = Guid.NewGuid();
        var application = new ApplicationBuilder()
            .WithUserId(userId)
            .WithName("Test App")
            .Build();
        
        context.Applications.Add(application);
        await context.SaveChangesAsync();

        var service = new ApplicationService(_loggerMock.Object, context);

        // Act
        var result = await service.GetApplicationByIdAsync(application.Id, userId);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(application.Id);
        result.Name.Should().Be("Test App");
    }

    [Fact]
    public async Task GetApplicationByIdAsync_WhenApplicationDoesNotExist_ReturnsNull()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var service = new ApplicationService(_loggerMock.Object, context);

        // Act
        var result = await service.GetApplicationByIdAsync(Guid.NewGuid(), Guid.NewGuid());

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task CreateApplicationAsync_CreatesNewApplication()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userId = Guid.NewGuid();
        var request = new ApplicationRequest
        {
            Name = "New App",
            Description = "Test Description",
            Version = "1.0.0",
            Environment = "Production",
            Tags = "test",
            IsActive = true
        };

        var service = new ApplicationService(_loggerMock.Object, context);

        // Act
        var result = await service.CreateApplicationAsync(request, userId);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be("New App");
        result.Description.Should().Be("Test Description");

        var savedApp = await context.Applications.FindAsync(result.Id);
        savedApp.Should().NotBeNull();
        savedApp!.UserId.Should().Be(userId);
    }

    [Fact]
    public async Task UpdateApplicationAsync_WhenApplicationExists_UpdatesApplication()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userId = Guid.NewGuid();
        var application = new ApplicationBuilder()
            .WithUserId(userId)
            .WithName("Original Name")
            .Build();
        
        context.Applications.Add(application);
        await context.SaveChangesAsync();

        var request = new ApplicationUpdateRequest
        {
            Id = application.Id,
            Name = "Updated Name",
            Description = "Updated Description",
            Version = "2.0.0",
            Environment = "Staging",
            Tags = "updated",
            IsActive = false
        };

        var service = new ApplicationService(_loggerMock.Object, context);

        // Act
        var result = await service.UpdateApplicationAsync(request, userId);

        // Assert
        result.Should().NotBeNull();
        result!.Name.Should().Be("Updated Name");
        result.Description.Should().Be("Updated Description");
        result.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task UpdateApplicationAsync_WhenApplicationDoesNotExist_ReturnsNull()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var request = new ApplicationUpdateRequest
        {
            Id = Guid.NewGuid(),
            Name = "Updated Name",
            IsActive = true
        };

        var service = new ApplicationService(_loggerMock.Object, context);

        // Act
        var result = await service.UpdateApplicationAsync(request, Guid.NewGuid());

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task DeleteApplicationAsync_WhenApplicationExists_DeletesApplication()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userId = Guid.NewGuid();
        var application = new ApplicationBuilder()
            .WithUserId(userId)
            .Build();
        
        context.Applications.Add(application);
        await context.SaveChangesAsync();

        var service = new ApplicationService(_loggerMock.Object, context);

        // Act
        var result = await service.DeleteApplicationAsync(application.Id, userId);

        // Assert
        result.Should().BeTrue();
        var deletedApp = await context.Applications.FindAsync(application.Id);
        deletedApp.Should().BeNull();
    }

    [Fact]
    public async Task DeleteApplicationAsync_WhenApplicationDoesNotExist_ReturnsFalse()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var service = new ApplicationService(_loggerMock.Object, context);

        // Act
        var result = await service.DeleteApplicationAsync(Guid.NewGuid(), Guid.NewGuid());

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task ToggleApplicationStatusAsync_TogglesStatus()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userId = Guid.NewGuid();
        var application = new ApplicationBuilder()
            .WithUserId(userId)
            .Build();
        
        context.Applications.Add(application);
        await context.SaveChangesAsync();

        var service = new ApplicationService(_loggerMock.Object, context);

        // Act
        var result = await service.ToggleApplicationStatusAsync(application.Id, userId, false);

        // Assert
        result.Should().BeTrue();
        var updatedApp = await context.Applications.FindAsync(application.Id);
        updatedApp!.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task GetUserApplicationsPaginatedAsync_ReturnsPaginatedResults()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userId = Guid.NewGuid();
        var applications = Enumerable.Range(1, 15)
            .Select(i => new ApplicationBuilder()
                .WithUserId(userId)
                .WithName($"App{i:D2}")
                .Build())
            .ToArray();
        
        context.Applications.AddRange(applications);
        await context.SaveChangesAsync();

        var request = new PaginationRequest
        {
            PageNumber = 2,
            PageSize = 5,
            SortBy = "name",
            SortDirection = "asc"
        };

        var service = new ApplicationService(_loggerMock.Object, context);

        // Act
        var result = await service.GetUserApplicationsPaginatedAsync(userId, request);

        // Assert
        result.TotalCount.Should().Be(15);
        result.PageNumber.Should().Be(2);
        result.PageSize.Should().Be(5);
        result.Items.Should().HaveCount(5);
        result.Items.First().Name.Should().Be("App06");
    }

    [Fact]
    public async Task GetUserApplicationsPaginatedAsync_WithSearchFilter_ReturnsFilteredResults()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userId = Guid.NewGuid();
        var applications = new[]
        {
            new ApplicationBuilder().WithUserId(userId).WithName("Production App").Build(),
            new ApplicationBuilder().WithUserId(userId).WithName("Test App").Build(),
            new ApplicationBuilder().WithUserId(userId).WithName("Development App").Build()
        };
        
        context.Applications.AddRange(applications);
        await context.SaveChangesAsync();

        var request = new PaginationRequest
        {
            PageNumber = 1,
            PageSize = 10,
            SearchTerm = "test"
        };

        var service = new ApplicationService(_loggerMock.Object, context);

        // Act
        var result = await service.GetUserApplicationsPaginatedAsync(userId, request);

        // Assert
        result.TotalCount.Should().Be(1);
        result.Items.Should().HaveCount(1);
        result.Items.First().Name.Should().Be("Test App");
    }

    [Fact]
    public async Task CreateApplicationWithConnectionAsync_CreatesApplicationAndConnection()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userId = Guid.NewGuid();
        var request = new ApplicationWithConnectionRequest
        {
            ApplicationName = "App with Connection",
            ApplicationDescription = "Test App",
            IsApplicationActive = true,
            ConnectionName = "Test DB",
            ConnectionDescription = "Test Connection",
            DatabaseType = cams.Backend.Enums.DatabaseType.SqlServer,
            Server = "localhost",
            Port = 1433,
            Database = "TestDB",
            Username = "sa",
            Password = "password",
            IsConnectionActive = true,
            TestConnectionOnCreate = false
        };

        var service = new ApplicationService(_loggerMock.Object, context);

        // Act
        var result = await service.CreateApplicationWithConnectionAsync(request, userId);

        // Assert
        result.Should().NotBeNull();
        result.Application.Name.Should().Be("App with Connection");
        result.DatabaseConnection.Name.Should().Be("Test DB");

        var savedApp = await context.Applications
            .Include(a => a.DatabaseConnections)
            .FirstOrDefaultAsync(a => a.Id == result.Application.Id);
        
        savedApp.Should().NotBeNull();
        savedApp!.DatabaseConnections.Should().HaveCount(1);
    }
}