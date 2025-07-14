using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Http;
using cams.Backend.Extensions;

namespace cams.Backend.Tests.Extensions
{
    // Test controller that we can control User property
    public class TestController : ControllerBase
    {
        public void SetUser(ClaimsPrincipal user)
        {
            var httpContext = new DefaultHttpContext { User = user };
            ControllerContext = new ControllerContext { HttpContext = httpContext };
        }
    }

    public class ControllerExtensionsTests
    {
        private readonly TestController _controller;
        private readonly ModelStateDictionary _modelState;

        public ControllerExtensionsTests()
        {
            _controller = new TestController();
            _modelState = new ModelStateDictionary();
        }

        [Fact]
        public void CreateValidationErrorResponse_Should_Return_BadRequest_With_Validation_Errors()
        {
            // Arrange
            _modelState.AddModelError("Name", "Name is required");
            _modelState.AddModelError("Email", "Email is invalid");
            _modelState.AddModelError("Email", "Email is required"); // Multiple errors for same field

            // Act
            var result = _controller.CreateValidationErrorResponse(_modelState);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<BadRequestObjectResult>();
            
            var badRequestResult = result as BadRequestObjectResult;
            badRequestResult.Should().NotBeNull();
            badRequestResult!.StatusCode.Should().Be(400);
            
            var responseValue = badRequestResult.Value;
            responseValue.Should().NotBeNull();
            
            // Check the response structure
            var responseType = responseValue!.GetType();
            var messageProperty = responseType.GetProperty("message");
            var errorsProperty = responseType.GetProperty("errors");
            
            messageProperty.Should().NotBeNull();
            errorsProperty.Should().NotBeNull();
            
            var message = messageProperty!.GetValue(responseValue) as string;
            var errors = errorsProperty!.GetValue(responseValue) as IDictionary<string, string[]>;
            
            message.Should().Be("Validation failed");
            errors.Should().NotBeNull();
            errors.Should().HaveCount(2);
            errors.Should().ContainKey("Name");
            errors.Should().ContainKey("Email");
            errors!["Name"].Should().Contain("Name is required");
            errors["Email"].Should().Contain("Email is invalid");
            errors["Email"].Should().Contain("Email is required");
        }

        [Fact]
        public void CreateValidationErrorResponse_Should_Handle_Empty_ModelState()
        {
            // Arrange
            // ModelState is empty by default

            // Act
            var result = _controller.CreateValidationErrorResponse(_modelState);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<BadRequestObjectResult>();
            
            var badRequestResult = result as BadRequestObjectResult;
            badRequestResult.Should().NotBeNull();
            
            var responseValue = badRequestResult!.Value;
            var responseType = responseValue!.GetType();
            var errorsProperty = responseType.GetProperty("errors");
            var errors = errorsProperty!.GetValue(responseValue) as IDictionary<string, string[]>;
            
            errors.Should().NotBeNull();
            errors.Should().BeEmpty();
        }

        [Fact]
        public void CreateValidationErrorResponse_Should_Handle_ModelState_With_No_Errors()
        {
            // Arrange
            _modelState.SetModelValue("Name", new ValueProviderResult("Valid Name"));
            _modelState.SetModelValue("Email", new ValueProviderResult("valid@email.com"));

            // Act
            var result = _controller.CreateValidationErrorResponse(_modelState);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<BadRequestObjectResult>();
            
            var badRequestResult = result as BadRequestObjectResult;
            var responseValue = badRequestResult!.Value;
            var responseType = responseValue!.GetType();
            var errorsProperty = responseType.GetProperty("errors");
            var errors = errorsProperty!.GetValue(responseValue) as IDictionary<string, string[]>;
            
            errors.Should().NotBeNull();
            errors.Should().BeEmpty();
        }

        [Fact]
        public void CreateValidationErrorResponse_Should_Handle_Multiple_Errors_Per_Field()
        {
            // Arrange
            _modelState.AddModelError("Password", "Password is required");
            _modelState.AddModelError("Password", "Password must be at least 8 characters");
            _modelState.AddModelError("Password", "Password must contain uppercase letter");

            // Act
            var result = _controller.CreateValidationErrorResponse(_modelState);

            // Assert
            var badRequestResult = result as BadRequestObjectResult;
            var responseValue = badRequestResult!.Value;
            var responseType = responseValue!.GetType();
            var errorsProperty = responseType.GetProperty("errors");
            var errors = errorsProperty!.GetValue(responseValue) as IDictionary<string, string[]>;
            
            errors.Should().ContainKey("Password");
            errors!["Password"].Should().HaveCount(3);
            errors["Password"].Should().Contain("Password is required");
            errors["Password"].Should().Contain("Password must be at least 8 characters");
            errors["Password"].Should().Contain("Password must contain uppercase letter");
        }

