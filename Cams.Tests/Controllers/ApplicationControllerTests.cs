using Microsoft.AspNetCore.Mvc;
using cams.Backend.Controller;
using cams.Backend.Services;
using cams.Backend.View;
using cams.Backend.Model;
using Cams.Tests.Builders;

namespace Cams.Tests.Controllers;

public class ApplicationControllerTests : ControllerTestBase
{
    private readonly Mock<IApplicationService> _applicationServiceMock;
    private readonly Mock<ILogger<ApplicationController>> _loggerMock;
    private readonly Mock<ILoggingService> _loggingServiceMock;
    private readonly ApplicationController _controller;

    public ApplicationControllerTests()
    {
        _applicationServiceMock = new Mock<IApplicationService>();
        _loggerMock = new Mock<ILogger<ApplicationController>>();
        _loggingServiceMock = new Mock<ILoggingService>();
        _controller = new ApplicationController(_applicationServiceMock.Object, _loggerMock.Object, _loggingServiceMock.Object);
    }

    [Fact]
    public async Task GetApplications_ReturnsOkWithApplications()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var applications = new[]
        {
            new ApplicationSummaryResponse { Id = Guid.NewGuid(), Name = "App1" },
            new ApplicationSummaryResponse { Id = Guid.NewGuid(), Name = "App2" }
        };

        _applicationServiceMock
            .Setup(x => x.GetUserApplicationsAsync(userId))
            .ReturnsAsync(applications);

        // Act
        var result = await _controller.GetApplications(null);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedApplications = okResult.Value.Should().BeAssignableTo<IEnumerable<ApplicationSummaryResponse>>().Subject;
        returnedApplications.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetApplications_WithPagination_ReturnsOkWithPaginatedResult()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var pagination = new PaginationRequest { PageNumber = 1, PageSize = 10 };
        var paginatedResult = new PagedResult<ApplicationSummaryResponse>
        {
            Items = new[] { new ApplicationSummaryResponse { Id = Guid.NewGuid(), Name = "App1" } },
            TotalCount = 1,
            PageNumber = 1,
            PageSize = 10
        };

        _applicationServiceMock
            .Setup(x => x.GetUserApplicationsPaginatedAsync(userId, It.IsAny<PaginationRequest>()))
            .ReturnsAsync(paginatedResult);

