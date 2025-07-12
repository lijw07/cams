using Xunit;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using cams.Backend.Helpers;
using System.Collections.Generic;
using System.Reflection;

namespace Cams.Tests.Helpers
{
    public class HttpResponseHelperTests
    {
        #region Helper Methods

        private static string? GetMessageFromResult(IActionResult result)
        {
            var objectResult = result as ObjectResult;
            if (objectResult?.Value == null) return null;
            
            var messageProperty = objectResult.Value.GetType().GetProperty("message");
            return messageProperty?.GetValue(objectResult.Value) as string;
        }

        private static T? GetPropertyFromResult<T>(IActionResult result, string propertyName)
        {
            var objectResult = result as ObjectResult;
            if (objectResult?.Value == null) return default(T);
            
            var property = objectResult.Value.GetType().GetProperty(propertyName);
            var value = property?.GetValue(objectResult.Value);
            return value is T ? (T)value : default(T);
        }

        #endregion

        #region CreateErrorResponse Tests

        [Fact]
        public void CreateErrorResponse_WithDefaultStatusCode_ReturnsObjectResultWith500()
        {
            // Arrange
            var message = "Internal server error occurred";

            // Act
            var result = HttpResponseHelper.CreateErrorResponse(message);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<ObjectResult>();
            result.StatusCode.Should().Be(500);
            GetMessageFromResult(result).Should().Be(message);
        }

        [Theory]
        [InlineData(400, "Bad request")]
        [InlineData(401, "Unauthorized")]
        [InlineData(403, "Forbidden")]
        [InlineData(404, "Not found")]
        [InlineData(409, "Conflict")]
        [InlineData(422, "Unprocessable entity")]
        [InlineData(500, "Internal server error")]
        [InlineData(503, "Service unavailable")]
        public void CreateErrorResponse_WithSpecificStatusCode_ReturnsObjectResultWithCorrectStatusCode(int statusCode, string message)
        {
            // Act
            var result = HttpResponseHelper.CreateErrorResponse(message, statusCode);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<ObjectResult>();
            result.StatusCode.Should().Be(statusCode);
            GetMessageFromResult(result).Should().Be(message);
        }

        [Fact]
        public void CreateErrorResponse_WithEmptyMessage_ReturnsObjectResultWithEmptyMessage()
        {
            // Arrange
            var message = string.Empty;

            // Act
            var result = HttpResponseHelper.CreateErrorResponse(message);

            // Assert
            result.Should().NotBeNull();
            result.StatusCode.Should().Be(500);
            GetMessageFromResult(result).Should().Be(string.Empty);
        }

        [Fact]
        public void CreateErrorResponse_WithNullMessage_ReturnsObjectResultWithNullMessage()
        {
            // Arrange
            string message = null!;

            // Act
            var result = HttpResponseHelper.CreateErrorResponse(message);

            // Assert
            result.Should().NotBeNull();
            result.StatusCode.Should().Be(500);
            GetMessageFromResult(result).Should().BeNull();
        }

        [Fact]
        public void CreateErrorResponse_WithLongMessage_ReturnsObjectResultWithFullMessage()
        {
            // Arrange
            var longMessage = new string('A', 1000);

            // Act
            var result = HttpResponseHelper.CreateErrorResponse(longMessage);

            // Assert
            result.Should().NotBeNull();
            result.StatusCode.Should().Be(500);
            GetMessageFromResult(result).Should().Be(longMessage);
        }

        #endregion

        #region CreateSuccessResponse Tests

        [Fact]
        public void CreateSuccessResponse_WithDataOnly_ReturnsOkObjectResultWithData()
        {
            // Arrange
            var data = new { Id = 1, Name = "Test" };

            // Act
            var result = HttpResponseHelper.CreateSuccessResponse(data);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<OkObjectResult>();
            result.StatusCode.Should().Be(200);
            result.Value.Should().BeEquivalentTo(data);
        }

