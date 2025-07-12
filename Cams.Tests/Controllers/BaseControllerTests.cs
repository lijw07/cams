using Xunit;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using cams.Backend.Controller;
using Microsoft.AspNetCore.Http;

namespace Cams.Tests.Controllers
{
    public class BaseControllerTests
    {
        // Concrete implementation of BaseController for testing
        private class TestController : BaseController
        {
            public IActionResult? TestValidateModelState() => ValidateModelState();
            public IActionResult? TestValidateModelStateSimple() => ValidateModelStateSimple();
        }

        private readonly TestController _controller;

        public BaseControllerTests()
        {
            _controller = new TestController();
            
            // Initialize ControllerContext for ModelState testing
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };
        }

        #region ValidateModelState Tests

        [Fact]
        public void ValidateModelState_WithValidModelState_ReturnsNull()
        {
            // Arrange - ModelState is valid by default

            // Act
            var result = _controller.TestValidateModelState();

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public void ValidateModelState_WithInvalidModelState_ReturnsBadRequestWithValidationErrors()
        {
            // Arrange
            _controller.ModelState.AddModelError("Name", "Name is required");
            _controller.ModelState.AddModelError("Email", "Invalid email format");

            // Act
            var result = _controller.TestValidateModelState();

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<BadRequestObjectResult>();
            
            var badRequestResult = result as BadRequestObjectResult;
            badRequestResult!.StatusCode.Should().Be(400);
            
            // Verify the response structure
            var value = badRequestResult.Value;
            value.Should().NotBeNull();
            
            // Check if it has the expected properties using reflection
            var messageProperty = value!.GetType().GetProperty("message");
            var errorsProperty = value.GetType().GetProperty("errors");
            
            messageProperty.Should().NotBeNull();
            errorsProperty.Should().NotBeNull();
            
            var message = messageProperty!.GetValue(value) as string;
            var errors = errorsProperty!.GetValue(value) as IDictionary<string, string[]>;
            
            message.Should().Be("Validation failed");
            errors.Should().NotBeNull();
            errors.Should().HaveCount(2);
            errors.Should().ContainKey("Name");
            errors.Should().ContainKey("Email");
            errors!["Name"].Should().Contain("Name is required");
            errors["Email"].Should().Contain("Invalid email format");
        }

        [Fact]
        public void ValidateModelState_WithMultipleErrorsPerField_ReturnsAllErrors()
        {
            // Arrange
            _controller.ModelState.AddModelError("Password", "Password is required");
            _controller.ModelState.AddModelError("Password", "Password must be at least 8 characters");
            _controller.ModelState.AddModelError("Password", "Password must contain uppercase letter");

            // Act
            var result = _controller.TestValidateModelState();

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<BadRequestObjectResult>();
            
            var badRequestResult = result as BadRequestObjectResult;
            var value = badRequestResult!.Value;
            var errorsProperty = value!.GetType().GetProperty("errors");
            var errors = errorsProperty!.GetValue(value) as IDictionary<string, string[]>;
            
            errors.Should().NotBeNull();
            errors.Should().HaveCount(1);
            errors.Should().ContainKey("Password");
            errors!["Password"].Should().HaveCount(3);
            errors["Password"].Should().Contain("Password is required");
            errors["Password"].Should().Contain("Password must be at least 8 characters");
            errors["Password"].Should().Contain("Password must contain uppercase letter");
        }

        [Fact]
        public void ValidateModelState_WithEmptyErrorMessage_IncludesEmptyString()
        {
            // Arrange
            _controller.ModelState.AddModelError("Field", "");

            // Act
            var result = _controller.TestValidateModelState();

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<BadRequestObjectResult>();
            
            var badRequestResult = result as BadRequestObjectResult;
            var value = badRequestResult!.Value;
            var errorsProperty = value!.GetType().GetProperty("errors");
            var errors = errorsProperty!.GetValue(value) as IDictionary<string, string[]>;
            
            errors.Should().NotBeNull();
            errors.Should().ContainKey("Field");
            errors!["Field"].Should().Contain("");
        }

        [Fact]
        public void ValidateModelState_WithFieldsHavingNoErrors_ExcludesThoseFields()
        {
            // Arrange
            _controller.ModelState.AddModelError("ValidField", "Error message");
            
            // Add a field with no errors by setting a value without errors
            _controller.ModelState.SetModelValue("FieldWithNoErrors", 
                new ValueProviderResult("value"));

            // Act
            var result = _controller.TestValidateModelState();

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<BadRequestObjectResult>();
            
            var badRequestResult = result as BadRequestObjectResult;
            var value = badRequestResult!.Value;
            var errorsProperty = value!.GetType().GetProperty("errors");
            var errors = errorsProperty!.GetValue(value) as IDictionary<string, string[]>;
            
            errors.Should().NotBeNull();
            errors.Should().HaveCount(1);
            errors.Should().ContainKey("ValidField");
            errors.Should().NotContainKey("FieldWithNoErrors");
        }

        [Fact]
        public void ValidateModelState_WithComplexFieldNames_PreservesFieldNames()
        {
            // Arrange
            _controller.ModelState.AddModelError("User.Profile.FirstName", "First name is required");
            _controller.ModelState.AddModelError("Items[0].Name", "Item name is required");
            _controller.ModelState.AddModelError("Settings.Email.Address", "Invalid email address");

            // Act
            var result = _controller.TestValidateModelState();

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<BadRequestObjectResult>();
            
            var badRequestResult = result as BadRequestObjectResult;
            var value = badRequestResult!.Value;
            var errorsProperty = value!.GetType().GetProperty("errors");
            var errors = errorsProperty!.GetValue(value) as IDictionary<string, string[]>;
            
            errors.Should().NotBeNull();
            errors.Should().HaveCount(3);
            errors.Should().ContainKey("User.Profile.FirstName");
            errors.Should().ContainKey("Items[0].Name");
            errors.Should().ContainKey("Settings.Email.Address");
        }

        #endregion

        #region ValidateModelStateSimple Tests

        [Fact]
        public void ValidateModelStateSimple_WithValidModelState_ReturnsNull()
        {
            // Arrange - ModelState is valid by default

            // Act
            var result = _controller.TestValidateModelStateSimple();

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public void ValidateModelStateSimple_WithInvalidModelState_ReturnsBadRequestWithModelState()
        {
            // Arrange
            _controller.ModelState.AddModelError("Name", "Name is required");
            _controller.ModelState.AddModelError("Email", "Invalid email format");

            // Act
            var result = _controller.TestValidateModelStateSimple();

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<BadRequestObjectResult>();
            
            var badRequestResult = result as BadRequestObjectResult;
            badRequestResult!.StatusCode.Should().Be(400);
            badRequestResult.Value.Should().BeOfType<SerializableError>();
            
            var serializableError = badRequestResult.Value as SerializableError;
            serializableError.Should().NotBeNull();
            serializableError.Should().ContainKey("Name");
            serializableError.Should().ContainKey("Email");
        }

        [Fact]
        public void ValidateModelStateSimple_WithMultipleErrors_ReturnsBadRequestWithAllErrors()
        {
            // Arrange
            _controller.ModelState.AddModelError("Field1", "Error 1");
            _controller.ModelState.AddModelError("Field1", "Error 2");
            _controller.ModelState.AddModelError("Field2", "Error 3");

            // Act
            var result = _controller.TestValidateModelStateSimple();

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<BadRequestObjectResult>();
            
            var badRequestResult = result as BadRequestObjectResult;
            var serializableError = badRequestResult!.Value as SerializableError;
            
            serializableError.Should().NotBeNull();
            serializableError.Should().ContainKey("Field1");
            serializableError.Should().ContainKey("Field2");
            
            // SerializableError contains the error messages as arrays
            var field1Errors = serializableError!["Field1"] as string[];
            var field2Errors = serializableError["Field2"] as string[];
            
            field1Errors.Should().HaveCount(2);
            field2Errors.Should().HaveCount(1);
        }

        #endregion

        #region Integration and Comparison Tests

        [Fact]
        public void BothValidationMethods_WithValidModelState_ReturnNull()
        {
            // Arrange - ModelState is valid by default

            // Act
            var result1 = _controller.TestValidateModelState();
            var result2 = _controller.TestValidateModelStateSimple();

            // Assert
            result1.Should().BeNull();
            result2.Should().BeNull();
        }

        [Fact]
        public void BothValidationMethods_WithInvalidModelState_ReturnBadRequest()
        {
            // Arrange
            _controller.ModelState.AddModelError("TestField", "Test error");

            // Act
            var result1 = _controller.TestValidateModelState();
            var result2 = _controller.TestValidateModelStateSimple();

            // Assert
            result1.Should().NotBeNull();
            result1.Should().BeOfType<BadRequestObjectResult>();
            
            result2.Should().NotBeNull();
            result2.Should().BeOfType<BadRequestObjectResult>();
            
            // Both should return 400 status
            ((BadRequestObjectResult)result1!).StatusCode.Should().Be(400);
            ((BadRequestObjectResult)result2!).StatusCode.Should().Be(400);
        }

        [Fact]
        public void ValidationMethods_ReturnDifferentValueTypes()
        {
            // Arrange
            _controller.ModelState.AddModelError("TestField", "Test error");

            // Act
            var result1 = _controller.TestValidateModelState();
            var result2 = _controller.TestValidateModelStateSimple();

            // Assert
            var badRequest1 = result1 as BadRequestObjectResult;
            var badRequest2 = result2 as BadRequestObjectResult;
            
            // ValidateModelState returns structured validation error
            badRequest1!.Value.Should().NotBeOfType<ModelStateDictionary>();
            var value1 = badRequest1.Value;
            value1!.GetType().GetProperty("message").Should().NotBeNull();
            value1.GetType().GetProperty("errors").Should().NotBeNull();
            
            // ValidateModelStateSimple returns SerializableError
            badRequest2!.Value.Should().BeOfType<SerializableError>();
        }

        #endregion

        #region Edge Cases

        [Fact]
        public void ValidateModelState_WithNullModelStateEntry_HandlesGracefully()
        {
            // Arrange
            _controller.ModelState.AddModelError("TestField", "Test error");
            
            // Clear the errors to simulate a null scenario
            _controller.ModelState.Clear();
            _controller.ModelState.AddModelError("TestField", "Test error");

            // Act
            var result = _controller.TestValidateModelState();

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Fact]
        public void ValidateModelState_WithEmptyModelStateKey_HandlesCorrectly()
        {
            // Arrange
            _controller.ModelState.AddModelError("", "General error");

            // Act
            var result = _controller.TestValidateModelState();

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<BadRequestObjectResult>();
            
            var badRequestResult = result as BadRequestObjectResult;
            var value = badRequestResult!.Value;
            var errorsProperty = value!.GetType().GetProperty("errors");
            var errors = errorsProperty!.GetValue(value) as IDictionary<string, string[]>;
            
            errors.Should().NotBeNull();
            errors.Should().ContainKey("");
            errors![""].Should().Contain("General error");
        }

        [Fact]
        public void ValidateModelState_Performance_WithManyErrors_CompletesQuickly()
        {
            // Arrange
            for (int i = 0; i < 100; i++)
            {
                _controller.ModelState.AddModelError($"Field{i}", $"Error message {i}");
            }

            // Act
            var startTime = DateTime.UtcNow;
            var result = _controller.TestValidateModelState();
            var endTime = DateTime.UtcNow;

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<BadRequestObjectResult>();
            
            var duration = endTime - startTime;
            duration.Should().BeLessThan(TimeSpan.FromSeconds(1), "validation should be fast even with many errors");
            
            var badRequestResult = result as BadRequestObjectResult;
            var value = badRequestResult!.Value;
            var errorsProperty = value!.GetType().GetProperty("errors");
            var errors = errorsProperty!.GetValue(value) as IDictionary<string, string[]>;
            
            errors.Should().NotBeNull();
            errors.Should().HaveCount(100);
        }

        #endregion
    }
}