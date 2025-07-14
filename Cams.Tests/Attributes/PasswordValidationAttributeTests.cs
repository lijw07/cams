using System.ComponentModel.DataAnnotations;
using Xunit;
using FluentAssertions;
using cams.Backend.Attributes;

namespace cams.Backend.Tests.Attributes
{
    public class PasswordValidationAttributeTests
    {
        private readonly PasswordValidationAttribute _attribute;
        private readonly ValidationContext _validationContext;

        public PasswordValidationAttributeTests()
        {
            _attribute = new PasswordValidationAttribute();
            _validationContext = new ValidationContext(new object());
        }

        [Fact]
        public void IsValid_Should_Return_Success_For_Null_Value()
        {
            // Act
            var result = _attribute.GetValidationResult(null, _validationContext);

            // Assert
            result.Should().Be(ValidationResult.Success);
        }

        [Fact]
        public void IsValid_Should_Return_Success_For_Empty_String()
        {
            // Act
            var result = _attribute.GetValidationResult("", _validationContext);

            // Assert
            result.Should().Be(ValidationResult.Success);
        }

        [Fact]
        public void IsValid_Should_Return_Success_For_Valid_Password()
        {
            // Arrange
            var validPassword = "Password123!";

            // Act
            var result = _attribute.GetValidationResult(validPassword, _validationContext);

            // Assert
            result.Should().Be(ValidationResult.Success);
        }

        [Theory]
        [InlineData("Password123@")]
        [InlineData("MyP@ssw0rd")]
        [InlineData("Complex1$")]
        [InlineData("Test123!@#")]
        [InlineData("Admin2024*")]
        public void IsValid_Should_Return_Success_For_Valid_Passwords(string validPassword)
        {
            // Act
            var result = _attribute.GetValidationResult(validPassword, _validationContext);

            // Assert
            result.Should().Be(ValidationResult.Success);
        }

        [Fact]
        public void IsValid_Should_Fail_For_Password_Too_Short()
        {
            // Arrange
            var shortPassword = "Pass1!";

            // Act
            var result = _attribute.GetValidationResult(shortPassword, _validationContext);

            // Assert
            result.Should().NotBe(ValidationResult.Success);
            result!.ErrorMessage.Should().Contain("at least 8 characters");
        }

        [Fact]
        public void IsValid_Should_Fail_For_Password_Without_Uppercase()
        {
            // Arrange
            var passwordWithoutUppercase = "password123!";

            // Act
            var result = _attribute.GetValidationResult(passwordWithoutUppercase, _validationContext);

            // Assert
            result.Should().NotBe(ValidationResult.Success);
            result!.ErrorMessage.Should().Contain("at least one uppercase letter");
        }

        [Fact]
        public void IsValid_Should_Fail_For_Password_Without_Lowercase()
        {
            // Arrange
            var passwordWithoutLowercase = "PASSWORD123!";

            // Act
            var result = _attribute.GetValidationResult(passwordWithoutLowercase, _validationContext);

            // Assert
            result.Should().NotBe(ValidationResult.Success);
            result!.ErrorMessage.Should().Contain("at least one lowercase letter");
        }

        [Fact]
        public void IsValid_Should_Fail_For_Password_Without_Digit()
        {
            // Arrange
            var passwordWithoutDigit = "Password!";

            // Act
            var result = _attribute.GetValidationResult(passwordWithoutDigit, _validationContext);

            // Assert
            result.Should().NotBe(ValidationResult.Success);
            result!.ErrorMessage.Should().Contain("at least one digit");
        }

        [Fact]
        public void IsValid_Should_Fail_For_Password_Without_Special_Character()
        {
            // Arrange
            var passwordWithoutSpecial = "Password123";

            // Act
            var result = _attribute.GetValidationResult(passwordWithoutSpecial, _validationContext);

            // Assert
            result.Should().NotBe(ValidationResult.Success);
            result!.ErrorMessage.Should().Contain("at least one special character (@$!%*?&)");
        }

        [Fact]
        public void IsValid_Should_Fail_For_Password_Missing_Multiple_Requirements()
        {
            // Arrange
            var weakPassword = "pass";

            // Act
            var result = _attribute.GetValidationResult(weakPassword, _validationContext);

            // Assert
            result.Should().NotBe(ValidationResult.Success);
            result!.ErrorMessage.Should().Contain("Password must contain");
            result.ErrorMessage.Should().Contain("at least 8 characters");
            result.ErrorMessage.Should().Contain("at least one uppercase letter");
            result.ErrorMessage.Should().Contain("at least one digit");
            result.ErrorMessage.Should().Contain("at least one special character");
        }

        [Theory]
        [InlineData("@")]
        [InlineData("$")]
        [InlineData("!")]
        [InlineData("%")]
        [InlineData("*")]
        [InlineData("?")]
        [InlineData("&")]
        public void IsValid_Should_Accept_All_Valid_Special_Characters(string specialChar)
        {
            // Arrange
            var password = $"Password123{specialChar}";

            // Act
            var result = _attribute.GetValidationResult(password, _validationContext);

            // Assert
            result.Should().Be(ValidationResult.Success);
        }

        [Theory]
        [InlineData("#")]
        [InlineData("^")]
        [InlineData("(")]
        [InlineData(")")]
        [InlineData("+")]
        [InlineData("=")]
        [InlineData("[")]
        [InlineData("]")]
        public void IsValid_Should_Reject_Invalid_Special_Characters(string invalidSpecialChar)
        {
            // Arrange
            var password = $"Password123{invalidSpecialChar}";

            // Act
            var result = _attribute.GetValidationResult(password, _validationContext);

            // Assert
            result.Should().NotBe(ValidationResult.Success);
            result!.ErrorMessage.Should().Contain("at least one special character (@$!%*?&)");
        }

