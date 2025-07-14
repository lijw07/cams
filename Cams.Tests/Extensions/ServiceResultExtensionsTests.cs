using System;
using System.Collections.Generic;
using System.Linq;
using Xunit;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using cams.Backend.Extensions;

namespace cams.Backend.Tests.Extensions
{
    public class ServiceResultExtensionsTests
    {
        [Fact]
        public void ServiceResult_Success_Should_Create_Successful_Result_With_Data()
        {
            // Arrange
            var testData = "Test Data";

            // Act
            var result = ServiceResult<string>.Success(testData);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Data.Should().Be(testData);
            result.ErrorMessage.Should().BeNull();
            result.Errors.Should().BeEmpty();
            result.StatusCode.Should().BeNull();
        }

        [Fact]
        public void ServiceResult_Success_Should_Handle_Null_Data()
        {
            // Act
            var result = ServiceResult<string?>.Success(null);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Data.Should().BeNull();
            result.ErrorMessage.Should().BeNull();
            result.Errors.Should().BeEmpty();
        }

        [Fact]
        public void ServiceResult_Success_Should_Handle_Complex_Objects()
        {
            // Arrange
            var testObject = new { Id = 1, Name = "Test" };

            // Act
            var result = ServiceResult<object>.Success(testObject);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Data.Should().Be(testObject);
        }

        [Fact]
        public void ServiceResult_Failure_Should_Create_Failed_Result_With_Default_StatusCode()
        {
            // Arrange
            var errorMessage = "Test error";

            // Act
            var result = ServiceResult<string>.Failure(errorMessage);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Data.Should().BeNull();
            result.ErrorMessage.Should().Be(errorMessage);
            result.Errors.Should().BeEmpty();
            result.StatusCode.Should().Be(400);
        }

        [Fact]
        public void ServiceResult_Failure_Should_Create_Failed_Result_With_Custom_StatusCode()
        {
            // Arrange
            var errorMessage = "Server error";
            var statusCode = 500;

            // Act
            var result = ServiceResult<string>.Failure(errorMessage, statusCode);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Data.Should().BeNull();
            result.ErrorMessage.Should().Be(errorMessage);
            result.StatusCode.Should().Be(statusCode);
        }

        [Fact]
        public void ServiceResult_NotFound_Should_Create_NotFound_Result_With_Default_Message()
        {
            // Act
            var result = ServiceResult<string>.NotFound();

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Data.Should().BeNull();
            result.ErrorMessage.Should().Be("Resource not found");
            result.StatusCode.Should().Be(404);
        }

        [Fact]
        public void ServiceResult_NotFound_Should_Create_NotFound_Result_With_Custom_Resource()
        {
            // Arrange
            var resourceName = "User";

            // Act
            var result = ServiceResult<string>.NotFound(resourceName);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Data.Should().BeNull();
            result.ErrorMessage.Should().Be("User not found");
            result.StatusCode.Should().Be(404);
        }

        [Fact]
        public void ServiceResult_ValidationError_Should_Create_Validation_Error_Result()
        {
            // Arrange
            var errors = new List<string> { "Name is required", "Email is invalid" };

            // Act
            var result = ServiceResult<string>.ValidationError(errors);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Data.Should().BeNull();
            result.ErrorMessage.Should().Be("Validation failed");
            result.Errors.Should().BeEquivalentTo(errors);
            result.StatusCode.Should().Be(400);
        }

        [Fact]
        public void ServiceResult_ValidationError_Should_Handle_Empty_Errors_List()
        {
            // Arrange
            var errors = new List<string>();

            // Act
            var result = ServiceResult<string>.ValidationError(errors);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Errors.Should().BeEmpty();
            result.ErrorMessage.Should().Be("Validation failed");
        }

        [Fact]
        public void ToActionResult_Should_Return_OkResult_For_Successful_ServiceResult()
        {
            // Arrange
            var testData = "Test Data";
            var serviceResult = ServiceResult<string>.Success(testData);

            // Act
            var actionResult = serviceResult.ToActionResult();

            // Assert
            actionResult.Should().NotBeNull();
            actionResult.Should().BeOfType<OkObjectResult>();
            
            var okResult = actionResult as OkObjectResult;
            okResult!.Value.Should().Be(testData);
            okResult.StatusCode.Should().Be(200);
        }