        // Act
        var result = await _controller.GetApplications(pagination);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedResult = okResult.Value.Should().BeOfType<PagedResult<ApplicationSummaryResponse>>().Subject;
        returnedResult.TotalCount.Should().Be(1);
    }

    [Fact]
    public async Task GetApplication_WhenApplicationExists_ReturnsOk()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var application = new ApplicationResponse
        {
            Id = applicationId,
            Name = "Test App"
        };

        _applicationServiceMock
            .Setup(x => x.GetApplicationByIdAsync(applicationId, userId))
            .ReturnsAsync(application);

        // Act
        var result = await _controller.GetApplication(applicationId);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedApp = okResult.Value.Should().BeOfType<ApplicationResponse>().Subject;
        returnedApp.Id.Should().Be(applicationId);
    }

    [Fact]
    public async Task GetApplication_WhenApplicationDoesNotExist_ReturnsNotFound()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        _applicationServiceMock
            .Setup(x => x.GetApplicationByIdAsync(applicationId, userId))
            .ReturnsAsync((ApplicationResponse?)null);

        // Act
        var result = await _controller.GetApplication(applicationId);

        // Assert
        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task CreateApplication_WithValidData_ReturnsCreatedAtAction()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var request = new ApplicationRequest
        {
            Name = "New App",
            Description = "Test Description",
            IsActive = true
        };

        var createdApp = new ApplicationResponse
        {
            Id = Guid.NewGuid(),
            Name = request.Name
        };

        _applicationServiceMock
            .Setup(x => x.CreateApplicationAsync(request, userId))
            .ReturnsAsync(createdApp);

        // Act
        var result = await _controller.CreateApplication(request);

        // Assert
        var createdResult = result.Should().BeOfType<CreatedAtActionResult>().Subject;
        createdResult.ActionName.Should().Be(nameof(ApplicationController.GetApplication));
        createdResult.RouteValues!["id"].Should().Be(createdApp.Id);
        createdResult.Value.Should().Be(createdApp);
    }

    [Fact]
    public async Task CreateApplication_WithInvalidModelState_ReturnsBadRequest()
    {
        // Arrange
        _controller.ModelState.AddModelError("Name", "Name is required");
        var request = new ApplicationRequest();

        // Act
        var result = await _controller.CreateApplication(request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task UpdateApplication_WhenApplicationExists_ReturnsOk()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var applicationId = Guid.NewGuid();
        var request = new ApplicationUpdateRequest
        {
            Id = applicationId,
            Name = "Updated App",
            IsActive = true
        };

        var updatedApp = new ApplicationResponse
        {
            Id = request.Id,
            Name = request.Name
        };

        _applicationServiceMock
            .Setup(x => x.UpdateApplicationAsync(request, userId))
            .ReturnsAsync(updatedApp);

        // Act
        var result = await _controller.UpdateApplication(applicationId, request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().Be(updatedApp);
    }

    [Fact]
    public async Task UpdateApplication_WhenApplicationDoesNotExist_ReturnsNotFound()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var applicationId = Guid.NewGuid();
        var request = new ApplicationUpdateRequest
        {
            Id = applicationId,
            Name = "Updated App"
        };

        _applicationServiceMock
            .Setup(x => x.UpdateApplicationAsync(request, userId))
            .ReturnsAsync((ApplicationResponse?)null);

        // Act
        var result = await _controller.UpdateApplication(applicationId, request);

        // Assert
        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task DeleteApplication_WhenApplicationExists_ReturnsNoContent()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        _applicationServiceMock
            .Setup(x => x.DeleteApplicationAsync(applicationId, userId))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.DeleteApplication(applicationId);

        // Assert
        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task DeleteApplication_WhenApplicationDoesNotExist_ReturnsNotFound()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        _applicationServiceMock
            .Setup(x => x.DeleteApplicationAsync(applicationId, userId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.DeleteApplication(applicationId);

        // Assert
        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task ToggleApplicationStatus_WhenSuccessful_ReturnsOk()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var request = new ToggleApplicationStatusRequest
        {
            IsActive = false
        };

        _applicationServiceMock
            .Setup(x => x.ToggleApplicationStatusAsync(applicationId, userId, request.IsActive))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.ToggleApplicationStatus(applicationId, request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value as dynamic;
        response!.message.ToString().Should().Contain("status updated successfully");
    }

    [Fact]
    public async Task CreateApplicationWithConnection_ReturnsCreatedAtAction()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var request = new ApplicationWithConnectionRequest
        {
            ApplicationName = "App with Connection",
            ConnectionName = "Test Connection",
            DatabaseType = cams.Backend.Enums.DatabaseType.SqlServer,
            Server = "localhost",
            Database = "TestDB",
            Username = "sa",
            Password = "password"
        };

        var response = new ApplicationWithConnectionResponse
        {
            Application = new ApplicationResponse { Id = Guid.NewGuid(), Name = request.ApplicationName },
            DatabaseConnection = new DatabaseConnectionResponse { Id = Guid.NewGuid(), Name = request.ConnectionName }
        };

        _applicationServiceMock
            .Setup(x => x.CreateApplicationWithConnectionAsync(request, userId))
            .ReturnsAsync(response);

        // Act
        var result = await _controller.CreateApplicationWithConnection(request);

        // Assert
        var createdResult = result.Should().BeOfType<CreatedAtActionResult>().Subject;
        createdResult.ActionName.Should().Be(nameof(ApplicationController.GetApplicationWithPrimaryConnection));
        createdResult.Value.Should().Be(response);
    }
}