        [Fact]
        public void IsValid_Should_Accept_Password_With_Multiple_Special_Characters()
        {
            // Arrange
            var password = "Password123!@#$%*?&";

            // Act
            var result = _attribute.GetValidationResult(password, _validationContext);

            // Assert
            result.Should().Be(ValidationResult.Success);
        }

        [Fact]
        public void IsValid_Should_Accept_Long_Valid_Password()
        {
            // Arrange
            var longPassword = "ThisIsAVeryLongPasswordWithUppercaseLowercaseDigits123AndSpecialCharacters!@$";

            // Act
            var result = _attribute.GetValidationResult(longPassword, _validationContext);

            // Assert
            result.Should().Be(ValidationResult.Success);
        }

        [Fact]
        public void IsValid_Should_Handle_Whitespace_Password()
        {
            // Arrange
            var passwordWithSpaces = "   ";

            // Act
            var result = _attribute.GetValidationResult(passwordWithSpaces, _validationContext);

            // Assert
            result.Should().NotBe(ValidationResult.Success);
            result!.ErrorMessage.Should().Contain("Password must contain");
        }

        [Fact]
        public void IsValid_Should_Handle_Unicode_Characters()
        {
            // Arrange
            var passwordWithUnicode = "Pässwörd123!";

            // Act
            var result = _attribute.GetValidationResult(passwordWithUnicode, _validationContext);

            // Assert
            result.Should().Be(ValidationResult.Success);
        }

        [Theory]
        [InlineData("12345678")] // Only digits
        [InlineData("abcdefgh")] // Only lowercase
        [InlineData("ABCDEFGH")] // Only uppercase
        [InlineData("!@#$%*?&")] // Only special characters
        [InlineData("Password")] // Missing digit and special
        [InlineData("password!")] // Missing uppercase and digit
        [InlineData("PASSWORD1")] // Missing lowercase and special
        [InlineData("Pass1")] // Too short but has all character types
        public void IsValid_Should_Fail_For_Various_Invalid_Passwords(string invalidPassword)
        {
            // Act
            var result = _attribute.GetValidationResult(invalidPassword, _validationContext);

            // Assert
            result.Should().NotBe(ValidationResult.Success);
            result!.ErrorMessage.Should().Contain("Password must contain");
        }

        [Fact]
        public void IsValid_Should_Format_Error_Message_With_Comma_Separation()
        {
            // Arrange - Password missing uppercase and digit
            var password = "password!@#$";

            // Act
            var result = _attribute.GetValidationResult(password, _validationContext);

            // Assert
            result.Should().NotBe(ValidationResult.Success);
            result!.ErrorMessage.Should().StartWith("Password must contain ");
            result.ErrorMessage.Should().Contain(", ");
        }

        [Fact]
        public void IsValid_Should_Work_With_Non_String_Values()
        {
            // Arrange
            var nonStringValue = 12345;

            // Act
            var result = _attribute.GetValidationResult(nonStringValue, _validationContext);

            // Assert
            result.Should().Be(ValidationResult.Success); // Null string handling
        }

        [Fact]
        public void PasswordValidationAttribute_Should_Inherit_From_ValidationAttribute()
        {
            // Assert
            typeof(PasswordValidationAttribute).BaseType.Should().Be(typeof(ValidationAttribute));
        }

        [Fact]
        public void IsValid_Should_Use_Correct_Regex_Patterns()
        {
            // Arrange - Test each regex pattern individually
            var passwordMissingUppercase = "password123!";
            var passwordMissingLowercase = "PASSWORD123!";
            var passwordMissingDigit = "Password!";
            var passwordMissingSpecial = "Password123";

            // Act & Assert
            var result1 = _attribute.GetValidationResult(passwordMissingUppercase, _validationContext);
            result1!.ErrorMessage.Should().Contain("uppercase letter");

            var result2 = _attribute.GetValidationResult(passwordMissingLowercase, _validationContext);
            result2!.ErrorMessage.Should().Contain("lowercase letter");

            var result3 = _attribute.GetValidationResult(passwordMissingDigit, _validationContext);
            result3!.ErrorMessage.Should().Contain("digit");

            var result4 = _attribute.GetValidationResult(passwordMissingSpecial, _validationContext);
            result4!.ErrorMessage.Should().Contain("special character");
        }

        [Fact]
        public void IsValid_Should_Accept_Minimum_Valid_Password()
        {
            // Arrange - Exactly 8 characters with all requirements
            var minimalPassword = "Passw0rd!";

            // Act
            var result = _attribute.GetValidationResult(minimalPassword, _validationContext);

            // Assert
            result.Should().Be(ValidationResult.Success);
        }

        [Fact]
        public void IsValid_Should_Handle_Edge_Case_With_Seven_Characters()
        {
            // Arrange - 7 characters with all other requirements
            var sevenCharPassword = "Pass1!A";

            // Act
            var result = _attribute.GetValidationResult(sevenCharPassword, _validationContext);

            // Assert
            result.Should().NotBe(ValidationResult.Success);
            result!.ErrorMessage.Should().Contain("at least 8 characters");
            result.ErrorMessage.Should().NotContain("uppercase");
            result.ErrorMessage.Should().NotContain("lowercase");
            result.ErrorMessage.Should().NotContain("digit");
            result.ErrorMessage.Should().NotContain("special character");
        }
    }
}