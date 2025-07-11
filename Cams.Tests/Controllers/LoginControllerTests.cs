using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using cams.Backend.Controller;
using cams.Backend.Services;
using cams.Backend.View;
using cams.Backend.Constants;

namespace Cams.Tests.Controllers;

public class LoginControllerTests : ControllerTestBase
{
    private readonly Mock<IAuthenticationService> _authServiceMock;
    private readonly Mock<ILogger<LoginController>> _loggerMock;
    private readonly Mock<ILoggingService> _loggingServiceMock;
    private readonly LoginController _controller;

    public LoginControllerTests()
    {
        _authServiceMock = new Mock<IAuthenticationService>();
        _loggerMock = new Mock<ILogger<LoginController>>();
        _loggingServiceMock = new Mock<ILoggingService>();
        _controller = new LoginController(_authServiceMock.Object, _loggerMock.Object, _loggingServiceMock.Object);
        
        // Setup HttpContext with default values
        var httpContext = new DefaultHttpContext();
        httpContext.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("127.0.0.1");
        httpContext.Request.Headers.UserAgent = "Test User Agent";
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };
    }

    [Fact]
    public async Task Authenticate_WithValidCredentials_ReturnsOk()
    {
        // Arrange
        var request = new LoginRequest
        {
            Username = "testuser",
            Password = "password123"
        };

        var loginResponse = new LoginResponse
        {
            Token = "test-jwt-token",
            RefreshToken = "test-refresh-token",
            Username = request.Username,
            Email = "test@example.com",
            UserId = Guid.NewGuid()
        };

        _authServiceMock
            .Setup(x => x.AuthenticateAsync(request))
            .ReturnsAsync(loginResponse);

        // Act
        var result = await _controller.Authenticate(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<LoginResponse>().Subject;
        response.Token.Should().Be("test-jwt-token");
        
        // Verify logging service was called for successful login
        _loggingServiceMock.Verify(
            x => x.LogSecurityEventAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()),
            Times.AtLeastOnce);
    }

    [Fact]
    public async Task Authenticate_WithInvalidCredentials_ReturnsUnauthorized()
    {
        // Arrange
        var request = new LoginRequest
        {
            Username = "testuser",
            Password = "wrongpassword"
        };

        _authServiceMock
            .Setup(x => x.AuthenticateAsync(request))
            .ReturnsAsync((LoginResponse?)null);

        // Act
        var result = await _controller.Authenticate(request);

        // Assert
        var unauthorizedResult = result.Should().BeOfType<UnauthorizedObjectResult>().Subject;
        
        // Verify failed login was logged
        _loggingServiceMock.Verify(
            x => x.LogSecurityEventAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()),
            Times.Once);
    }

    [Fact]
    public async Task Authenticate_WithInvalidModelState_ReturnsBadRequest()
    {
        // Arrange
        _controller.ModelState.AddModelError("Username", "Username is required");
        var request = new LoginRequest();

        // Act
        var result = await _controller.Authenticate(request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Authenticate_WhenExceptionThrown_ReturnsInternalServerError()
    {
        // Arrange
        var request = new LoginRequest
        {
            Username = "testuser",
            Password = "password"
        };

        _authServiceMock
            .Setup(x => x.AuthenticateAsync(request))
            .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.Authenticate(request);

        // Assert
        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(500);
    }

    [Fact]
    public async Task RefreshToken_WithValidToken_ReturnsOk()
    {
        // Arrange
        var request = new RefreshTokenRequest
        {
            Username = "testuser",
            RefreshToken = "valid-refresh-token"
        };

        var loginResponse = new LoginResponse
        {
            Token = "new-jwt-token",
            RefreshToken = "new-refresh-token",
            Username = "testuser",
            UserId = Guid.NewGuid()
        };

        _authServiceMock
            .Setup(x => x.ValidateRefreshTokenAsync(request.Username, request.RefreshToken))
            .ReturnsAsync(true);

        _authServiceMock
            .Setup(x => x.RefreshTokenAsync(request.Username, request.RefreshToken))
            .ReturnsAsync(loginResponse);

        // Act
        var result = await _controller.RefreshToken(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<LoginResponse>().Subject;
        response.Token.Should().Be("new-jwt-token");
    }

    [Fact]
    public async Task RefreshToken_WithInvalidToken_ReturnsUnauthorized()
    {
        // Arrange
        var request = new RefreshTokenRequest
        {
            Username = "testuser",
            RefreshToken = "invalid-refresh-token"
        };

        _authServiceMock
            .Setup(x => x.ValidateRefreshTokenAsync(request.Username, request.RefreshToken))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.RefreshToken(request);

        // Assert
        var unauthorizedResult = result.Should().BeOfType<UnauthorizedObjectResult>().Subject;
    }

    [Fact]
    public async Task Logout_ReturnsOkWithMessage()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        // Act
        var result = await _controller.Logout();

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        
        // Verify logout was logged
        _loggingServiceMock.Verify(
            x => x.LogSecurityEventAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()),
            Times.Once);
    }

    [Fact]
    public async Task ValidateToken_ReturnsOkWithUserInfo()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId, "Admin", "User");

        // Act
        var result = await _controller.ValidateToken();

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value;
        response.Should().NotBeNull();
        
        // Check if it's an anonymous object with the expected properties
        var responseType = response!.GetType();
        var isValidProperty = responseType.GetProperty("isValid");
        var usernameProperty = responseType.GetProperty("username");
        
        isValidProperty.Should().NotBeNull();
        usernameProperty.Should().NotBeNull();
        
        var isValidValue = isValidProperty!.GetValue(response);
        var usernameValue = usernameProperty!.GetValue(response);
        
        isValidValue.Should().Be(true);
        usernameValue.Should().Be("testuser");
    }
}