        [Fact]
        public void CreateSuccessResponse_WithDataAndMessage_ReturnsOkObjectResultWithDataAndMessage()
        {
            // Arrange
            var data = new { Id = 1, Name = "Test" };
            var message = "Operation completed successfully";

            // Act
            var result = HttpResponseHelper.CreateSuccessResponse(data, message);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<OkObjectResult>();
            result.StatusCode.Should().Be(200);
            
            GetPropertyFromResult<object>(result, "data").Should().BeEquivalentTo(data);
            GetMessageFromResult(result).Should().Be(message);
        }

        [Fact]
        public void CreateSuccessResponse_WithNullData_ReturnsOkObjectResultWithNull()
        {
            // Arrange
            object? data = null;

            // Act
            var result = HttpResponseHelper.CreateSuccessResponse(data);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<OkObjectResult>();
            result.StatusCode.Should().Be(200);
            result.Value.Should().BeNull();
        }

        [Fact]
        public void CreateSuccessResponse_WithNullMessage_ReturnsOkObjectResultWithDataOnly()
        {
            // Arrange
            var data = new { Id = 1, Name = "Test" };
            string? message = null;

            // Act
            var result = HttpResponseHelper.CreateSuccessResponse(data, message);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<OkObjectResult>();
            result.StatusCode.Should().Be(200);
            result.Value.Should().BeEquivalentTo(data);
        }

        [Fact]
        public void CreateSuccessResponse_WithEmptyMessage_ReturnsOkObjectResultWithDataAndEmptyMessage()
        {
            // Arrange
            var data = new { Id = 1, Name = "Test" };
            var message = string.Empty;

            // Act
            var result = HttpResponseHelper.CreateSuccessResponse(data, message);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<OkObjectResult>();
            result.StatusCode.Should().Be(200);
            
            GetPropertyFromResult<object>(result, "data").Should().BeEquivalentTo(data);
            GetMessageFromResult(result).Should().Be(string.Empty);
        }

        [Theory]
        [InlineData("string data")]
        [InlineData(42)]
        [InlineData(true)]
        [InlineData(3.14)]
        public void CreateSuccessResponse_WithPrimitiveTypes_ReturnsOkObjectResultWithCorrectData<T>(T data)
        {
            // Act
            var result = HttpResponseHelper.CreateSuccessResponse(data);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<OkObjectResult>();
            result.StatusCode.Should().Be(200);
            result.Value.Should().Be(data);
        }

        [Fact]
        public void CreateSuccessResponse_WithListData_ReturnsOkObjectResultWithList()
        {
            // Arrange
            var data = new List<int> { 1, 2, 3, 4, 5 };

            // Act
            var result = HttpResponseHelper.CreateSuccessResponse(data);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<OkObjectResult>();
            result.StatusCode.Should().Be(200);
            result.Value.Should().BeEquivalentTo(data);
        }

        #endregion

        #region CreateNotFoundResponse Tests

        [Fact]
        public void CreateNotFoundResponse_WithResourceName_ReturnsNotFoundObjectResultWithFormattedMessage()
        {
            // Arrange
            var resource = "User";

            // Act
            var result = HttpResponseHelper.CreateNotFoundResponse(resource);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<NotFoundObjectResult>();
            result.StatusCode.Should().Be(404);
            GetMessageFromResult(result).Should().Be("User not found");
        }

        [Theory]
        [InlineData("Application", "Application not found")]
        [InlineData("Database Connection", "Database Connection not found")]
        [InlineData("Role", "Role not found")]
        [InlineData("Schedule", "Schedule not found")]
        [InlineData("Log Entry", "Log Entry not found")]
        public void CreateNotFoundResponse_WithVariousResourceNames_ReturnsCorrectFormattedMessage(string resource, string expectedMessage)
        {
            // Act
            var result = HttpResponseHelper.CreateNotFoundResponse(resource);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<NotFoundObjectResult>();
            result.StatusCode.Should().Be(404);
            GetMessageFromResult(result).Should().Be(expectedMessage);
        }