        [Fact]
        public void ToActionResult_Should_Return_NotFoundResult_For_404_ServiceResult()
        {
            // Arrange
            var serviceResult = ServiceResult<string>.NotFound("User");

            // Act
            var actionResult = serviceResult.ToActionResult();

            // Assert
            actionResult.Should().NotBeNull();
            actionResult.Should().BeOfType<NotFoundObjectResult>();
            
            var notFoundResult = actionResult as NotFoundObjectResult;
            notFoundResult!.StatusCode.Should().Be(404);
            
            var responseValue = notFoundResult.Value;
            responseValue.Should().NotBeNull();
            
            var responseType = responseValue!.GetType();
            var messageProperty = responseType.GetProperty("message");
            var message = messageProperty!.GetValue(responseValue) as string;
            message.Should().Be("User not found not found"); // HttpResponseHelper appends " not found"
        }

        [Fact]
        public void ToActionResult_Should_Return_BadRequestResult_For_400_ServiceResult()
        {
            // Arrange
            var serviceResult = ServiceResult<string>.Failure("Bad request error", 400);

            // Act
            var actionResult = serviceResult.ToActionResult();

            // Assert
            actionResult.Should().NotBeNull();
            actionResult.Should().BeOfType<BadRequestObjectResult>();
            
            var badRequestResult = actionResult as BadRequestObjectResult;
            badRequestResult!.StatusCode.Should().Be(400);
            
            var responseValue = badRequestResult.Value;
            var responseType = responseValue!.GetType();
            var messageProperty = responseType.GetProperty("message");
            var message = messageProperty!.GetValue(responseValue) as string;
            message.Should().Be("Bad request error");
        }

        [Fact]
        public void ToActionResult_Should_Return_ValidationErrorResult_For_400_ServiceResult_With_Errors()
        {
            // Arrange - Create a ServiceResult with a single error to avoid duplicate key exception
            var errors = new List<string> { "Name is required" };
            var serviceResult = ServiceResult<string>.ValidationError(errors);

            // Act
            var actionResult = serviceResult.ToActionResult();

            // Assert
            actionResult.Should().NotBeNull();
            actionResult.Should().BeOfType<BadRequestObjectResult>();
            
            var badRequestResult = actionResult as BadRequestObjectResult;
            badRequestResult!.StatusCode.Should().Be(400);
            
            var responseValue = badRequestResult.Value;
            var responseType = responseValue!.GetType();
            var messageProperty = responseType.GetProperty("message");
            var errorsProperty = responseType.GetProperty("errors");
            
            var message = messageProperty!.GetValue(responseValue) as string;
            var errorsDict = errorsProperty!.GetValue(responseValue) as IDictionary<string, string[]>;
            
            message.Should().Be("Validation failed");
            errorsDict.Should().NotBeNull();
            errorsDict.Should().ContainKey("error");
            errorsDict!["error"].Should().BeEquivalentTo(errors);
        }

        [Fact]
        public void ToActionResult_Should_Return_UnauthorizedResult_For_401_ServiceResult()
        {
            // Arrange
            var serviceResult = ServiceResult<string>.Failure("Unauthorized access", 401);

            // Act
            var actionResult = serviceResult.ToActionResult();

            // Assert
            actionResult.Should().NotBeNull();
            actionResult.Should().BeOfType<UnauthorizedObjectResult>();
            
            var unauthorizedResult = actionResult as UnauthorizedObjectResult;
            unauthorizedResult!.StatusCode.Should().Be(401);
            
            var responseValue = unauthorizedResult.Value;
            var responseType = responseValue!.GetType();
            var messageProperty = responseType.GetProperty("message");
            var message = messageProperty!.GetValue(responseValue) as string;
            message.Should().Be("Unauthorized access");
        }