        [Fact]
        public void GetCurrentUserId_Should_Return_UserId_From_Claims()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Name, "testuser")
            };
            var identity = new ClaimsIdentity(claims, "test");
            var principal = new ClaimsPrincipal(identity);
            
            _controller.SetUser(principal);

            // Act
            var result = _controller.GetCurrentUserId();

            // Assert
            result.Should().Be(userId);
        }

        [Fact]
        public void GetCurrentUserId_Should_Throw_When_UserId_Claim_Not_Found()
        {
            // Arrange
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, "testuser")
                // No NameIdentifier claim
            };
            var identity = new ClaimsIdentity(claims, "test");
            var principal = new ClaimsPrincipal(identity);
            
            _controller.SetUser(principal);

            // Act & Assert
            var action = () => _controller.GetCurrentUserId();
            action.Should().Throw<UnauthorizedAccessException>()
                .WithMessage("User ID not found in token");
        }

        [Fact]
        public void GetCurrentUserId_Should_Throw_When_UserId_Is_Invalid_Guid()
        {
            // Arrange
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, "invalid-guid"),
                new Claim(ClaimTypes.Name, "testuser")
            };
            var identity = new ClaimsIdentity(claims, "test");
            var principal = new ClaimsPrincipal(identity);
            
            _controller.SetUser(principal);

            // Act & Assert
            var action = () => _controller.GetCurrentUserId();
            action.Should().Throw<UnauthorizedAccessException>()
                .WithMessage("User ID not found in token");
        }

        [Fact]
        public void GetCurrentUserId_Should_Throw_When_UserId_Is_Empty_String()
        {
            // Arrange
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, ""),
                new Claim(ClaimTypes.Name, "testuser")
            };
            var identity = new ClaimsIdentity(claims, "test");
            var principal = new ClaimsPrincipal(identity);
            
            _controller.SetUser(principal);

            // Act & Assert
            var action = () => _controller.GetCurrentUserId();
            action.Should().Throw<UnauthorizedAccessException>()
                .WithMessage("User ID not found in token");
        }

        [Fact]
        public void GetCurrentUsername_Should_Return_Username_From_Claims()
        {
            // Arrange
            var username = "testuser";
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Name, username)
            };
            var identity = new ClaimsIdentity(claims, "test");
            var principal = new ClaimsPrincipal(identity);
            
            _controller.SetUser(principal);

            // Act
            var result = _controller.GetCurrentUsername();

            // Assert
            result.Should().Be(username);
        }

        [Fact]
        public void GetCurrentUsername_Should_Return_Null_When_Username_Claim_Not_Found()
        {
            // Arrange
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString())
                // No Name claim
            };
            var identity = new ClaimsIdentity(claims, "test");
            var principal = new ClaimsPrincipal(identity);
            
            _controller.SetUser(principal);

            // Act
            var result = _controller.GetCurrentUsername();

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public void GetCurrentUsername_Should_Return_Null_When_No_Claims()
        {
            // Arrange
            var identity = new ClaimsIdentity(); // No claims
            var principal = new ClaimsPrincipal(identity);
            
            _controller.SetUser(principal);

            // Act
            var result = _controller.GetCurrentUsername();

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public void CreateValidationErrorResponse_Should_Handle_Fields_With_Only_Errors()
        {
            // Arrange
            _modelState.AddModelError("TestField", "Test error");
            _modelState.AddModelError("AnotherField", "Another error");

            // Act
            var result = _controller.CreateValidationErrorResponse(_modelState);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<BadRequestObjectResult>();
            
            var badRequestResult = result as BadRequestObjectResult;
            var responseValue = badRequestResult!.Value;
            var responseType = responseValue!.GetType();
            var errorsProperty = responseType.GetProperty("errors");
            var errors = errorsProperty!.GetValue(responseValue) as IDictionary<string, string[]>;
            
            errors.Should().NotBeNull();
            errors.Should().HaveCount(2);
            errors.Should().ContainKey("TestField");
            errors.Should().ContainKey("AnotherField");
        }

        [Theory]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData("not-a-guid")]
        [InlineData("12345")]
        public void GetCurrentUserId_Should_Throw_For_Invalid_Guid_Values(string invalidGuid)
        {
            // Arrange
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, invalidGuid),
                new Claim(ClaimTypes.Name, "testuser")
            };
            var identity = new ClaimsIdentity(claims, "test");
            var principal = new ClaimsPrincipal(identity);
            
            _controller.SetUser(principal);

            // Act & Assert
            var action = () => _controller.GetCurrentUserId();
            action.Should().Throw<UnauthorizedAccessException>()
                .WithMessage("User ID not found in token");
        }

        [Theory]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData("testuser")]
        [InlineData("admin")]
        public void GetCurrentUsername_Should_Return_Expected_Values(string username)
        {
            // Arrange
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Name, username)
            };
            var identity = new ClaimsIdentity(claims, "test");
            var principal = new ClaimsPrincipal(identity);
            
            _controller.SetUser(principal);

            // Act
            var result = _controller.GetCurrentUsername();

            // Assert
            result.Should().Be(username);
        }

        [Fact]
        public void CreateValidationErrorResponse_Should_Preserve_Error_Order()
        {
            // Arrange
            _modelState.AddModelError("Field1", "First error");
            _modelState.AddModelError("Field1", "Second error");
            _modelState.AddModelError("Field1", "Third error");

            // Act
            var result = _controller.CreateValidationErrorResponse(_modelState);

            // Assert
            var badRequestResult = result as BadRequestObjectResult;
            var responseValue = badRequestResult!.Value;
            var responseType = responseValue!.GetType();
            var errorsProperty = responseType.GetProperty("errors");
            var errors = errorsProperty!.GetValue(responseValue) as IDictionary<string, string[]>;
            
            errors!["Field1"].Should().HaveCount(3);
            errors["Field1"][0].Should().Be("First error");
            errors["Field1"][1].Should().Be("Second error");
            errors["Field1"][2].Should().Be("Third error");
        }

        [Fact]
        public void GetCurrentUserId_Should_Handle_Valid_Guid_Formats()
        {
            // Arrange
            var testCases = new[]
            {
                Guid.NewGuid(),
                Guid.Empty,
                new Guid("12345678-1234-1234-1234-123456789012")
            };

            foreach (var expectedGuid in testCases)
            {
                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, expectedGuid.ToString()),
                    new Claim(ClaimTypes.Name, "testuser")
                };
                var identity = new ClaimsIdentity(claims, "test");
                var principal = new ClaimsPrincipal(identity);
                
                _controller.SetUser(principal);

                // Act
                var result = _controller.GetCurrentUserId();

                // Assert
                result.Should().Be(expectedGuid);
            }
        }
    }
}