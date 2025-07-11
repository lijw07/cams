using Microsoft.EntityFrameworkCore;
using cams.Backend.Services;
using cams.Backend.View;
using cams.Backend.Model;
using cams.Backend.Mappers;
using Cams.Tests.Builders;
using Cams.Tests.Fixtures;

namespace Cams.Tests.Services;

public class UserServiceTests : IClassFixture<DatabaseFixture>
{
    private readonly DatabaseFixture _fixture;
    private readonly Mock<ILogger<UserService>> _loggerMock;
    private readonly Mock<IUserMapper> _userMapperMock;

    public UserServiceTests(DatabaseFixture fixture)
    {
        _fixture = fixture;
        _loggerMock = new Mock<ILogger<UserService>>();
        _userMapperMock = new Mock<IUserMapper>();
    }

    #region GetUserProfileAsync Tests

    [Fact]
    public async Task GetUserProfileAsync_WhenUserExists_ReturnsUserProfile()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        
        var userId = Guid.NewGuid();
        var user = UserBuilder.Create()
            .WithId(userId)
            .WithUsername("testuser")
            .WithEmail("test@example.com")
            .WithActive(true)
            .Build();

        var role = RoleBuilder.Create()
            .WithName("User")
            .Build();

        var userRole = new UserRole { UserId = userId, RoleId = role.Id, User = user, Role = role };
        user.UserRoles = new List<UserRole> { userRole };

        var application = ApplicationBuilder.Create()
            .WithUserId(userId)
            .Build();

        var connection = DatabaseConnectionBuilder.Create()
            .WithUserId(userId)
            .Build();

        await context.Users.AddAsync(user);
        await context.Roles.AddAsync(role);
        await context.UserRoles.AddAsync(userRole);
        await context.Applications.AddAsync(application);
        await context.DatabaseConnections.AddAsync(connection);
        await context.SaveChangesAsync();

        var expectedProfile = new UserProfileResponse
        {
            Id = userId,
            Username = "testuser",
            Email = "test@example.com",
            ApplicationCount = 1,
            DatabaseConnectionCount = 1
        };

        _userMapperMock
            .Setup(x => x.MapToProfileResponse(It.IsAny<User>(), 1, 1))
            .Returns(expectedProfile);

        // Act
        var result = await userService.GetUserProfileAsync(userId);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(userId);
        result.Username.Should().Be("testuser");
        result.ApplicationCount.Should().Be(1);
        result.DatabaseConnectionCount.Should().Be(1);
        