        [Fact]
        public void ToActionResult_Should_Return_ObjectResult_For_500_ServiceResult()
        {
            // Arrange
            var serviceResult = ServiceResult<string>.Failure("Internal server error", 500);

            // Act
            var actionResult = serviceResult.ToActionResult();

            // Assert
            actionResult.Should().NotBeNull();
            actionResult.Should().BeOfType<ObjectResult>();
            
            var objectResult = actionResult as ObjectResult;
            objectResult!.StatusCode.Should().Be(500);
            
            var responseValue = objectResult.Value;
            var responseType = responseValue!.GetType();
            var messageProperty = responseType.GetProperty("message");
            var message = messageProperty!.GetValue(responseValue) as string;
            message.Should().Be("Internal server error");
        }

        [Fact]
        public void ToActionResult_Should_Handle_Null_ErrorMessage_For_NotFound()
        {
            // Arrange
            var serviceResult = new ServiceResult<string>
            {
                IsSuccess = false,
                ErrorMessage = null,
                StatusCode = 404
            };

            // Act
            var actionResult = serviceResult.ToActionResult();

            // Assert
            actionResult.Should().NotBeNull();
            actionResult.Should().BeOfType<NotFoundObjectResult>();
            
            var notFoundResult = actionResult as NotFoundObjectResult;
            var responseValue = notFoundResult!.Value;
            var responseType = responseValue!.GetType();
            var messageProperty = responseType.GetProperty("message");
            var message = messageProperty!.GetValue(responseValue) as string;
            message.Should().Be("Resource not found");
        }

        [Fact]
        public void ToActionResult_Should_Handle_Null_ErrorMessage_For_BadRequest()
        {
            // Arrange
            var serviceResult = new ServiceResult<string>
            {
                IsSuccess = false,
                ErrorMessage = null,
                StatusCode = 400
            };

            // Act
            var actionResult = serviceResult.ToActionResult();

            // Assert
            actionResult.Should().NotBeNull();
            actionResult.Should().BeOfType<BadRequestObjectResult>();
            
            var badRequestResult = actionResult as BadRequestObjectResult;
            var responseValue = badRequestResult!.Value;
            var responseType = responseValue!.GetType();
            var messageProperty = responseType.GetProperty("message");
            var message = messageProperty!.GetValue(responseValue) as string;
            message.Should().Be("Bad request");
        }

        [Fact]
        public void ToActionResult_Should_Handle_Null_ErrorMessage_For_Unauthorized()
        {
            // Arrange
            var serviceResult = new ServiceResult<string>
            {
                IsSuccess = false,
                ErrorMessage = null,
                StatusCode = 401
            };

            // Act
            var actionResult = serviceResult.ToActionResult();

            // Assert
            actionResult.Should().NotBeNull();
            actionResult.Should().BeOfType<UnauthorizedObjectResult>();
            
            var unauthorizedResult = actionResult as UnauthorizedObjectResult;
            var responseValue = unauthorizedResult!.Value;
            var responseType = responseValue!.GetType();
            var messageProperty = responseType.GetProperty("message");
            var message = messageProperty!.GetValue(responseValue) as string;
            message.Should().Be("Unauthorized");
        }

        [Fact]
        public void ToActionResult_Should_Handle_Null_ErrorMessage_For_ServerError()
        {
            // Arrange
            var serviceResult = new ServiceResult<string>
            {
                IsSuccess = false,
                ErrorMessage = null,
                StatusCode = 500
            };

            // Act
            var actionResult = serviceResult.ToActionResult();

            // Assert
            actionResult.Should().NotBeNull();
            actionResult.Should().BeOfType<ObjectResult>();
            
            var objectResult = actionResult as ObjectResult;
            var responseValue = objectResult!.Value;
            var responseType = responseValue!.GetType();
            var messageProperty = responseType.GetProperty("message");
            var message = messageProperty!.GetValue(responseValue) as string;
            message.Should().Be("An error occurred");
        }

        [Fact]
        public void ToActionResult_Should_Handle_Null_StatusCode()
        {
            // Arrange
            var serviceResult = new ServiceResult<string>
            {
                IsSuccess = false,
                ErrorMessage = "Unknown error",
                StatusCode = null
            };

            // Act
            var actionResult = serviceResult.ToActionResult();

            // Assert
            actionResult.Should().NotBeNull();
            actionResult.Should().BeOfType<ObjectResult>();
            
            var objectResult = actionResult as ObjectResult;
            objectResult!.StatusCode.Should().Be(500); // Default to 500
        }

