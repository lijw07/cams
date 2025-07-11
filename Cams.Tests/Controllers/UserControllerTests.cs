using Microsoft.AspNetCore.Mvc;
using cams.Backend.Controller;
using cams.Backend.Services;
using cams.Backend.View;
using cams.Backend.Model;
using Cams.Tests.Builders;

namespace Cams.Tests.Controllers;

public class UserControllerTests : ControllerTestBase
{
    private readonly Mock<IUserService> _userServiceMock;
    private readonly Mock<ILogger<UserController>> _loggerMock;
    private readonly Mock<ILoggingService> _loggingServiceMock;
    private readonly UserController _controller;

    public UserControllerTests()
    {
        _userServiceMock = new Mock<IUserService>();
        _loggerMock = new Mock<ILogger<UserController>>();
        _loggingServiceMock = new Mock<ILoggingService>();
        _controller = new UserController(_userServiceMock.Object, _loggerMock.Object, _loggingServiceMock.Object);
    }

    #region GetProfile Tests

    [Fact]
    public async Task GetProfile_WhenUserExists_ReturnsOkWithProfile()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var profile = new UserProfileResponse
        {
            Id = userId,
            Username = "testuser",
            Email = "test@example.com",
            FirstName = "Test",
            LastName = "User",
            IsActive = true
        };

        _userServiceMock
            .Setup(x => x.GetUserProfileAsync(userId))
            .ReturnsAsync(profile);

        // Act
        var result = await _controller.GetProfile();

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedProfile = okResult.Value.Should().BeOfType<UserProfileResponse>().Subject;
        returnedProfile.Id.Should().Be(userId);
        returnedProfile.Username.Should().Be("testuser");