        [Fact]
        public void CreateNotFoundResponse_WithEmptyResourceName_ReturnsNotFoundObjectResultWithEmptyResourceMessage()
        {
            // Arrange
            var resource = string.Empty;

            // Act
            var result = HttpResponseHelper.CreateNotFoundResponse(resource);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<NotFoundObjectResult>();
            result.StatusCode.Should().Be(404);
            GetMessageFromResult(result).Should().Be(" not found");
        }

        [Fact]
        public void CreateNotFoundResponse_WithNullResourceName_ReturnsNotFoundObjectResultWithNullResourceMessage()
        {
            // Arrange
            string resource = null!;

            // Act
            var result = HttpResponseHelper.CreateNotFoundResponse(resource);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<NotFoundObjectResult>();
            result.StatusCode.Should().Be(404);
            GetMessageFromResult(result).Should().Be(" not found");
        }

        #endregion

        #region CreateBadRequestResponse Tests

        [Fact]
        public void CreateBadRequestResponse_WithMessage_ReturnsBadRequestObjectResultWithMessage()
        {
            // Arrange
            var message = "Invalid request data";

            // Act
            var result = HttpResponseHelper.CreateBadRequestResponse(message);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<BadRequestObjectResult>();
            result.StatusCode.Should().Be(400);
            GetMessageFromResult(result).Should().Be(message);
        }

        [Theory]
        [InlineData("Missing required field")]
        [InlineData("Invalid email format")]
        [InlineData("Password too weak")]
        [InlineData("Duplicate entry")]
        [InlineData("Invalid data format")]
        public void CreateBadRequestResponse_WithVariousMessages_ReturnsBadRequestObjectResultWithCorrectMessage(string message)
        {
            // Act
            var result = HttpResponseHelper.CreateBadRequestResponse(message);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<BadRequestObjectResult>();
            result.StatusCode.Should().Be(400);
            GetMessageFromResult(result).Should().Be(message);
        }

        [Fact]
        public void CreateBadRequestResponse_WithEmptyMessage_ReturnsBadRequestObjectResultWithEmptyMessage()
        {
            // Arrange
            var message = string.Empty;

            // Act
            var result = HttpResponseHelper.CreateBadRequestResponse(message);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<BadRequestObjectResult>();
            result.StatusCode.Should().Be(400);
            GetMessageFromResult(result).Should().Be(string.Empty);
        }

        [Fact]
        public void CreateBadRequestResponse_WithNullMessage_ReturnsBadRequestObjectResultWithNullMessage()
        {
            // Arrange
            string message = null!;

            // Act
            var result = HttpResponseHelper.CreateBadRequestResponse(message);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<BadRequestObjectResult>();
            result.StatusCode.Should().Be(400);
            GetMessageFromResult(result).Should().BeNull();
        }

        #endregion

        #region CreateValidationErrorResponse Tests

        [Fact]
        public void CreateValidationErrorResponse_WithValidationErrors_ReturnsBadRequestObjectResultWithErrorsAndMessage()
        {
            // Arrange
            var errors = new Dictionary<string, string[]>
            {
                { "Name", new[] { "Name is required", "Name must be at least 3 characters" } },
                { "Email", new[] { "Invalid email format" } },
                { "Password", new[] { "Password is required", "Password must be at least 8 characters" } }
            };

            // Act
            var result = HttpResponseHelper.CreateValidationErrorResponse(errors);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<BadRequestObjectResult>();
            result.StatusCode.Should().Be(400);
            GetMessageFromResult(result).Should().Be("Validation failed");
            
            var resultErrors = GetPropertyFromResult<IDictionary<string, string[]>>(result, "errors");
            resultErrors.Should().NotBeNull();
            resultErrors.Should().BeEquivalentTo(errors);
        }