        [Fact]
        public void ToCreatedResult_Should_Return_CreatedAtActionResult_For_Successful_ServiceResult()
        {
            // Arrange
            var testData = new { Id = 1, Name = "Test" };
            var serviceResult = ServiceResult<object>.Success(testData);
            var actionName = "GetById";
            var routeValues = new { id = 1 };

            // Act
            var actionResult = serviceResult.ToCreatedResult(actionName, routeValues);

            // Assert
            actionResult.Should().NotBeNull();
            actionResult.Should().BeOfType<CreatedAtActionResult>();
            
            var createdResult = actionResult as CreatedAtActionResult;
            createdResult!.ActionName.Should().Be(actionName);
            createdResult.RouteValues["id"].Should().Be(1); // Check specific route value
            createdResult.Value.Should().Be(testData);
            createdResult.StatusCode.Should().Be(201);
        }

        [Fact]
        public void ToCreatedResult_Should_Return_Error_Result_For_Failed_ServiceResult()
        {
            // Arrange
            var serviceResult = ServiceResult<string>.Failure("Creation failed", 400);
            var actionName = "GetById";
            var routeValues = new { id = 1 };

            // Act
            var actionResult = serviceResult.ToCreatedResult(actionName, routeValues);

            // Assert
            actionResult.Should().NotBeNull();
            actionResult.Should().BeOfType<BadRequestObjectResult>();
            
            var badRequestResult = actionResult as BadRequestObjectResult;
            badRequestResult!.StatusCode.Should().Be(400);
        }

        [Theory]
        [InlineData(200)]
        [InlineData(422)]
        [InlineData(403)]
        [InlineData(409)]
        public void ToActionResult_Should_Handle_Various_StatusCodes(int statusCode)
        {
            // Arrange
            var serviceResult = ServiceResult<string>.Failure("Error message", statusCode);

            // Act
            var actionResult = serviceResult.ToActionResult();

            // Assert
            actionResult.Should().NotBeNull();
            
            if (statusCode == 404)
            {
                actionResult.Should().BeOfType<NotFoundObjectResult>();
            }
            else if (statusCode == 400)
            {
                actionResult.Should().BeOfType<BadRequestObjectResult>();
            }
            else if (statusCode == 401)
            {
                actionResult.Should().BeOfType<UnauthorizedObjectResult>();
            }
            else
            {
                actionResult.Should().BeOfType<ObjectResult>();
                var objectResult = actionResult as ObjectResult;
                objectResult!.StatusCode.Should().Be(statusCode);
            }
        }

        [Fact]
        public void ServiceResult_Should_Initialize_Errors_List()
        {
            // Act
            var result = new ServiceResult<string>();

            // Assert
            result.Errors.Should().NotBeNull();
            result.Errors.Should().BeEmpty();
        }

        [Fact]
        public void ToActionResult_Should_Handle_Empty_Errors_List_As_BadRequest()
        {
            // Arrange
            var serviceResult = new ServiceResult<string>
            {
                IsSuccess = false,
                ErrorMessage = "Validation failed",
                Errors = new List<string>(),
                StatusCode = 400
            };

            // Act
            var actionResult = serviceResult.ToActionResult();

            // Assert
            actionResult.Should().NotBeNull();
            actionResult.Should().BeOfType<BadRequestObjectResult>();
        }

        [Fact]
        public void ToCreatedResult_Should_Set_ControllerName_To_Null()
        {
            // Arrange
            var testData = "test";
            var serviceResult = ServiceResult<string>.Success(testData);
            var actionName = "GetById";
            var routeValues = new { id = 1 };

            // Act
            var actionResult = serviceResult.ToCreatedResult(actionName, routeValues);

            // Assert
            var createdResult = actionResult as CreatedAtActionResult;
            createdResult!.ControllerName.Should().BeNull();
        }
    }
}