        // Verify service was called
        _userServiceMock.Verify(x => x.GetUserProfileAsync(userId), Times.Once);
    }

    [Fact]
    public async Task GetProfile_WhenUserDoesNotExist_ReturnsNotFound()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        _userServiceMock
            .Setup(x => x.GetUserProfileAsync(userId))
            .ReturnsAsync((UserProfileResponse?)null);

        // Act
        var result = await _controller.GetProfile();

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task GetProfile_WhenUnauthorizedException_ReturnsUnauthorized()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        _userServiceMock
            .Setup(x => x.GetUserProfileAsync(userId))
            .ThrowsAsync(new UnauthorizedAccessException());

        // Act
        var result = await _controller.GetProfile();

        // Assert
        result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public async Task GetProfile_WhenExceptionThrown_ReturnsInternalServerError()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        _userServiceMock
            .Setup(x => x.GetUserProfileAsync(userId))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.GetProfile();

        // Assert
        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region GetProfileSummary Tests

    [Fact]
    public async Task GetProfileSummary_WhenUserExists_ReturnsOkWithSummary()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var summary = new UserProfileSummaryResponse
        {
            Id = userId,
            Username = "testuser",
            Email = "test@example.com",
            FirstName = "Test",
            LastName = "User"
        };

        _userServiceMock
            .Setup(x => x.GetUserProfileSummaryAsync(userId))
            .ReturnsAsync(summary);

        // Act
        var result = await _controller.GetProfileSummary();

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedSummary = okResult.Value.Should().BeOfType<UserProfileSummaryResponse>().Subject;
        returnedSummary.Id.Should().Be(userId);
        returnedSummary.Username.Should().Be("testuser");
        returnedSummary.FullName.Should().Be("Test User");

        // Verify service was called
        _userServiceMock.Verify(x => x.GetUserProfileSummaryAsync(userId), Times.Once);
    }

    [Fact]
    public async Task GetProfileSummary_WhenUserDoesNotExist_ReturnsNotFound()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        _userServiceMock
            .Setup(x => x.GetUserProfileSummaryAsync(userId))
            .ReturnsAsync((UserProfileSummaryResponse?)null);

        // Act
        var result = await _controller.GetProfileSummary();

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    #endregion

    #region UpdateProfile Tests

    [Fact]
    public async Task UpdateProfile_WithValidData_ReturnsOkWithUpdatedProfile()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var request = new UserProfileRequest
        {
            FirstName = "Updated",
            LastName = "Name",
            PhoneNumber = "123-456-7890"
        };

        var currentUser = new User
        {
            Id = userId,
            FirstName = "Original",
            LastName = "User",
            PhoneNumber = "098-765-4321"
        };

        var updatedProfile = new UserProfileResponse
        {
            Id = userId,
            FirstName = "Updated",
            LastName = "Name",
            PhoneNumber = "123-456-7890"
        };

        _userServiceMock
            .Setup(x => x.GetUserAsync(userId))
            .ReturnsAsync(currentUser);

        _userServiceMock
            .Setup(x => x.UpdateUserProfileAsync(userId, request))
            .ReturnsAsync(updatedProfile);

        // Act
        var result = await _controller.UpdateProfile(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedProfile = okResult.Value.Should().BeOfType<UserProfileResponse>().Subject;
        returnedProfile.FirstName.Should().Be("Updated");
        returnedProfile.LastName.Should().Be("Name");

        // Verify services were called
        _userServiceMock.Verify(x => x.GetUserAsync(userId), Times.Once);
        _userServiceMock.Verify(x => x.UpdateUserProfileAsync(userId, request), Times.Once);
    }

    [Fact]
    public async Task UpdateProfile_WithInvalidModelState_ReturnsBadRequest()
    {
        // Arrange
        _controller.ModelState.AddModelError("FirstName", "First name is required");
        var request = new UserProfileRequest();

        // Act
        var result = await _controller.UpdateProfile(request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task UpdateProfile_WhenUserNotFound_ReturnsNotFound()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var request = new UserProfileRequest
        {
            FirstName = "Test",
            LastName = "User"
        };

        _userServiceMock
            .Setup(x => x.GetUserAsync(userId))
            .ReturnsAsync((User?)null);

        // Act
        var result = await _controller.UpdateProfile(request);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task UpdateProfile_WhenUpdateFails_ReturnsNotFound()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var request = new UserProfileRequest
        {
            FirstName = "Test",
            LastName = "User"
        };

        var currentUser = new User { Id = userId, FirstName = "Original", LastName = "User" };

        _userServiceMock
            .Setup(x => x.GetUserAsync(userId))
            .ReturnsAsync(currentUser);

        _userServiceMock
            .Setup(x => x.UpdateUserProfileAsync(userId, request))
            .ReturnsAsync((UserProfileResponse?)null);

        // Act
        var result = await _controller.UpdateProfile(request);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    #endregion

    #region ChangePassword Tests

    [Fact]
    public async Task ChangePassword_WithValidData_ReturnsOkWithSuccessMessage()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var request = new ChangePasswordRequest
        {
            CurrentPassword = "oldPassword123",
            NewPassword = "newPassword456",
            ConfirmNewPassword = "newPassword456"
        };

        var successResponse = new PasswordChangeResponse
        {
            Success = true,
            Message = "Password changed successfully"
        };

        _userServiceMock
            .Setup(x => x.ChangePasswordAsync(userId, request))
            .ReturnsAsync(successResponse);

        // Act
        var result = await _controller.ChangePassword(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<PasswordChangeResponse>().Subject;
        response.Success.Should().BeTrue();

        // Verify service was called
        _userServiceMock.Verify(x => x.ChangePasswordAsync(userId, request), Times.Once);
    }

    [Fact]
    public async Task ChangePassword_WithInvalidCurrentPassword_ReturnsBadRequest()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var request = new ChangePasswordRequest
        {
            CurrentPassword = "wrongPassword",
            NewPassword = "newPassword456",
            ConfirmNewPassword = "newPassword456"
        };

        var failureResponse = new PasswordChangeResponse
        {
            Success = false,
            Message = "Current password is incorrect"
        };

        _userServiceMock
            .Setup(x => x.ChangePasswordAsync(userId, request))
            .ReturnsAsync(failureResponse);

        // Act
        var result = await _controller.ChangePassword(request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task ChangePassword_WithInvalidModelState_ReturnsBadRequest()
    {
        // Arrange
        _controller.ModelState.AddModelError("NewPassword", "Password is required");
        var request = new ChangePasswordRequest();

        // Act
        var result = await _controller.ChangePassword(request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    #endregion

    #region ChangeEmail Tests

    [Fact]
    public async Task ChangeEmail_WithValidData_ReturnsOkWithSuccessMessage()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var request = new ChangeEmailRequest
        {
            NewEmail = "new@example.com",
            CurrentPassword = "password123"
        };

        var currentUser = new User
        {
            Id = userId,
            Email = "old@example.com"
        };

        var successResponse = new EmailChangeResponse
        {
            Success = true,
            Message = "Email changed successfully"
        };

        _userServiceMock
            .Setup(x => x.GetUserAsync(userId))
            .ReturnsAsync(currentUser);

        _userServiceMock
            .Setup(x => x.ChangeEmailAsync(userId, request))
            .ReturnsAsync(successResponse);

        // Act
        var result = await _controller.ChangeEmail(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<EmailChangeResponse>().Subject;
        response.Success.Should().BeTrue();

        // Verify services were called
        _userServiceMock.Verify(x => x.GetUserAsync(userId), Times.Once);
        _userServiceMock.Verify(x => x.ChangeEmailAsync(userId, request), Times.Once);
    }

    [Fact]
    public async Task ChangeEmail_WithInvalidData_ReturnsBadRequest()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var request = new ChangeEmailRequest
        {
            NewEmail = "new@example.com",
            CurrentPassword = "wrongPassword"
        };

        var failureResponse = new EmailChangeResponse
        {
            Success = false,
            Message = "Current password is incorrect"
        };

        _userServiceMock
            .Setup(x => x.ChangeEmailAsync(userId, request))
            .ReturnsAsync(failureResponse);

        // Act
        var result = await _controller.ChangeEmail(request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    #endregion

    #region ValidateCurrentPassword Tests

    [Fact]
    public async Task ValidateCurrentPassword_WithValidPassword_ReturnsOkWithValid()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var request = new ValidatePasswordRequest
        {
            Password = "correctPassword123"
        };

        _userServiceMock
            .Setup(x => x.ValidateCurrentPasswordAsync(userId, request.Password))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.ValidateCurrentPassword(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var responseType = okResult.Value!.GetType();
        var isValidProperty = responseType.GetProperty("isValid");
        var isValid = (bool)isValidProperty!.GetValue(okResult.Value)!;
        isValid.Should().BeTrue();

        // Verify service was called
        _userServiceMock.Verify(x => x.ValidateCurrentPasswordAsync(userId, request.Password), Times.Once);
    }

    [Fact]
    public async Task ValidateCurrentPassword_WithInvalidPassword_ReturnsOkWithInvalid()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var request = new ValidatePasswordRequest
        {
            Password = "wrongPassword"
        };

        _userServiceMock
            .Setup(x => x.ValidateCurrentPasswordAsync(userId, request.Password))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.ValidateCurrentPassword(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var responseType = okResult.Value!.GetType();
        var isValidProperty = responseType.GetProperty("isValid");
        var isValid = (bool)isValidProperty!.GetValue(okResult.Value)!;
        isValid.Should().BeFalse();

        // Verify service was called
        _userServiceMock.Verify(x => x.ValidateCurrentPasswordAsync(userId, request.Password), Times.Once);
    }

    #endregion

    #region DeactivateAccount Tests

    [Fact]
    public async Task DeactivateAccount_WithValidPassword_ReturnsOkWithSuccessMessage()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var request = new DeactivateAccountRequest
        {
            CurrentPassword = "correctPassword123"
        };

        _userServiceMock
            .Setup(x => x.ValidateCurrentPasswordAsync(userId, request.CurrentPassword))
            .ReturnsAsync(true);

        _userServiceMock
            .Setup(x => x.DeactivateUserAsync(userId))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.DeactivateAccount(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var responseType = okResult.Value!.GetType();
        var messageProperty = responseType.GetProperty("message");
        var message = messageProperty!.GetValue(okResult.Value)!.ToString();
        message.Should().Be("Account deactivated successfully");

        // Verify services were called
        _userServiceMock.Verify(x => x.ValidateCurrentPasswordAsync(userId, request.CurrentPassword), Times.Once);
        _userServiceMock.Verify(x => x.DeactivateUserAsync(userId), Times.Once);
    }

    [Fact]
    public async Task DeactivateAccount_WithInvalidPassword_ReturnsBadRequest()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var request = new DeactivateAccountRequest
        {
            CurrentPassword = "wrongPassword"
        };

        _userServiceMock
            .Setup(x => x.ValidateCurrentPasswordAsync(userId, request.CurrentPassword))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.DeactivateAccount(request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();

        // Verify deactivation was not attempted
        _userServiceMock.Verify(x => x.DeactivateUserAsync(It.IsAny<Guid>()), Times.Never);
    }

    [Fact]
    public async Task DeactivateAccount_WhenDeactivationFails_ReturnsInternalServerError()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var request = new DeactivateAccountRequest
        {
            CurrentPassword = "correctPassword123"
        };

        _userServiceMock
            .Setup(x => x.ValidateCurrentPasswordAsync(userId, request.CurrentPassword))
            .ReturnsAsync(true);

        _userServiceMock
            .Setup(x => x.DeactivateUserAsync(userId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.DeactivateAccount(request);

        // Assert
        var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
        objectResult.StatusCode.Should().Be(500);
    }

    #endregion

    #region CheckEmailAvailability Tests

    [Fact]
    public async Task CheckEmailAvailability_WhenEmailIsAvailable_ReturnsOkWithAvailable()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var email = "available@example.com";

        _userServiceMock
            .Setup(x => x.IsEmailTakenAsync(email, userId))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.CheckEmailAvailability(email);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var responseType = okResult.Value!.GetType();
        var isAvailableProperty = responseType.GetProperty("isAvailable");
        var isAvailable = (bool)isAvailableProperty!.GetValue(okResult.Value)!;
        isAvailable.Should().BeTrue();

        // Verify service was called
        _userServiceMock.Verify(x => x.IsEmailTakenAsync(email, userId), Times.Once);
    }

    [Fact]
    public async Task CheckEmailAvailability_WhenEmailIsTaken_ReturnsOkWithUnavailable()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var email = "taken@example.com";

        _userServiceMock
            .Setup(x => x.IsEmailTakenAsync(email, userId))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.CheckEmailAvailability(email);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var responseType = okResult.Value!.GetType();
        var isAvailableProperty = responseType.GetProperty("isAvailable");
        var isAvailable = (bool)isAvailableProperty!.GetValue(okResult.Value)!;
        isAvailable.Should().BeFalse();

        // Verify service was called
        _userServiceMock.Verify(x => x.IsEmailTakenAsync(email, userId), Times.Once);
    }

    #endregion

    #region Security Edge Cases

    [Fact]
    public async Task GetProfile_WithoutAuthentication_ShouldHandleGracefully()
    {
        // Arrange
        // Don't set up controller context - simulate unauthenticated request
        _controller.ControllerContext = new ControllerContext();

        // Act
        var result = await _controller.GetProfile();

        // Assert
        // The controller should handle the unauthenticated case gracefully
        // The actual behavior depends on how UserHelper.GetCurrentUserId handles missing claims
        result.Should().NotBeNull();
    }

    [Fact]
    public async Task UpdateProfile_WithMaliciousInput_ShouldHandleGracefully()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var request = new UserProfileRequest
        {
            FirstName = "<script>alert('xss')</script>",
            LastName = "'; DROP TABLE Users; --",
            PhoneNumber = "123-456-7890"
        };

        var currentUser = new User { Id = userId, FirstName = "Original", LastName = "User" };

        _userServiceMock
            .Setup(x => x.GetUserAsync(userId))
            .ReturnsAsync(currentUser);

        // Mock service should handle sanitization appropriately
        _userServiceMock
            .Setup(x => x.UpdateUserProfileAsync(userId, It.IsAny<UserProfileRequest>()))
            .ReturnsAsync((UserProfileResponse?)null); // Simulate rejection or sanitization

        // Act
        var result = await _controller.UpdateProfile(request);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();

        // Verify the service was called (input sanitization should happen in service layer)
        _userServiceMock.Verify(x => x.UpdateUserProfileAsync(userId, request), Times.Once);
    }

    [Fact]
    public async Task ChangePassword_WithWeakPassword_ShouldFailValidation()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _controller.ControllerContext = CreateControllerContext(userId);

        var request = new ChangePasswordRequest
        {
            CurrentPassword = "oldPassword123",
            NewPassword = "weak", // Weak password
            ConfirmNewPassword = "weak"
        };

        // Simulate model validation failure (this would normally be handled by attributes)
        _controller.ModelState.AddModelError("NewPassword", "Password must meet complexity requirements");

        // Act
        var result = await _controller.ChangePassword(request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();

        // Verify service was not called due to validation failure
        _userServiceMock.Verify(x => x.ChangePasswordAsync(It.IsAny<Guid>(), It.IsAny<ChangePasswordRequest>()), Times.Never);
    }

    #endregion
}