        [Fact]
        public void CreateValidationErrorResponse_WithEmptyErrors_ReturnsBadRequestObjectResultWithEmptyErrors()
        {
            // Arrange
            var errors = new Dictionary<string, string[]>();

            // Act
            var result = HttpResponseHelper.CreateValidationErrorResponse(errors);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<BadRequestObjectResult>();
            result.StatusCode.Should().Be(400);
            GetMessageFromResult(result).Should().Be("Validation failed");
            
            var resultErrors = GetPropertyFromResult<IDictionary<string, string[]>>(result, "errors");
            resultErrors.Should().NotBeNull();
            resultErrors.Should().BeEmpty();
        }

        [Fact]
        public void CreateValidationErrorResponse_WithSingleFieldError_ReturnsBadRequestObjectResultWithSingleError()
        {
            // Arrange
            var errors = new Dictionary<string, string[]>
            {
                { "Username", new[] { "Username already exists" } }
            };

            // Act
            var result = HttpResponseHelper.CreateValidationErrorResponse(errors);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<BadRequestObjectResult>();
            result.StatusCode.Should().Be(400);
            GetMessageFromResult(result).Should().Be("Validation failed");
            
            var resultErrors = GetPropertyFromResult<IDictionary<string, string[]>>(result, "errors");
            resultErrors.Should().NotBeNull();
            resultErrors.Should().HaveCount(1);
            resultErrors!["Username"].Should().BeEquivalentTo(new[] { "Username already exists" });
        }

        [Fact]
        public void CreateValidationErrorResponse_WithMultipleErrorsPerField_ReturnsBadRequestObjectResultWithAllErrors()
        {
            // Arrange
            var errors = new Dictionary<string, string[]>
            {
                { "Password", new[] { "Password is required", "Password must be at least 8 characters", "Password must contain uppercase letter", "Password must contain number" } }
            };

            // Act
            var result = HttpResponseHelper.CreateValidationErrorResponse(errors);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<BadRequestObjectResult>();
            result.StatusCode.Should().Be(400);
            GetMessageFromResult(result).Should().Be("Validation failed");
            
            var resultErrors = GetPropertyFromResult<IDictionary<string, string[]>>(result, "errors");
            resultErrors.Should().NotBeNull();
            resultErrors!["Password"].Should().HaveCount(4);
            resultErrors["Password"].Should().Contain("Password is required");
            resultErrors["Password"].Should().Contain("Password must be at least 8 characters");
            resultErrors["Password"].Should().Contain("Password must contain uppercase letter");
            resultErrors["Password"].Should().Contain("Password must contain number");
        }

        #endregion

        #region CreateUnauthorizedResponse Tests

        [Fact]
        public void CreateUnauthorizedResponse_WithDefaultMessage_ReturnsUnauthorizedObjectResultWithDefaultMessage()
        {
            // Act
            var result = HttpResponseHelper.CreateUnauthorizedResponse();

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<UnauthorizedObjectResult>();
            result.StatusCode.Should().Be(401);
            GetMessageFromResult(result).Should().Be("Unauthorized access");
        }

        [Fact]
        public void CreateUnauthorizedResponse_WithCustomMessage_ReturnsUnauthorizedObjectResultWithCustomMessage()
        {
            // Arrange
            var message = "Invalid credentials provided";

            // Act
            var result = HttpResponseHelper.CreateUnauthorizedResponse(message);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<UnauthorizedObjectResult>();
            result.StatusCode.Should().Be(401);
            GetMessageFromResult(result).Should().Be(message);
        }

        [Theory]
        [InlineData("Token expired")]
        [InlineData("Invalid token")]
        [InlineData("Insufficient permissions")]
        [InlineData("Account locked")]
        [InlineData("Session expired")]
        public void CreateUnauthorizedResponse_WithVariousMessages_ReturnsUnauthorizedObjectResultWithCorrectMessage(string message)
        {
            // Act
            var result = HttpResponseHelper.CreateUnauthorizedResponse(message);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<UnauthorizedObjectResult>();
            result.StatusCode.Should().Be(401);
            GetMessageFromResult(result).Should().Be(message);
        }

