using Backend.Helpers;

namespace Cams.Tests.Helpers;

public class LoggingHelperTests
{
    [Fact]
    public void Sanitize_String_RemovesNewlines()
    {
        // Arrange
        var input = "Test\nwith\rnewlines\r\nand\ttabs";

        // Act
        var result = LoggingHelper.Sanitize(input);

        // Assert
        result.Should().Be("Test with newlines and tabs");
    }

    [Fact]
    public void Sanitize_String_HandlesNull()
    {
        // Act
        var result = LoggingHelper.Sanitize((string?)null);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void Sanitize_String_HandlesEmpty()
    {
        // Act
        var result = LoggingHelper.Sanitize(string.Empty);

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public void Sanitize_String_TrimsWhitespace()
    {
        // Arrange
        var input = "  Test with spaces  ";

        // Act
        var result = LoggingHelper.Sanitize(input);

        // Assert
        result.Should().Be("Test with spaces");
    }

    [Fact]
    public void Sanitize_Guid_ReturnsStringRepresentation()
    {
        // Arrange
        var guid = Guid.NewGuid();

        // Act
        var result = LoggingHelper.Sanitize(guid);

        // Assert
        result.Should().Be(guid.ToString());
    }

    [Fact]
    public void Sanitize_Object_HandlesNull()
    {
        // Act
        var result = LoggingHelper.Sanitize((object?)null);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void Sanitize_Object_ConvertsToStringAndSanitizes()
    {
        // Arrange
        var obj = new { Name = "Test\nObject" };

        // Act
        var result = LoggingHelper.Sanitize(obj);

        // Assert
        result.Should().NotContain("\n");
    }

    [Theory]
    [InlineData("Line1\nLine2", "Line1 Line2")]
    [InlineData("Line1\rLine2", "Line1 Line2")]
    [InlineData("Line1\r\nLine2", "Line1 Line2")]
    [InlineData("Tab1\tTab2", "Tab1 Tab2")]
    [InlineData("Multiple\n\r\tspaces", "Multiple spaces")]
    public void Sanitize_String_HandlesVariousControlCharacters(string input, string expected)
    {
        // Act
        var result = LoggingHelper.Sanitize(input);

        // Assert
        result.Should().Be(expected);
    }

    [Fact]
    public void CreateSafeLogMessage_SanitizesAllArguments()
    {
        // Arrange
        var template = "User {0} performed action {1} on {2}";
        var args = new object?[] { "test\nuser", "create\rapplication", "2024-01-01\t12:00" };

        // Act
        var result = LoggingHelper.CreateSafeLogMessage(template, args);

        // Assert
        result.Should().Be("User test user performed action create application on 2024-01-01 12:00");
    }

    [Fact]
    public void CreateSafeLogMessage_HandlesNullArguments()
    {
        // Arrange
        var template = "Value1: {0}, Value2: {1}";
        var args = new object?[] { null, "test" };

        // Act
        var result = LoggingHelper.CreateSafeLogMessage(template, args);

        // Assert
        result.Should().Be("Value1: , Value2: test");
    }
}