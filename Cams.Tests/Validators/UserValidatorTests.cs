using cams.Backend.Validators;
using cams.Backend.View;

namespace Cams.Tests.Validators;

public class UserValidatorTests
{
    private readonly UserValidator _validator;

    public UserValidatorTests()
    {
        _validator = new UserValidator();
    }

    [Theory]
    [InlineData("validuser", true)]
    [InlineData("valid_user", true)]
    [InlineData("valid-user", true)]
    [InlineData("user123", true)]
    [InlineData("u", false)] // Too short
    [InlineData("us", false)] // Too short
    [InlineData("user with spaces", false)]
    [InlineData("user@name", false)]
    [InlineData("user#name", false)]
    [InlineData("", false)]
    [InlineData(null, false)]
    public void ValidateUsername_ReturnsExpectedResult(string? username, bool expectedValid)
    {
        // Act
        var result = _validator.ValidateUsername(username!);

        // Assert
        result.IsValid.Should().Be(expectedValid);
        if (!expectedValid && !string.IsNullOrEmpty(username))
        {
            result.Errors.Should().NotBeEmpty();
        }
    }

    [Theory]
    [InlineData("StrongPass123!", true)]
    [InlineData("Password123", true)]
    [InlineData("simple1", true)] // 6+ chars, has letter and digit
    [InlineData("WeakPass1", true)] // Has letter and digit, 6+ chars
    [InlineData("Weak1", false)] // Too short (5 chars)
    [InlineData("weakpassword", false)] // No numbers
    [InlineData("123456", false)] // No letters
    [InlineData("WEAKPASSWORD", false)] // No numbers
    [InlineData("", false)]
    [InlineData(null, false)]
    public void ValidatePassword_ReturnsExpectedResult(string? password, bool expectedValid)
    {
        // Act
        var result = _validator.ValidatePassword(password!);

        // Assert
        result.IsValid.Should().Be(expectedValid);
        if (!expectedValid)
        {
            result.Errors.Should().NotBeEmpty();
        }
    }

    [Theory]
    [InlineData("test@example.com", true)]
    [InlineData("user.name@domain.co.uk", true)]
    [InlineData("first+last@sub.domain.com", true)]
    [InlineData("123@example.com", true)]
    [InlineData("notanemail", false)]
    [InlineData("@example.com", false)]
    [InlineData("user@", false)]
    [InlineData("user @example.com", false)]
    [InlineData("user@.com", false)]
    [InlineData("", false)]
    [InlineData(null, false)]
    public void ValidateEmail_ReturnsExpectedResult(string? email, bool expectedValid)
    {
        // Act
        var result = _validator.ValidateEmail(email!);

        // Assert
        result.IsValid.Should().Be(expectedValid);
        if (!expectedValid)
        {
            result.Errors.Should().NotBeEmpty();
        }
    }

    [Fact]
    public void ValidateLoginRequest_WithValidData_ReturnsValid()
    {
        // Arrange
        var request = new LoginRequest
        {
            Username = "validuser",
            Password = "StrongPass123!"
        };

        // Act
        var result = _validator.ValidateLoginRequest(request);

        // Assert
        result.IsValid.Should().BeTrue();
        result.Errors.Should().BeEmpty();
    }

    [Fact]
    public void ValidateLoginRequest_WithInvalidData_ReturnsErrors()
    {
        // Arrange
        var request = new LoginRequest
        {
            Username = "u", // Too short
            Password = "weak" // Too weak
        };

        // Act
        var result = _validator.ValidateLoginRequest(request);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().NotBeEmpty();
        result.Errors.Should().Contain(e => e.Contains("Username"));
        result.Errors.Should().Contain(e => e.Contains("Password"));
    }

    [Fact]
    public void ValidateRefreshTokenRequest_WithValidData_ReturnsValid()
    {
        // Arrange
        var request = new RefreshTokenRequest
        {
            Username = "validuser",
            RefreshToken = "valid-refresh-token"
        };

        // Act
        var result = _validator.ValidateRefreshTokenRequest(request);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void ValidateRefreshTokenRequest_WithMissingData_ReturnsErrors()
    {
        // Arrange
        var request = new RefreshTokenRequest
        {
            Username = "",
            RefreshToken = ""
        };

        // Act
        var result = _validator.ValidateRefreshTokenRequest(request);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().NotBeEmpty();
    }

    [Fact]
    public void ValidatePasswordStrength_ReturnsDetailedFeedback()
    {
        // Arrange
        var weakPasswordNoNumbers = "password"; // No numbers
        var weakPasswordTooShort = "pass1"; // Too short
        var validPassword = "password1"; // Valid: 6+ chars, has letter and number

        // Act
        var weakResult1 = _validator.ValidatePassword(weakPasswordNoNumbers);
        var weakResult2 = _validator.ValidatePassword(weakPasswordTooShort);
        var validResult = _validator.ValidatePassword(validPassword);

        // Assert
        weakResult1.IsValid.Should().BeFalse();
        weakResult1.Errors.Should().NotBeEmpty();
        
        weakResult2.IsValid.Should().BeFalse();
        weakResult2.Errors.Should().NotBeEmpty();
        
        validResult.IsValid.Should().BeTrue();
    }
}