        [Fact]
        public void CreateUnauthorizedResponse_WithEmptyMessage_ReturnsUnauthorizedObjectResultWithEmptyMessage()
        {
            // Arrange
            var message = string.Empty;

            // Act
            var result = HttpResponseHelper.CreateUnauthorizedResponse(message);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<UnauthorizedObjectResult>();
            result.StatusCode.Should().Be(401);
            GetMessageFromResult(result).Should().Be(string.Empty);
        }

        [Fact]
        public void CreateUnauthorizedResponse_WithNullMessage_ReturnsUnauthorizedObjectResultWithNullMessage()
        {
            // Arrange
            string message = null!;

            // Act
            var result = HttpResponseHelper.CreateUnauthorizedResponse(message);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<UnauthorizedObjectResult>();
            result.StatusCode.Should().Be(401);
            GetMessageFromResult(result).Should().BeNull();
        }

        #endregion

        #region Integration and Consistency Tests

        [Fact]
        public void AllResponseMethods_ReturnCorrectStatusCodes()
        {
            // Act
            var errorResponse = HttpResponseHelper.CreateErrorResponse("Error", 500);
            var successResponse = HttpResponseHelper.CreateSuccessResponse("Success");
            var notFoundResponse = HttpResponseHelper.CreateNotFoundResponse("Resource");
            var badRequestResponse = HttpResponseHelper.CreateBadRequestResponse("Bad request");
            var validationErrorResponse = HttpResponseHelper.CreateValidationErrorResponse(new Dictionary<string, string[]>());
            var unauthorizedResponse = HttpResponseHelper.CreateUnauthorizedResponse();

            // Assert
            errorResponse.StatusCode.Should().Be(500);
            successResponse.StatusCode.Should().Be(200);
            notFoundResponse.StatusCode.Should().Be(404);
            badRequestResponse.StatusCode.Should().Be(400);
            validationErrorResponse.StatusCode.Should().Be(400);
            unauthorizedResponse.StatusCode.Should().Be(401);
        }

        [Fact]
        public void AllResponseMethods_ReturnCorrectResultTypes()
        {
            // Act
            var errorResponse = HttpResponseHelper.CreateErrorResponse("Error");
            var successResponse = HttpResponseHelper.CreateSuccessResponse("Success");
            var notFoundResponse = HttpResponseHelper.CreateNotFoundResponse("Resource");
            var badRequestResponse = HttpResponseHelper.CreateBadRequestResponse("Bad request");
            var validationErrorResponse = HttpResponseHelper.CreateValidationErrorResponse(new Dictionary<string, string[]>());
            var unauthorizedResponse = HttpResponseHelper.CreateUnauthorizedResponse();

            // Assert
            errorResponse.Should().BeOfType<ObjectResult>();
            successResponse.Should().BeOfType<OkObjectResult>();
            notFoundResponse.Should().BeOfType<NotFoundObjectResult>();
            badRequestResponse.Should().BeOfType<BadRequestObjectResult>();
            validationErrorResponse.Should().BeOfType<BadRequestObjectResult>();
            unauthorizedResponse.Should().BeOfType<UnauthorizedObjectResult>();
        }

        [Fact]
        public void AllResponseMethods_ContainMessageProperty()
        {
            // Act
            var errorResponse = HttpResponseHelper.CreateErrorResponse("Error message");
            var notFoundResponse = HttpResponseHelper.CreateNotFoundResponse("Resource");
            var badRequestResponse = HttpResponseHelper.CreateBadRequestResponse("Bad request message");
            var validationErrorResponse = HttpResponseHelper.CreateValidationErrorResponse(new Dictionary<string, string[]>());
            var unauthorizedResponse = HttpResponseHelper.CreateUnauthorizedResponse("Unauthorized message");

            // Assert
            GetMessageFromResult(errorResponse).Should().Be("Error message");
            GetMessageFromResult(notFoundResponse).Should().Be("Resource not found");
            GetMessageFromResult(badRequestResponse).Should().Be("Bad request message");
            GetMessageFromResult(validationErrorResponse).Should().Be("Validation failed");
            GetMessageFromResult(unauthorizedResponse).Should().Be("Unauthorized message");
        }

        #endregion
    }
}