using Microsoft.Extensions.Options;
using Microsoft.EntityFrameworkCore;
using cams.Backend.Services;
using cams.Backend.Configuration;
using cams.Backend.View;
using cams.Backend.Mappers;
using Cams.Tests.Builders;
using Cams.Tests.Fixtures;
using System.Security.Cryptography;
using System.Text;

namespace Cams.Tests.Services;

public class AuthenticationServiceTests : IClassFixture<DatabaseFixture>
{
    private readonly DatabaseFixture _fixture;
    private readonly Mock<ILogger<AuthenticationService>> _loggerMock;
    private readonly Mock<IUserMapper> _userMapperMock;
    private readonly IOptions<JwtSettings> _jwtSettings;

    public AuthenticationServiceTests(DatabaseFixture fixture)
    {
        _fixture = fixture;
        _loggerMock = new Mock<ILogger<AuthenticationService>>();
        _userMapperMock = new Mock<IUserMapper>();
        _jwtSettings = Options.Create(new JwtSettings
        {
            Secret = "super-secret-key-for-testing-purposes-only-12345",
            Issuer = "test-issuer",
            Audience = "test-audience",
            ExpirationMinutes = 60,
            RefreshTokenExpirationDays = 7
        });
    }

    [Fact]
    public async Task AuthenticateAsync_WithValidCredentials_ReturnsLoginResponse()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var password = "TestPassword123!";
        var passwordHash = HashPassword(password);
        
        var user = new UserBuilder()
            .WithUsername("testuser")
            .WithPasswordHash(passwordHash)
            .Build();
        
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var request = new LoginRequest
        {
            Username = "testuser",
            Password = password
        };

        var service = new AuthenticationService(_jwtSettings, _loggerMock.Object, context, _userMapperMock.Object);

        // Act
        var result = await service.AuthenticateAsync(request);

        // Assert
        result.Should().NotBeNull();
        result!.Token.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBeNullOrEmpty();
        result.Username.Should().Be("testuser");
    }

    [Fact]
    public async Task AuthenticateAsync_WithInvalidPassword_ReturnsNull()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var user = new UserBuilder()
            .WithUsername("testuser")
            .WithPasswordHash(HashPassword("CorrectPassword"))
            .Build();
        
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var request = new LoginRequest
        {
            Username = "testuser",
            Password = "WrongPassword"
        };

        var service = new AuthenticationService(_jwtSettings, _loggerMock.Object, context, _userMapperMock.Object);

        // Act
        var result = await service.AuthenticateAsync(request);

        // Assert
        result.Should().BeNull();
        _loggerMock.Verify(x => x.Log(
            LogLevel.Warning,
            It.IsAny<EventId>(),
            It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Authentication failed")),
            It.IsAny<Exception>(),
            It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task AuthenticateAsync_WithNonExistentUser_ReturnsNull()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var request = new LoginRequest
        {
            Username = "nonexistent",
            Password = "password"
        };

        var service = new AuthenticationService(_jwtSettings, _loggerMock.Object, context, _userMapperMock.Object);

        // Act
        var result = await service.AuthenticateAsync(request);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task AuthenticateAsync_WithInactiveUser_ReturnsNull()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var password = "TestPassword123!";
        var user = new UserBuilder()
            .WithUsername("inactiveuser")
            .WithPasswordHash(HashPassword(password))
            .AsInactive()
            .Build();
        
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var request = new LoginRequest
        {
            Username = "inactiveuser",
            Password = password
        };

        var service = new AuthenticationService(_jwtSettings, _loggerMock.Object, context, _userMapperMock.Object);

        // Act
        var result = await service.AuthenticateAsync(request);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task RegisterAsync_WithValidData_CreatesNewUser()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var request = new RegisterRequest
        {
            Username = "newuser",
            Password = "NewPassword123!",
            Email = "new@example.com",
            FirstName = "New",
            LastName = "User"
        };

        request.ConfirmPassword = request.Password;

        _userMapperMock.Setup(x => x.MapToProfileResponse(It.IsAny<cams.Backend.Model.User>(), It.IsAny<int>(), It.IsAny<int>()))
            .Returns<cams.Backend.Model.User, int, int>((u, apps, conns) => new UserProfileResponse
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                FirstName = u.FirstName,
                LastName = u.LastName
            });

        var service = new AuthenticationService(_jwtSettings, _loggerMock.Object, context, _userMapperMock.Object);

        // Act
        var result = await service.RegisterAsync(request);

        // Assert
        result.Should().NotBeNull();
        result!.Success.Should().BeTrue();
        result.User.Should().NotBeNull();
        result.User!.Username.Should().Be("newuser");
        result.User.Email.Should().Be("new@example.com");

        var savedUser = await context.Users.FirstOrDefaultAsync(u => u.Username == "newuser");
        savedUser.Should().NotBeNull();
        BCrypt.Net.BCrypt.Verify(request.Password, savedUser!.PasswordHash).Should().BeTrue();
    }

    [Fact]
    public async Task RegisterAsync_WithExistingUsername_ThrowsException()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var existingUser = new UserBuilder()
            .WithUsername("existinguser")
            .Build();
        
        context.Users.Add(existingUser);
        await context.SaveChangesAsync();

        var request = new RegisterRequest
        {
            Username = "existinguser",
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            Email = "another@example.com",
            FirstName = "Another",
            LastName = "User"
        };

        var service = new AuthenticationService(_jwtSettings, _loggerMock.Object, context, _userMapperMock.Object);

        // Act
        var result = await service.RegisterAsync(request);

        // Assert
        result.Should().NotBeNull();
        result!.Success.Should().BeFalse();
        result.Message.Should().Be("Username is already taken");
    }

    [Fact]
    public async Task RefreshTokenAsync_WithValidToken_ReturnsNewTokens()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var refreshToken = GenerateRefreshToken();
        var user = new UserBuilder()
            .WithUsername("testuser")
            .Build();
        
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var service = new AuthenticationService(_jwtSettings, _loggerMock.Object, context, _userMapperMock.Object);

        // Act
        var result = await service.RefreshTokenAsync("testuser", refreshToken);

        // Assert
        result.Should().NotBeNull();
        result!.Token.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBe(refreshToken);
    }

    [Fact]
    public async Task RefreshTokenAsync_WithExpiredToken_ReturnsNull()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var refreshToken = GenerateRefreshToken();
        var user = new UserBuilder()
            .WithUsername("testuser")
            .Build();
        
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(-1); // Expired
        
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var service = new AuthenticationService(_jwtSettings, _loggerMock.Object, context, _userMapperMock.Object);

        // Act
        var result = await service.RefreshTokenAsync("testuser", refreshToken);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task RefreshTokenAsync_WithInvalidToken_ReturnsNull()
    {
        // Arrange
        using var context = _fixture.CreateContext();

        var service = new AuthenticationService(_jwtSettings, _loggerMock.Object, context, _userMapperMock.Object);

        // Act
        var result = await service.RefreshTokenAsync("nonexistent", "invalid-token");

        // Assert
        result.Should().BeNull();
    }

    private string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password);
    }

    private string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }
}