        _userMapperMock.Verify(x => x.MapToProfileResponse(It.IsAny<User>(), 1, 1), Times.Once);
    }

    [Fact]
    public async Task GetUserProfileAsync_WhenUserDoesNotExist_ReturnsNull()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        var userId = Guid.NewGuid();

        // Act
        var result = await userService.GetUserProfileAsync(userId);

        // Assert
        result.Should().BeNull();
        _userMapperMock.Verify(x => x.MapToProfileResponse(It.IsAny<User>(), It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task GetUserProfileAsync_WhenUserIsInactive_ReturnsNull()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        
        var userId = Guid.NewGuid();
        var user = UserBuilder.Create()
            .WithId(userId)
            .WithActive(false)
            .Build();

        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();

        // Act
        var result = await userService.GetUserProfileAsync(userId);

        // Assert
        result.Should().BeNull();
    }

    #endregion

    #region GetUserProfileSummaryAsync Tests

    [Fact]
    public async Task GetUserProfileSummaryAsync_WhenUserExists_ReturnsUserSummary()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        
        var userId = Guid.NewGuid();
        var user = UserBuilder.Create()
            .WithId(userId)
            .WithUsername("testuser")
            .WithActive(true)
            .Build();

        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();

        var expectedSummary = new UserProfileSummaryResponse
        {
            Id = userId,
            Username = "testuser"
        };

        _userMapperMock
            .Setup(x => x.MapToProfileSummaryResponse(It.IsAny<User>()))
            .Returns(expectedSummary);

        // Act
        var result = await userService.GetUserProfileSummaryAsync(userId);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(userId);
        result.Username.Should().Be("testuser");
        
        _userMapperMock.Verify(x => x.MapToProfileSummaryResponse(It.IsAny<User>()), Times.Once);
    }

    [Fact]
    public async Task GetUserProfileSummaryAsync_WhenUserDoesNotExist_ReturnsNull()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        var userId = Guid.NewGuid();

        // Act
        var result = await userService.GetUserProfileSummaryAsync(userId);

        // Assert
        result.Should().BeNull();
        _userMapperMock.Verify(x => x.MapToProfileSummaryResponse(It.IsAny<User>()), Times.Never);
    }

    #endregion

    #region GetUserAsync Tests

    [Fact]
    public async Task GetUserAsync_WhenUserExists_ReturnsUser()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        
        var userId = Guid.NewGuid();
        var user = UserBuilder.Create()
            .WithId(userId)
            .WithUsername("testuser")
            .WithActive(true)
            .Build();

        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();

        // Act
        var result = await userService.GetUserAsync(userId);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(userId);
        result.Username.Should().Be("testuser");
    }

    [Fact]
    public async Task GetUserAsync_WhenUserDoesNotExist_ReturnsNull()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        var userId = Guid.NewGuid();

        // Act
        var result = await userService.GetUserAsync(userId);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetUserAsync_WhenUserIsInactive_ReturnsNull()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        
        var userId = Guid.NewGuid();
        var user = UserBuilder.Create()
            .WithId(userId)
            .WithActive(false)
            .Build();

        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();

        // Act
        var result = await userService.GetUserAsync(userId);

        // Assert
        result.Should().BeNull();
    }

    #endregion

    #region UpdateUserProfileAsync Tests

    [Fact]
    public async Task UpdateUserProfileAsync_WhenUserExists_UpdatesProfileAndReturnsResponse()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        
        var userId = Guid.NewGuid();
        var user = UserBuilder.Create()
            .WithId(userId)
            .WithFirstName("John")
            .WithLastName("Doe")
            .WithActive(true)
            .Build();

        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();

        var request = new UserProfileRequest
        {
            FirstName = "Jane",
            LastName = "Smith",
            PhoneNumber = "123-456-7890"
        };

        var expectedResponse = new UserProfileResponse
        {
            Id = userId,
            FirstName = "Jane",
            LastName = "Smith",
            PhoneNumber = "123-456-7890"
        };

        _userMapperMock
            .Setup(x => x.MapToProfileResponse(It.IsAny<User>(), It.IsAny<int>(), It.IsAny<int>()))
            .Returns(expectedResponse);

        // Act
        var result = await userService.UpdateUserProfileAsync(userId, request);

        // Assert
        result.Should().NotBeNull();
        result!.FirstName.Should().Be("Jane");
        result.LastName.Should().Be("Smith");
        result.PhoneNumber.Should().Be("123-456-7890");

        // Verify user was updated in database
        var updatedUser = await context.Users.FindAsync(userId);
        updatedUser!.FirstName.Should().Be("Jane");
        updatedUser.LastName.Should().Be("Smith");
        updatedUser.PhoneNumber.Should().Be("123-456-7890");
        updatedUser.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));

        _userMapperMock.Verify(x => x.MapToProfileResponse(It.IsAny<User>(), It.IsAny<int>(), It.IsAny<int>()), Times.Once);
    }

    [Fact]
    public async Task UpdateUserProfileAsync_WhenUserDoesNotExist_ReturnsNull()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        
        var userId = Guid.NewGuid();
        var request = new UserProfileRequest
        {
            FirstName = "Jane",
            LastName = "Smith"
        };

        // Act
        var result = await userService.UpdateUserProfileAsync(userId, request);

        // Assert
        result.Should().BeNull();
        _userMapperMock.Verify(x => x.MapToProfileResponse(It.IsAny<User>(), It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task UpdateUserProfileAsync_WhenUserIsInactive_ReturnsNull()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        
        var userId = Guid.NewGuid();
        var user = UserBuilder.Create()
            .WithId(userId)
            .WithActive(false)
            .Build();

        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();

        var request = new UserProfileRequest
        {
            FirstName = "Jane",
            LastName = "Smith"
        };

        // Act
        var result = await userService.UpdateUserProfileAsync(userId, request);

        // Assert
        result.Should().BeNull();
    }

    #endregion

    #region ChangePasswordAsync Tests

    [Fact]
    public async Task ChangePasswordAsync_WithValidCurrentPassword_ChangesPasswordAndReturnsSuccess()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        
        var userId = Guid.NewGuid();
        var currentPassword = "OldPassword123!";
        var newPassword = "NewPassword456!";
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(currentPassword);

        var user = UserBuilder.Create()
            .WithId(userId)
            .WithPasswordHash(hashedPassword)
            .WithActive(true)
            .Build();

        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();

        var request = new ChangePasswordRequest
        {
            CurrentPassword = currentPassword,
            NewPassword = newPassword,
            ConfirmNewPassword = newPassword
        };

        // Act
        var result = await userService.ChangePasswordAsync(userId, request);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        result.Message.Should().Be("Password changed successfully");
        result.ChangedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));

        // Verify password was changed in database
        var updatedUser = await context.Users.FindAsync(userId);
        BCrypt.Net.BCrypt.Verify(newPassword, updatedUser!.PasswordHash).Should().BeTrue();
        updatedUser.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public async Task ChangePasswordAsync_WithInvalidCurrentPassword_ReturnsFailure()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        
        var userId = Guid.NewGuid();
        var currentPassword = "OldPassword123!";
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(currentPassword);

        var user = UserBuilder.Create()
            .WithId(userId)
            .WithPasswordHash(hashedPassword)
            .WithActive(true)
            .Build();

        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();

        var request = new ChangePasswordRequest
        {
            CurrentPassword = "WrongPassword",
            NewPassword = "NewPassword456!",
            ConfirmNewPassword = "NewPassword456!"
        };

        // Act
        var result = await userService.ChangePasswordAsync(userId, request);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeFalse();
        result.Message.Should().Be("Current password is incorrect");

        // Verify password was NOT changed
        var updatedUser = await context.Users.FindAsync(userId);
        BCrypt.Net.BCrypt.Verify(currentPassword, updatedUser!.PasswordHash).Should().BeTrue();
    }

    [Fact]
    public async Task ChangePasswordAsync_WhenUserDoesNotExist_ReturnsFailure()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        
        var userId = Guid.NewGuid();
        var request = new ChangePasswordRequest
        {
            CurrentPassword = "OldPassword123!",
            NewPassword = "NewPassword456!",
            ConfirmNewPassword = "NewPassword456!"
        };

        // Act
        var result = await userService.ChangePasswordAsync(userId, request);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeFalse();
        result.Message.Should().Be("User not found");
    }

    [Fact]
    public async Task ChangePasswordAsync_WhenUserIsInactive_ReturnsFailure()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        
        var userId = Guid.NewGuid();
        var user = UserBuilder.Create()
            .WithId(userId)
            .WithActive(false)
            .Build();

        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();

        var request = new ChangePasswordRequest
        {
            CurrentPassword = "OldPassword123!",
            NewPassword = "NewPassword456!",
            ConfirmNewPassword = "NewPassword456!"
        };

        // Act
        var result = await userService.ChangePasswordAsync(userId, request);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeFalse();
        result.Message.Should().Be("User not found");
    }

    #endregion

    #region ChangeEmailAsync Tests

    [Fact]
    public async Task ChangeEmailAsync_WithValidPasswordAndAvailableEmail_ChangesEmailAndReturnsSuccess()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        
        var userId = Guid.NewGuid();
        var currentPassword = "Password123!";
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(currentPassword);
        var newEmail = "newemail@example.com";

        var user = UserBuilder.Create()
            .WithId(userId)
            .WithEmail("oldemail@example.com")
            .WithPasswordHash(hashedPassword)
            .WithActive(true)
            .Build();

        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();

        var request = new ChangeEmailRequest
        {
            NewEmail = newEmail,
            CurrentPassword = currentPassword
        };

        // Act
        var result = await userService.ChangeEmailAsync(userId, request);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        result.Message.Should().Be("Email changed successfully");
        result.NewEmail.Should().Be(newEmail);
        result.ChangedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        result.RequiresVerification.Should().BeFalse();

        // Verify email was changed in database
        var updatedUser = await context.Users.FindAsync(userId);
        updatedUser!.Email.Should().Be(newEmail);
        updatedUser.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public async Task ChangeEmailAsync_WithInvalidPassword_ReturnsFailure()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        
        var userId = Guid.NewGuid();
        var currentPassword = "Password123!";
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(currentPassword);

        var user = UserBuilder.Create()
            .WithId(userId)
            .WithPasswordHash(hashedPassword)
            .WithActive(true)
            .Build();

        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();

        var request = new ChangeEmailRequest
        {
            NewEmail = "newemail@example.com",
            CurrentPassword = "WrongPassword"
        };

        // Act
        var result = await userService.ChangeEmailAsync(userId, request);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeFalse();
        result.Message.Should().Be("Current password is incorrect");
    }

    [Fact]
    public async Task ChangeEmailAsync_WithEmailAlreadyTaken_ReturnsFailure()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        
        var userId1 = Guid.NewGuid();
        var userId2 = Guid.NewGuid();
        var currentPassword = "Password123!";
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(currentPassword);
        var existingEmail = "existing@example.com";

        var user1 = UserBuilder.Create()
            .WithId(userId1)
            .WithEmail("user1@example.com")
            .WithPasswordHash(hashedPassword)
            .WithActive(true)
            .Build();

        var user2 = UserBuilder.Create()
            .WithId(userId2)
            .WithEmail(existingEmail)
            .WithActive(true)
            .Build();

        await context.Users.AddRangeAsync(user1, user2);
        await context.SaveChangesAsync();

        var request = new ChangeEmailRequest
        {
            NewEmail = existingEmail,
            CurrentPassword = currentPassword
        };

        // Act
        var result = await userService.ChangeEmailAsync(userId1, request);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeFalse();
        result.Message.Should().Be("Email address is already in use");
    }

    [Fact]
    public async Task ChangeEmailAsync_WhenUserDoesNotExist_ReturnsFailure()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        
        var userId = Guid.NewGuid();
        var request = new ChangeEmailRequest
        {
            NewEmail = "newemail@example.com",
            CurrentPassword = "Password123!"
        };

        // Act
        var result = await userService.ChangeEmailAsync(userId, request);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeFalse();
        result.Message.Should().Be("User not found");
    }

    #endregion

    #region DeactivateUserAsync Tests

    [Fact]
    public async Task DeactivateUserAsync_WhenUserExists_DeactivatesUserAndReturnsTrue()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        
        var userId = Guid.NewGuid();
        var user = UserBuilder.Create()
            .WithId(userId)
            .WithActive(true)
            .Build();

        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();

        // Act
        var result = await userService.DeactivateUserAsync(userId);

        // Assert
        result.Should().BeTrue();

        // Verify user was deactivated in database
        var updatedUser = await context.Users.FindAsync(userId);
        updatedUser!.IsActive.Should().BeFalse();
        updatedUser.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public async Task DeactivateUserAsync_WhenUserDoesNotExist_ReturnsFalse()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        var userId = Guid.NewGuid();

        // Act
        var result = await userService.DeactivateUserAsync(userId);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task DeactivateUserAsync_WhenUserIsAlreadyInactive_ReturnsFalse()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        
        var userId = Guid.NewGuid();
        var user = UserBuilder.Create()
            .WithId(userId)
            .WithActive(false)
            .Build();

        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();

        // Act
        var result = await userService.DeactivateUserAsync(userId);

        // Assert
        result.Should().BeFalse();
    }

    #endregion

    #region ValidateCurrentPasswordAsync Tests

    [Fact]
    public async Task ValidateCurrentPasswordAsync_WithCorrectPassword_ReturnsTrue()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        
        var userId = Guid.NewGuid();
        var password = "Password123!";
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(password);

        var user = UserBuilder.Create()
            .WithId(userId)
            .WithPasswordHash(hashedPassword)
            .WithActive(true)
            .Build();

        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();

        // Act
        var result = await userService.ValidateCurrentPasswordAsync(userId, password);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task ValidateCurrentPasswordAsync_WithIncorrectPassword_ReturnsFalse()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        
        var userId = Guid.NewGuid();
        var password = "Password123!";
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(password);

        var user = UserBuilder.Create()
            .WithId(userId)
            .WithPasswordHash(hashedPassword)
            .WithActive(true)
            .Build();

        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();

        // Act
        var result = await userService.ValidateCurrentPasswordAsync(userId, "WrongPassword");

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task ValidateCurrentPasswordAsync_WhenUserDoesNotExist_ReturnsFalse()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        var userId = Guid.NewGuid();

        // Act
        var result = await userService.ValidateCurrentPasswordAsync(userId, "Password123!");

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task ValidateCurrentPasswordAsync_WhenUserIsInactive_ReturnsFalse()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        
        var userId = Guid.NewGuid();
        var password = "Password123!";
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(password);

        var user = UserBuilder.Create()
            .WithId(userId)
            .WithPasswordHash(hashedPassword)
            .WithActive(false)
            .Build();

        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();

        // Act
        var result = await userService.ValidateCurrentPasswordAsync(userId, password);

        // Assert
        result.Should().BeFalse();
    }

    #endregion

    #region IsEmailTakenAsync Tests

    [Fact]
    public async Task IsEmailTakenAsync_WhenEmailExists_ReturnsTrue()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        
        var email = "test@example.com";
        var user = UserBuilder.Create()
            .WithEmail(email)
            .WithActive(true)
            .Build();

        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();

        // Act
        var result = await userService.IsEmailTakenAsync(email);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task IsEmailTakenAsync_WhenEmailDoesNotExist_ReturnsFalse()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        var email = "nonexistent@example.com";

        // Act
        var result = await userService.IsEmailTakenAsync(email);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task IsEmailTakenAsync_WhenEmailExistsButUserIsInactive_ReturnsFalse()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        
        var email = "test@example.com";
        var user = UserBuilder.Create()
            .WithEmail(email)
            .WithActive(false)
            .Build();

        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();

        // Act
        var result = await userService.IsEmailTakenAsync(email);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task IsEmailTakenAsync_WithExcludeUserId_ExcludesSpecifiedUser()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        
        var email = "test@example.com";
        var userId = Guid.NewGuid();
        var user = UserBuilder.Create()
            .WithId(userId)
            .WithEmail(email)
            .WithActive(true)
            .Build();

        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();

        // Act
        var result = await userService.IsEmailTakenAsync(email, userId);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task IsEmailTakenAsync_CaseInsensitive_ReturnsTrue()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        
        var email = "Test@Example.com";
        var user = UserBuilder.Create()
            .WithEmail(email.ToLower())
            .WithActive(true)
            .Build();

        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();

        // Act
        var result = await userService.IsEmailTakenAsync(email.ToUpper());

        // Assert
        result.Should().BeTrue();
    }

    #endregion

    #region IsUsernameTakenAsync Tests

    [Fact]
    public async Task IsUsernameTakenAsync_WhenUsernameExists_ReturnsTrue()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        
        var username = "testuser";
        var user = UserBuilder.Create()
            .WithUsername(username)
            .WithActive(true)
            .Build();

        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();

        // Act
        var result = await userService.IsUsernameTakenAsync(username);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task IsUsernameTakenAsync_WhenUsernameDoesNotExist_ReturnsFalse()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        var username = "nonexistentuser";

        // Act
        var result = await userService.IsUsernameTakenAsync(username);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task IsUsernameTakenAsync_WhenUsernameExistsButUserIsInactive_ReturnsFalse()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        
        var username = "testuser";
        var user = UserBuilder.Create()
            .WithUsername(username)
            .WithActive(false)
            .Build();

        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();

        // Act
        var result = await userService.IsUsernameTakenAsync(username);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task IsUsernameTakenAsync_WithExcludeUserId_ExcludesSpecifiedUser()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        
        var username = "testuser";
        var userId = Guid.NewGuid();
        var user = UserBuilder.Create()
            .WithId(userId)
            .WithUsername(username)
            .WithActive(true)
            .Build();

        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();

        // Act
        var result = await userService.IsUsernameTakenAsync(username, userId);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task IsUsernameTakenAsync_CaseInsensitive_ReturnsTrue()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        
        var username = "TestUser";
        var user = UserBuilder.Create()
            .WithUsername(username.ToLower())
            .WithActive(true)
            .Build();

        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();

        // Act
        var result = await userService.IsUsernameTakenAsync(username.ToUpper());

        // Assert
        result.Should().BeTrue();
    }

    #endregion

    #region Logging Tests

    [Fact]
    public async Task UpdateUserProfileAsync_LogsInformation()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        
        var userId = Guid.NewGuid();
        var user = UserBuilder.Create()
            .WithId(userId)
            .WithActive(true)
            .Build();

        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();

        var request = new UserProfileRequest
        {
            FirstName = "Jane",
            LastName = "Smith"
        };

        _userMapperMock
            .Setup(x => x.MapToProfileResponse(It.IsAny<User>(), It.IsAny<int>(), It.IsAny<int>()))
            .Returns(new UserProfileResponse());

        // Act
        await userService.UpdateUserProfileAsync(userId, request);

        // Assert
        _loggerMock.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Updated profile for user")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task ChangePasswordAsync_LogsInformationOnSuccess()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        
        var userId = Guid.NewGuid();
        var currentPassword = "OldPassword123!";
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(currentPassword);

        var user = UserBuilder.Create()
            .WithId(userId)
            .WithPasswordHash(hashedPassword)
            .WithActive(true)
            .Build();

        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();

        var request = new ChangePasswordRequest
        {
            CurrentPassword = currentPassword,
            NewPassword = "NewPassword456!",
            ConfirmNewPassword = "NewPassword456!"
        };

        // Act
        await userService.ChangePasswordAsync(userId, request);

        // Assert
        _loggerMock.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Password changed successfully for user")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task ChangePasswordAsync_LogsWarningOnInvalidPassword()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        
        var userId = Guid.NewGuid();
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword("OldPassword123!");

        var user = UserBuilder.Create()
            .WithId(userId)
            .WithPasswordHash(hashedPassword)
            .WithActive(true)
            .Build();

        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();

        var request = new ChangePasswordRequest
        {
            CurrentPassword = "WrongPassword",
            NewPassword = "NewPassword456!",
            ConfirmNewPassword = "NewPassword456!"
        };

        // Act
        await userService.ChangePasswordAsync(userId, request);

        // Assert
        _loggerMock.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Failed password change attempt for user")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task ChangeEmailAsync_LogsInformationOnSuccess()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        
        var userId = Guid.NewGuid();
        var currentPassword = "Password123!";
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(currentPassword);
        var newEmail = "newemail@example.com";

        var user = UserBuilder.Create()
            .WithId(userId)
            .WithPasswordHash(hashedPassword)
            .WithActive(true)
            .Build();

        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();

        var request = new ChangeEmailRequest
        {
            NewEmail = newEmail,
            CurrentPassword = currentPassword
        };

        // Act
        await userService.ChangeEmailAsync(userId, request);

        // Assert
        _loggerMock.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Email changed successfully for user")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task ChangeEmailAsync_LogsWarningOnInvalidPassword()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        
        var userId = Guid.NewGuid();
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword("Password123!");

        var user = UserBuilder.Create()
            .WithId(userId)
            .WithPasswordHash(hashedPassword)
            .WithActive(true)
            .Build();

        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();

        var request = new ChangeEmailRequest
        {
            NewEmail = "newemail@example.com",
            CurrentPassword = "WrongPassword"
        };

        // Act
        await userService.ChangeEmailAsync(userId, request);

        // Assert
        _loggerMock.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Failed email change attempt for user")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task DeactivateUserAsync_LogsInformation()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var userService = new UserService(_loggerMock.Object, _userMapperMock.Object, context);
        
        var userId = Guid.NewGuid();
        var user = UserBuilder.Create()
            .WithId(userId)
            .WithActive(true)
            .Build();

        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();

        // Act
        await userService.DeactivateUserAsync(userId);

        // Assert
        _loggerMock.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Deactivated user")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion
}