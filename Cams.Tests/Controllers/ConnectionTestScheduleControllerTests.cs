using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using cams.Backend.Controller;
using cams.Backend.Services;
using cams.Backend.View;
using cams.Backend.Model;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using cams.Backend.Enums;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace Cams.Tests.Controllers
{
    public class ConnectionTestScheduleControllerTests : ControllerTestBase
    {
        private readonly ConnectionTestScheduleController _controller;
        private readonly Mock<IConnectionTestScheduleService> _scheduleServiceMock;
        private readonly Mock<ILogger<ConnectionTestScheduleController>> _loggerMock;
        private readonly Mock<ILoggingService> _loggingServiceMock;
        private readonly Mock<IDatabaseConnectionService> _databaseConnectionServiceMock;

        public ConnectionTestScheduleControllerTests()
        {
            _scheduleServiceMock = new Mock<IConnectionTestScheduleService>();
            _loggerMock = new Mock<ILogger<ConnectionTestScheduleController>>();
            _loggingServiceMock = new Mock<ILoggingService>();
            _databaseConnectionServiceMock = new Mock<IDatabaseConnectionService>();

            _controller = new ConnectionTestScheduleController(
                _scheduleServiceMock.Object,
                _loggerMock.Object,
                _loggingServiceMock.Object);
        }

        #region GetSchedules Tests

        [Fact]
        public async Task GetSchedules_WithValidUser_ReturnsOkWithSchedules()
        {
            // Arrange
            var userId = Guid.NewGuid();
            _controller.ControllerContext = CreateControllerContext(userId);

            var schedules = new List<ConnectionTestScheduleResponse>
            {
                new ConnectionTestScheduleResponse 
                { 
                    Id = Guid.NewGuid(), 
                    ApplicationId = Guid.NewGuid(),
                    CronExpression = "0 */5 * * *",
                    IsEnabled = true
                },
                new ConnectionTestScheduleResponse 
                { 
                    Id = Guid.NewGuid(), 
                    ApplicationId = Guid.NewGuid(),
                    CronExpression = "0 0 * * *",
                    IsEnabled = false
                }
            };

            _scheduleServiceMock
                .Setup(x => x.GetUserSchedulesAsync(userId))
                .ReturnsAsync(schedules);

            // Act
            var result = await _controller.GetSchedules();

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var returnedSchedules = okResult.Value.Should().BeAssignableTo<IEnumerable<ConnectionTestScheduleResponse>>().Subject;
            returnedSchedules.Should().HaveCount(2);
            
            _loggerMock.Verify(x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("requested connection test schedules")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception, string>>()!), Times.Once);

            _loggingServiceMock.Verify(x => x.LogAuditAsync(
                userId,
                AuditAction.Read.ToString(),
                "ConnectionTestSchedule",
                null,
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task GetSchedules_WhenUnauthorized_ReturnsUnauthorized()
        {
            // Arrange
            var userId = Guid.NewGuid();
            _controller.ControllerContext = CreateControllerContext(userId);

            _scheduleServiceMock
                .Setup(x => x.GetUserSchedulesAsync(userId))
                .ThrowsAsync(new UnauthorizedAccessException());

            // Act
            var result = await _controller.GetSchedules();

            // Assert
            result.Should().BeOfType<UnauthorizedObjectResult>();
        }

        [Fact]
        public async Task GetSchedules_WhenExceptionThrown_ReturnsInternalServerError()
        {
            // Arrange
            var userId = Guid.NewGuid();
            _controller.ControllerContext = CreateControllerContext(userId);

            _scheduleServiceMock
                .Setup(x => x.GetUserSchedulesAsync(userId))
                .ThrowsAsync(new Exception("Test exception"));

            // Act
            var result = await _controller.GetSchedules();

            // Assert
            var objectResult = result.Should().BeAssignableTo<ObjectResult>().Subject;
            objectResult.StatusCode.Should().Be(500);
            objectResult.Value.Should().BeEquivalentTo(new { message = "Error retrieving connection test schedules" });
        }

        #endregion

        #region GetScheduleByApplicationId Tests

        [Fact]
        public async Task GetScheduleByApplicationId_WithValidApplicationId_ReturnsOkWithSchedule()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var applicationId = Guid.NewGuid();
            _controller.ControllerContext = CreateControllerContext(userId);

            var schedule = new ConnectionTestScheduleResponse
            {
                Id = Guid.NewGuid(),
                ApplicationId = applicationId,
                CronExpression = "0 */5 * * *",
                IsEnabled = true
            };

            _scheduleServiceMock
                .Setup(x => x.GetScheduleByApplicationIdAsync(applicationId, userId))
                .ReturnsAsync(schedule);

            // Act
            var result = await _controller.GetScheduleByApplicationId(applicationId);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var returnedSchedule = okResult.Value.Should().BeOfType<ConnectionTestScheduleResponse>().Subject;
            returnedSchedule.ApplicationId.Should().Be(applicationId);

            _loggingServiceMock.Verify(x => x.LogAuditAsync(
                userId,
                AuditAction.Read.ToString(),
                "ConnectionTestSchedule",
                schedule.Id,
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task GetScheduleByApplicationId_WhenScheduleNotFound_ReturnsNotFound()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var applicationId = Guid.NewGuid();
            _controller.ControllerContext = CreateControllerContext(userId);

            _scheduleServiceMock
                .Setup(x => x.GetScheduleByApplicationIdAsync(applicationId, userId))
                .ReturnsAsync((ConnectionTestScheduleResponse?)null);

            // Act
            var result = await _controller.GetScheduleByApplicationId(applicationId);

            // Assert
            var notFoundResult = result.Should().BeOfType<NotFoundObjectResult>().Subject;
            notFoundResult.Value.Should().BeEquivalentTo(new { message = "Schedule not found for this application" });
        }

        [Fact]
        public async Task GetScheduleByApplicationId_WhenUnauthorized_ReturnsUnauthorized()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var applicationId = Guid.NewGuid();
            _controller.ControllerContext = CreateControllerContext(userId);

            _scheduleServiceMock
                .Setup(x => x.GetScheduleByApplicationIdAsync(applicationId, userId))
                .ThrowsAsync(new UnauthorizedAccessException());

            // Act
            var result = await _controller.GetScheduleByApplicationId(applicationId);

            // Assert
            result.Should().BeOfType<UnauthorizedObjectResult>();
        }

        #endregion

        #region UpsertSchedule Tests

        [Fact]
        public async Task UpsertSchedule_WithValidRequest_ReturnsOkWithSchedule()
        {
            // Arrange
            var userId = Guid.NewGuid();
            _controller.ControllerContext = CreateControllerContext(userId);

            var request = new ConnectionTestScheduleRequest
            {
                ApplicationId = Guid.NewGuid(),
                CronExpression = "0 */5 * * *",
                IsEnabled = true
            };

            var schedule = new ConnectionTestScheduleResponse
            {
                Id = Guid.NewGuid(),
                ApplicationId = request.ApplicationId,
                CronExpression = request.CronExpression,
                IsEnabled = request.IsEnabled
            };

            _scheduleServiceMock
                .Setup(x => x.UpsertScheduleAsync(request, userId))
                .ReturnsAsync(schedule);

            // Act
            var result = await _controller.UpsertSchedule(request);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var returnedSchedule = okResult.Value.Should().BeOfType<ConnectionTestScheduleResponse>().Subject;
            returnedSchedule.CronExpression.Should().Be(request.CronExpression);

            _loggingServiceMock.Verify(x => x.LogAuditAsync(
                userId,
                AuditAction.CreateOrUpdate.ToString(),
                "ConnectionTestSchedule",
                schedule.Id,
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task UpsertSchedule_WithInvalidModelState_ReturnsBadRequest()
        {
            // Arrange
            var userId = Guid.NewGuid();
            _controller.ControllerContext = CreateControllerContext(userId);
            _controller.ModelState.AddModelError("CronExpression", "Cron expression is required");

            var request = new ConnectionTestScheduleRequest
            {
                ApplicationId = Guid.NewGuid(),
                IsEnabled = true
            };

            // Act
            var result = await _controller.UpsertSchedule(request);

            // Assert
            result.Should().BeOfType<BadRequestObjectResult>();
            
            // We know the controller returns validation errors in a specific format
            // Let's just verify it's a bad request - the exact structure is an implementation detail
        }

        [Fact]
        public async Task UpsertSchedule_WhenUnauthorized_ReturnsUnauthorized()
        {
            // Arrange
            var userId = Guid.NewGuid();
            _controller.ControllerContext = CreateControllerContext(userId);

            var request = new ConnectionTestScheduleRequest
            {
                ApplicationId = Guid.NewGuid(),
                CronExpression = "0 */5 * * *",
                IsEnabled = true
            };

            _scheduleServiceMock
                .Setup(x => x.UpsertScheduleAsync(request, userId))
                .ThrowsAsync(new UnauthorizedAccessException("Access denied"));

            // Act
            var result = await _controller.UpsertSchedule(request);

            // Assert
            var unauthorizedResult = result.Should().BeOfType<UnauthorizedObjectResult>().Subject;
            unauthorizedResult.Value.Should().BeEquivalentTo(new { message = "Access denied" });
        }

        [Fact]
        public async Task UpsertSchedule_WithInvalidCronExpression_ReturnsBadRequest()
        {
            // Arrange
            var userId = Guid.NewGuid();
            _controller.ControllerContext = CreateControllerContext(userId);

            var request = new ConnectionTestScheduleRequest
            {
                ApplicationId = Guid.NewGuid(),
                CronExpression = "invalid cron",
                IsEnabled = true
            };

            _scheduleServiceMock
                .Setup(x => x.UpsertScheduleAsync(request, userId))
                .ThrowsAsync(new ArgumentException("Invalid cron expression"));

            // Act
            var result = await _controller.UpsertSchedule(request);

            // Assert
            var badRequestResult = result.Should().BeOfType<BadRequestObjectResult>().Subject;
            badRequestResult.Value.Should().BeEquivalentTo(new { message = "Invalid cron expression" });
        }

        #endregion

        #region UpdateSchedule Tests

        [Fact]
        public async Task UpdateSchedule_WithValidRequest_ReturnsOkWithUpdatedSchedule()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var scheduleId = Guid.NewGuid();
            _controller.ControllerContext = CreateControllerContext(userId);

            var request = new ConnectionTestScheduleRequest
            {
                ApplicationId = Guid.NewGuid(),
                CronExpression = "0 0 * * *",
                IsEnabled = false
            };

            var updatedSchedule = new ConnectionTestScheduleResponse
            {
                Id = scheduleId,
                ApplicationId = request.ApplicationId,
                CronExpression = request.CronExpression,
                IsEnabled = request.IsEnabled
            };

            _scheduleServiceMock
                .Setup(x => x.UpdateScheduleAsync(
                    It.Is<ConnectionTestScheduleUpdateRequest>(u => 
                        u.Id == scheduleId && 
                        u.CronExpression == request.CronExpression), 
                    userId))
                .ReturnsAsync(updatedSchedule);

            // Act
            var result = await _controller.UpdateSchedule(scheduleId, request);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var returnedSchedule = okResult.Value.Should().BeOfType<ConnectionTestScheduleResponse>().Subject;
            returnedSchedule.Id.Should().Be(scheduleId);
            returnedSchedule.CronExpression.Should().Be(request.CronExpression);
        }

        [Fact]
        public async Task UpdateSchedule_WhenScheduleNotFound_ReturnsNotFound()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var scheduleId = Guid.NewGuid();
            _controller.ControllerContext = CreateControllerContext(userId);

            var request = new ConnectionTestScheduleRequest
            {
                ApplicationId = Guid.NewGuid(),
                CronExpression = "0 0 * * *",
                IsEnabled = false
            };

            _scheduleServiceMock
                .Setup(x => x.UpdateScheduleAsync(It.IsAny<ConnectionTestScheduleUpdateRequest>(), userId))
                .ReturnsAsync((ConnectionTestScheduleResponse?)null);

            // Act
            var result = await _controller.UpdateSchedule(scheduleId, request);

            // Assert
            var notFoundResult = result.Should().BeOfType<NotFoundObjectResult>().Subject;
            notFoundResult.Value.Should().BeEquivalentTo(new { message = "Schedule not found" });
        }

        #endregion

        #region DeleteSchedule Tests

        [Fact]
        public async Task DeleteSchedule_WithValidId_ReturnsNoContent()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var scheduleId = Guid.NewGuid();
            _controller.ControllerContext = CreateControllerContext(userId);

            _scheduleServiceMock
                .Setup(x => x.DeleteScheduleAsync(scheduleId, userId))
                .ReturnsAsync(true);

            // Act
            var result = await _controller.DeleteSchedule(scheduleId);

            // Assert
            result.Should().BeOfType<NoContentResult>();

            _loggingServiceMock.Verify(x => x.LogAuditAsync(
                userId,
                AuditAction.Delete.ToString(),
                "ConnectionTestSchedule",
                scheduleId,
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task DeleteSchedule_WhenScheduleNotFound_ReturnsNotFound()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var scheduleId = Guid.NewGuid();
            _controller.ControllerContext = CreateControllerContext(userId);

            _scheduleServiceMock
                .Setup(x => x.DeleteScheduleAsync(scheduleId, userId))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.DeleteSchedule(scheduleId);

            // Assert
            var notFoundResult = result.Should().BeOfType<NotFoundObjectResult>().Subject;
            notFoundResult.Value.Should().BeEquivalentTo(new { message = "Schedule not found" });
        }

        [Fact]
        public async Task DeleteSchedule_WhenUnauthorized_ReturnsUnauthorized()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var scheduleId = Guid.NewGuid();
            _controller.ControllerContext = CreateControllerContext(userId);

            _scheduleServiceMock
                .Setup(x => x.DeleteScheduleAsync(scheduleId, userId))
                .ThrowsAsync(new UnauthorizedAccessException());

            // Act
            var result = await _controller.DeleteSchedule(scheduleId);

            // Assert
            result.Should().BeOfType<UnauthorizedObjectResult>();
        }

        #endregion

        #region ToggleSchedule Tests

        [Fact]
        public async Task ToggleSchedule_WithValidRequest_ReturnsOkWithToggledSchedule()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var scheduleId = Guid.NewGuid();
            _controller.ControllerContext = CreateControllerContext(userId);

            var request = new ToggleScheduleRequest { IsEnabled = true };

            var toggledSchedule = new ConnectionTestScheduleResponse
            {
                Id = scheduleId,
                ApplicationId = Guid.NewGuid(),
                CronExpression = "0 */5 * * *",
                IsEnabled = true
            };

            _scheduleServiceMock
                .Setup(x => x.ToggleScheduleAsync(scheduleId, true, userId))
                .ReturnsAsync(toggledSchedule);

            // Act
            var result = await _controller.ToggleSchedule(scheduleId, request);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var returnedSchedule = okResult.Value.Should().BeOfType<ConnectionTestScheduleResponse>().Subject;
            returnedSchedule.IsEnabled.Should().BeTrue();

            _loggingServiceMock.Verify(x => x.LogAuditAsync(
                userId,
                AuditAction.StatusChange.ToString(),
                "ConnectionTestSchedule",
                scheduleId,
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task ToggleSchedule_WhenScheduleNotFound_ReturnsNotFound()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var scheduleId = Guid.NewGuid();
            _controller.ControllerContext = CreateControllerContext(userId);

            var request = new ToggleScheduleRequest { IsEnabled = false };

            _scheduleServiceMock
                .Setup(x => x.ToggleScheduleAsync(scheduleId, false, userId))
                .ReturnsAsync((ConnectionTestScheduleResponse?)null);

            // Act
            var result = await _controller.ToggleSchedule(scheduleId, request);

            // Assert
            var notFoundResult = result.Should().BeOfType<NotFoundObjectResult>().Subject;
            notFoundResult.Value.Should().BeEquivalentTo(new { message = "Schedule not found" });
        }

        #endregion

        #region ValidateCronExpression Tests

        [Fact]
        public async Task ValidateCronExpression_WithValidExpression_ReturnsOkWithValidationResult()
        {
            // Arrange
            var userId = Guid.NewGuid();
            _controller.ControllerContext = CreateControllerContext(userId);

            var request = new ValidateCronRequest { Expression = "0 */5 * * *" };

            var validationResult = new CronValidationResponse
            {
                IsValid = true,
                NextRunTime = DateTime.UtcNow.AddMinutes(5),
                Description = "Every 5 minutes"
            };

            _scheduleServiceMock
                .Setup(x => x.ValidateCronExpressionAsync(request.Expression))
                .ReturnsAsync(validationResult);

            // Act
            var result = await _controller.ValidateCronExpression(request);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var returnedValidation = okResult.Value.Should().BeOfType<CronValidationResponse>().Subject;
            returnedValidation.IsValid.Should().BeTrue();
            returnedValidation.Description.Should().Be("Every 5 minutes");
        }

        [Fact]
        public async Task ValidateCronExpression_WithInvalidModelState_ReturnsBadRequest()
        {
            // Arrange
            var userId = Guid.NewGuid();
            _controller.ControllerContext = CreateControllerContext(userId);
            _controller.ModelState.AddModelError("Expression", "Expression is required");

            var request = new ValidateCronRequest();

            // Act
            var result = await _controller.ValidateCronExpression(request);

            // Assert
            result.Should().BeOfType<BadRequestObjectResult>();
            
            // We know the controller returns validation errors in a specific format
            // Let's just verify it's a bad request - the exact structure is an implementation detail
        }

        [Fact]
        public async Task ValidateCronExpression_WhenExceptionThrown_ReturnsInternalServerError()
        {
            // Arrange
            var userId = Guid.NewGuid();
            _controller.ControllerContext = CreateControllerContext(userId);

            var request = new ValidateCronRequest { Expression = "invalid" };

            _scheduleServiceMock
                .Setup(x => x.ValidateCronExpressionAsync(request.Expression))
                .ThrowsAsync(new Exception("Test exception"));

            // Act
            var result = await _controller.ValidateCronExpression(request);

            // Assert
            var objectResult = result.Should().BeAssignableTo<ObjectResult>().Subject;
            objectResult.StatusCode.Should().Be(500);
            objectResult.Value.Should().BeEquivalentTo(new { message = "Error validating cron expression" });
        }

        #endregion

        #region RunScheduleNow Tests

        [Fact]
        public async Task RunScheduleNow_WithActiveConnections_ReturnsOkWithTestResults()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var scheduleId = Guid.NewGuid();
            var applicationId = Guid.NewGuid();
            _controller.ControllerContext = CreateControllerContext(userId);

            var schedule = new ConnectionTestScheduleResponse
            {
                Id = scheduleId,
                ApplicationId = applicationId,
                CronExpression = "0 */5 * * *",
                IsEnabled = true
            };

            var connections = new List<DatabaseConnectionResponse>
            {
                new DatabaseConnectionResponse 
                { 
                    Id = Guid.NewGuid(), 
                    Name = "Test DB 1", 
                    IsActive = true 
                },
                new DatabaseConnectionResponse 
                { 
                    Id = Guid.NewGuid(), 
                    Name = "Test DB 2", 
                    IsActive = true 
                }
            };

            var testResult = new DatabaseConnectionTestResponse
            {
                IsSuccessful = true,
                Message = "Connection successful",
                ResponseTime = TimeSpan.FromMilliseconds(100)
            };

            _scheduleServiceMock
                .Setup(x => x.GetScheduleByIdAsync(scheduleId, userId))
                .ReturnsAsync(schedule);

            _databaseConnectionServiceMock
                .Setup(x => x.GetUserConnectionsAsync(userId, applicationId))
                .ReturnsAsync(connections);

            _databaseConnectionServiceMock
                .Setup(x => x.TestConnectionAsync(It.IsAny<DatabaseConnectionTestRequest>(), userId))
                .ReturnsAsync(testResult);

            // Act - Need to pass the database connection service as a parameter
            var result = await _controller.RunScheduleNow(scheduleId, _databaseConnectionServiceMock.Object);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var resultValue = okResult.Value;
            
            resultValue.Should().NotBeNull();
            var properties = resultValue!.GetType().GetProperties();
            
            properties.Single(p => p.Name == "status").GetValue(resultValue).Should().Be("success");
            properties.Single(p => p.Name == "totalConnections").GetValue(resultValue).Should().Be(2);
            properties.Single(p => p.Name == "successfulTests").GetValue(resultValue).Should().Be(2);
            properties.Single(p => p.Name == "failedTests").GetValue(resultValue).Should().Be(0);

            _scheduleServiceMock.Verify(x => x.UpdateScheduleRunStatusAsync(
                scheduleId,
                "success",
                It.IsAny<string>(),
                It.IsAny<TimeSpan>()), Times.Once);
        }

        [Fact]
        public async Task RunScheduleNow_WithNoActiveConnections_ReturnsOkWithSkippedStatus()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var scheduleId = Guid.NewGuid();
            var applicationId = Guid.NewGuid();
            _controller.ControllerContext = CreateControllerContext(userId);

            var schedule = new ConnectionTestScheduleResponse
            {
                Id = scheduleId,
                ApplicationId = applicationId,
                CronExpression = "0 */5 * * *",
                IsEnabled = true
            };

            var connections = new List<DatabaseConnectionResponse>
            {
                new DatabaseConnectionResponse 
                { 
                    Id = Guid.NewGuid(), 
                    Name = "Test DB 1", 
                    IsActive = false 
                }
            };

            _scheduleServiceMock
                .Setup(x => x.GetScheduleByIdAsync(scheduleId, userId))
                .ReturnsAsync(schedule);

            _databaseConnectionServiceMock
                .Setup(x => x.GetUserConnectionsAsync(userId, applicationId))
                .ReturnsAsync(connections);

            // Act
            var result = await _controller.RunScheduleNow(scheduleId, _databaseConnectionServiceMock.Object);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var resultValue = okResult.Value;
            
            var properties = resultValue!.GetType().GetProperties();
            properties.Single(p => p.Name == "status").GetValue(resultValue).Should().Be("skipped");
            properties.Single(p => p.Name == "message").GetValue(resultValue).Should().Be("No active database connections found");
        }

        [Fact]
        public async Task RunScheduleNow_WhenScheduleNotFound_ReturnsNotFound()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var scheduleId = Guid.NewGuid();
            _controller.ControllerContext = CreateControllerContext(userId);

            _scheduleServiceMock
                .Setup(x => x.GetScheduleByIdAsync(scheduleId, userId))
                .ReturnsAsync((ConnectionTestScheduleResponse?)null);

            // Act
            var result = await _controller.RunScheduleNow(scheduleId, _databaseConnectionServiceMock.Object);

            // Assert
            var notFoundResult = result.Should().BeOfType<NotFoundObjectResult>().Subject;
            notFoundResult.Value.Should().BeEquivalentTo(new { message = "Schedule not found" });
        }

        [Fact]
        public async Task RunScheduleNow_WithPartialFailure_ReturnsOkWithPartialStatus()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var scheduleId = Guid.NewGuid();
            var applicationId = Guid.NewGuid();
            _controller.ControllerContext = CreateControllerContext(userId);

            var schedule = new ConnectionTestScheduleResponse
            {
                Id = scheduleId,
                ApplicationId = applicationId,
                CronExpression = "0 */5 * * *",
                IsEnabled = true
            };

            var connections = new List<DatabaseConnectionResponse>
            {
                new DatabaseConnectionResponse 
                { 
                    Id = Guid.NewGuid(), 
                    Name = "Test DB 1", 
                    IsActive = true 
                },
                new DatabaseConnectionResponse 
                { 
                    Id = Guid.NewGuid(), 
                    Name = "Test DB 2", 
                    IsActive = true 
                }
            };

            _scheduleServiceMock
                .Setup(x => x.GetScheduleByIdAsync(scheduleId, userId))
                .ReturnsAsync(schedule);

            _databaseConnectionServiceMock
                .Setup(x => x.GetUserConnectionsAsync(userId, applicationId))
                .ReturnsAsync(connections);

            // First connection succeeds
            _databaseConnectionServiceMock
                .SetupSequence(x => x.TestConnectionAsync(It.IsAny<DatabaseConnectionTestRequest>(), userId))
                .ReturnsAsync(new DatabaseConnectionTestResponse
                {
                    IsSuccessful = true,
                    Message = "Connection successful",
                    ResponseTime = TimeSpan.FromMilliseconds(100)
                })
                .ReturnsAsync(new DatabaseConnectionTestResponse
                {
                    IsSuccessful = false,
                    Message = "Connection failed",
                    ResponseTime = TimeSpan.Zero
                });

            // Act
            var result = await _controller.RunScheduleNow(scheduleId, _databaseConnectionServiceMock.Object);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var resultValue = okResult.Value;
            
            var properties = resultValue!.GetType().GetProperties();
            properties.Single(p => p.Name == "status").GetValue(resultValue).Should().Be("partial");
            properties.Single(p => p.Name == "successfulTests").GetValue(resultValue).Should().Be(1);
            properties.Single(p => p.Name == "failedTests").GetValue(resultValue).Should().Be(1);
        }

        [Fact]
        public async Task RunScheduleNow_WhenUnauthorized_ReturnsUnauthorized()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var scheduleId = Guid.NewGuid();
            _controller.ControllerContext = CreateControllerContext(userId);

            _scheduleServiceMock
                .Setup(x => x.GetScheduleByIdAsync(scheduleId, userId))
                .ThrowsAsync(new UnauthorizedAccessException());

            // Act
            var result = await _controller.RunScheduleNow(scheduleId, _databaseConnectionServiceMock.Object);

            // Assert
            result.Should().BeOfType<UnauthorizedObjectResult>();
        }

        #endregion
    }
}