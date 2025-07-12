using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using cams.Backend.Services;
using cams.Backend.Data;
using cams.Backend.Model;
using cams.Backend.View;
using Cams.Tests.Fixtures;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using Cams.Tests.Builders;

namespace Cams.Tests.Services
{
    public class ConnectionTestScheduleServiceTests : IClassFixture<DatabaseFixture>
    {
        private readonly DatabaseFixture _fixture;
        private readonly Mock<ILogger<ConnectionTestScheduleService>> _loggerMock;

        public ConnectionTestScheduleServiceTests(DatabaseFixture fixture)
        {
            _fixture = fixture;
            _loggerMock = new Mock<ILogger<ConnectionTestScheduleService>>();
        }

        private ConnectionTestScheduleService CreateService(ApplicationDbContext context)
        {
            return new ConnectionTestScheduleService(context, _loggerMock.Object);
        }

        #region GetUserSchedulesAsync Tests

        [Fact]
        public async Task GetUserSchedulesAsync_WithSchedules_ReturnsUserSchedules()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var userId = Guid.NewGuid();
            var application1 = new ApplicationBuilder()
                .WithUserId(userId)
                .WithName("Test App 1")
                .Build();
            var application2 = new ApplicationBuilder()
                .WithUserId(userId)
                .WithName("Test App 2")
                .Build();
            var otherUserApp = new ApplicationBuilder()
                .WithUserId(Guid.NewGuid())
                .WithName("Other User App")
                .Build();

            context.Applications.AddRange(application1, application2, otherUserApp);
            await context.SaveChangesAsync();

            var schedule1 = new ConnectionTestSchedule
            {
                ApplicationId = application1.Id,
                CronExpression = "0 */5 * * *",
                IsEnabled = true,
                NextRunTime = DateTime.UtcNow.AddMinutes(5),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var schedule2 = new ConnectionTestSchedule
            {
                ApplicationId = application2.Id,
                CronExpression = "0 0 * * *",
                IsEnabled = false,
                NextRunTime = DateTime.UtcNow.AddDays(1),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var otherSchedule = new ConnectionTestSchedule
            {
                ApplicationId = otherUserApp.Id,
                CronExpression = "0 */10 * * *",
                IsEnabled = true,
                NextRunTime = DateTime.UtcNow.AddMinutes(10),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            context.ConnectionTestSchedules.AddRange(schedule1, schedule2, otherSchedule);
            await context.SaveChangesAsync();

            // Act
            var result = await service.GetUserSchedulesAsync(userId);

            // Assert
            result.Should().HaveCount(2);
            result.Should().Contain(s => s.ApplicationId == application1.Id);
            result.Should().Contain(s => s.ApplicationId == application2.Id);
            result.Should().NotContain(s => s.ApplicationId == otherUserApp.Id);
        }

        [Fact]
        public async Task GetUserSchedulesAsync_WithNoSchedules_ReturnsEmptyList()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);
            var userId = Guid.NewGuid();

            // Act
            var result = await service.GetUserSchedulesAsync(userId);

            // Assert
            result.Should().BeEmpty();
        }

        #endregion

        #region GetScheduleByApplicationIdAsync Tests

        [Fact]
        public async Task GetScheduleByApplicationIdAsync_WithValidApplicationId_ReturnsSchedule()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var userId = Guid.NewGuid();
            var application = new ApplicationBuilder()
                .WithUserId(userId)
                .WithName("Test App")
                .Build();

            context.Applications.Add(application);
            await context.SaveChangesAsync();

            var schedule = new ConnectionTestSchedule
            {
                ApplicationId = application.Id,
                CronExpression = "0 */5 * * *",
                IsEnabled = true,
                NextRunTime = DateTime.UtcNow.AddMinutes(5),
                LastRunStatus = "success",
                LastRunMessage = "All connections tested successfully",
                LastRunTime = DateTime.UtcNow.AddMinutes(-5),
                LastRunDuration = TimeSpan.FromSeconds(2.5),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            context.ConnectionTestSchedules.Add(schedule);
            await context.SaveChangesAsync();

            // Act
            var result = await service.GetScheduleByApplicationIdAsync(application.Id, userId);

            // Assert
            result.Should().NotBeNull();
            result!.ApplicationId.Should().Be(application.Id);
            result.ApplicationName.Should().Be("Test App");
            result.CronExpression.Should().Be("0 */5 * * *");
            result.IsEnabled.Should().BeTrue();
            result.LastRunStatus.Should().Be("success");
            result.LastRunMessage.Should().Be("All connections tested successfully");
            result.LastRunDuration.Should().Be(TimeSpan.FromSeconds(2.5));
        }

        [Fact]
        public async Task GetScheduleByApplicationIdAsync_WithInvalidUserId_ReturnsNull()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var application = new ApplicationBuilder()
                .WithUserId(Guid.NewGuid())
                .WithName("Test App")
                .Build();

            context.Applications.Add(application);
            await context.SaveChangesAsync();

            var schedule = new ConnectionTestSchedule
            {
                ApplicationId = application.Id,
                CronExpression = "0 */5 * * *",
                IsEnabled = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            context.ConnectionTestSchedules.Add(schedule);
            await context.SaveChangesAsync();

            // Act
            var result = await service.GetScheduleByApplicationIdAsync(application.Id, Guid.NewGuid());

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task GetScheduleByApplicationIdAsync_WithNoSchedule_ReturnsNull()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var userId = Guid.NewGuid();
            var application = new ApplicationBuilder()
                .WithUserId(userId)
                .WithName("Test App")
                .Build();

            context.Applications.Add(application);
            await context.SaveChangesAsync();

            // Act
            var result = await service.GetScheduleByApplicationIdAsync(application.Id, userId);

            // Assert
            result.Should().BeNull();
        }

        #endregion

        #region GetScheduleByIdAsync Tests

        [Fact]
        public async Task GetScheduleByIdAsync_WithValidId_ReturnsSchedule()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var userId = Guid.NewGuid();
            var application = new ApplicationBuilder()
                .WithUserId(userId)
                .WithName("Test App")
                .Build();

            context.Applications.Add(application);
            await context.SaveChangesAsync();

            var schedule = new ConnectionTestSchedule
            {
                ApplicationId = application.Id,
                CronExpression = "0 */5 * * *",
                IsEnabled = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            context.ConnectionTestSchedules.Add(schedule);
            await context.SaveChangesAsync();

            // Act
            var result = await service.GetScheduleByIdAsync(schedule.Id, userId);

            // Assert
            result.Should().NotBeNull();
            result!.Id.Should().Be(schedule.Id);
            result.ApplicationId.Should().Be(application.Id);
            result.ApplicationName.Should().Be("Test App");
        }

        [Fact]
        public async Task GetScheduleByIdAsync_WithInvalidUserId_ReturnsNull()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var application = new ApplicationBuilder()
                .WithUserId(Guid.NewGuid())
                .WithName("Test App")
                .Build();

            context.Applications.Add(application);
            await context.SaveChangesAsync();

            var schedule = new ConnectionTestSchedule
            {
                ApplicationId = application.Id,
                CronExpression = "0 */5 * * *",
                IsEnabled = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            context.ConnectionTestSchedules.Add(schedule);
            await context.SaveChangesAsync();

            // Act
            var result = await service.GetScheduleByIdAsync(schedule.Id, Guid.NewGuid());

            // Assert
            result.Should().BeNull();
        }

        #endregion

        #region UpsertScheduleAsync Tests

        [Fact]
        public async Task UpsertScheduleAsync_WithNewSchedule_CreatesSchedule()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var userId = Guid.NewGuid();
            var application = new ApplicationBuilder()
                .WithUserId(userId)
                .WithName("Test App")
                .Build();

            context.Applications.Add(application);
            await context.SaveChangesAsync();

            var request = new ConnectionTestScheduleRequest
            {
                ApplicationId = application.Id,
                CronExpression = "0 */5 * * *",
                IsEnabled = true
            };

            // Act
            var result = await service.UpsertScheduleAsync(request, userId);

            // Assert
            result.Should().NotBeNull();
            result.ApplicationId.Should().Be(application.Id);
            result.ApplicationName.Should().Be("Test App");
            result.CronExpression.Should().Be("0 */5 * * *");
            result.IsEnabled.Should().BeTrue();
            result.NextRunTime.Should().NotBeNull();

            // Verify it was saved
            var savedSchedule = await context.ConnectionTestSchedules
                .FirstOrDefaultAsync(s => s.ApplicationId == application.Id);
            savedSchedule.Should().NotBeNull();
            savedSchedule!.CronExpression.Should().Be("0 */5 * * *");
        }

        [Fact]
        public async Task UpsertScheduleAsync_WithExistingSchedule_UpdatesSchedule()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var userId = Guid.NewGuid();
            var application = new ApplicationBuilder()
                .WithUserId(userId)
                .WithName("Test App")
                .Build();

            context.Applications.Add(application);
            await context.SaveChangesAsync();

            var existingSchedule = new ConnectionTestSchedule
            {
                ApplicationId = application.Id,
                CronExpression = "0 */10 * * *",
                IsEnabled = false,
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                UpdatedAt = DateTime.UtcNow.AddDays(-1)
            };

            context.ConnectionTestSchedules.Add(existingSchedule);
            await context.SaveChangesAsync();

            var request = new ConnectionTestScheduleRequest
            {
                ApplicationId = application.Id,
                CronExpression = "0 */5 * * *",
                IsEnabled = true
            };

            // Act
            var result = await service.UpsertScheduleAsync(request, userId);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().Be(existingSchedule.Id);
            result.CronExpression.Should().Be("0 */5 * * *");
            result.IsEnabled.Should().BeTrue();

            // Verify it was updated
            var updatedSchedule = await context.ConnectionTestSchedules
                .FirstOrDefaultAsync(s => s.Id == existingSchedule.Id);
            updatedSchedule.Should().NotBeNull();
            updatedSchedule!.CronExpression.Should().Be("0 */5 * * *");
            updatedSchedule.IsEnabled.Should().BeTrue();
            updatedSchedule.UpdatedAt.Should().BeAfter(updatedSchedule.CreatedAt);
        }

        [Fact]
        public async Task UpsertScheduleAsync_WithInvalidCronExpression_ThrowsArgumentException()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var userId = Guid.NewGuid();
            var application = new ApplicationBuilder()
                .WithUserId(userId)
                .WithName("Test App")
                .Build();

            context.Applications.Add(application);
            await context.SaveChangesAsync();

            var request = new ConnectionTestScheduleRequest
            {
                ApplicationId = application.Id,
                CronExpression = "invalid cron",
                IsEnabled = true
            };

            // Act & Assert
            await service.Invoking(s => s.UpsertScheduleAsync(request, userId))
                .Should().ThrowAsync<ArgumentException>()
                .WithMessage("Invalid cron expression:*");
        }

        [Fact]
        public async Task UpsertScheduleAsync_WithUnauthorizedApplication_ThrowsUnauthorizedException()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var application = new ApplicationBuilder()
                .WithUserId(Guid.NewGuid())
                .WithName("Test App")
                .Build();

            context.Applications.Add(application);
            await context.SaveChangesAsync();

            var request = new ConnectionTestScheduleRequest
            {
                ApplicationId = application.Id,
                CronExpression = "0 */5 * * *",
                IsEnabled = true
            };

            // Act & Assert
            await service.Invoking(s => s.UpsertScheduleAsync(request, Guid.NewGuid()))
                .Should().ThrowAsync<UnauthorizedAccessException>()
                .WithMessage("Application not found or access denied");
        }

        #endregion

        #region UpdateScheduleAsync Tests

        [Fact]
        public async Task UpdateScheduleAsync_WithValidSchedule_UpdatesSchedule()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var userId = Guid.NewGuid();
            var application = new ApplicationBuilder()
                .WithUserId(userId)
                .WithName("Test App")
                .Build();

            context.Applications.Add(application);
            await context.SaveChangesAsync();

            var schedule = new ConnectionTestSchedule
            {
                ApplicationId = application.Id,
                CronExpression = "0 */10 * * *",
                IsEnabled = false,
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                UpdatedAt = DateTime.UtcNow.AddDays(-1)
            };

            context.ConnectionTestSchedules.Add(schedule);
            await context.SaveChangesAsync();

            var request = new ConnectionTestScheduleUpdateRequest
            {
                Id = schedule.Id,
                ApplicationId = application.Id,
                CronExpression = "0 */5 * * *",
                IsEnabled = true
            };

            // Act
            var result = await service.UpdateScheduleAsync(request, userId);

            // Assert
            result.Should().NotBeNull();
            result!.Id.Should().Be(schedule.Id);
            result.CronExpression.Should().Be("0 */5 * * *");
            result.IsEnabled.Should().BeTrue();
            result.ApplicationName.Should().Be("Test App");
        }

        [Fact]
        public async Task UpdateScheduleAsync_WithInvalidScheduleId_ReturnsNull()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var request = new ConnectionTestScheduleUpdateRequest
            {
                Id = Guid.NewGuid(),
                ApplicationId = Guid.NewGuid(),
                CronExpression = "0 */5 * * *",
                IsEnabled = true
            };

            // Act
            var result = await service.UpdateScheduleAsync(request, Guid.NewGuid());

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task UpdateScheduleAsync_WithInvalidCronExpression_ThrowsArgumentException()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var userId = Guid.NewGuid();
            var application = new ApplicationBuilder()
                .WithUserId(userId)
                .WithName("Test App")
                .Build();

            context.Applications.Add(application);
            await context.SaveChangesAsync();

            var schedule = new ConnectionTestSchedule
            {
                ApplicationId = application.Id,
                CronExpression = "0 */10 * * *",
                IsEnabled = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            context.ConnectionTestSchedules.Add(schedule);
            await context.SaveChangesAsync();

            var request = new ConnectionTestScheduleUpdateRequest
            {
                Id = schedule.Id,
                ApplicationId = application.Id,
                CronExpression = "invalid cron",
                IsEnabled = true
            };

            // Act & Assert
            await service.Invoking(s => s.UpdateScheduleAsync(request, userId))
                .Should().ThrowAsync<ArgumentException>()
                .WithMessage("Invalid cron expression:*");
        }

        #endregion

        #region DeleteScheduleAsync Tests

        [Fact]
        public async Task DeleteScheduleAsync_WithValidSchedule_DeletesScheduleAndReturnsTrue()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var userId = Guid.NewGuid();
            var application = new ApplicationBuilder()
                .WithUserId(userId)
                .WithName("Test App")
                .Build();

            context.Applications.Add(application);
            await context.SaveChangesAsync();

            var schedule = new ConnectionTestSchedule
            {
                ApplicationId = application.Id,
                CronExpression = "0 */5 * * *",
                IsEnabled = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            context.ConnectionTestSchedules.Add(schedule);
            await context.SaveChangesAsync();

            // Act
            var result = await service.DeleteScheduleAsync(schedule.Id, userId);

            // Assert
            result.Should().BeTrue();

            // Verify it was deleted
            var deletedSchedule = await context.ConnectionTestSchedules
                .FirstOrDefaultAsync(s => s.Id == schedule.Id);
            deletedSchedule.Should().BeNull();
        }

        [Fact]
        public async Task DeleteScheduleAsync_WithInvalidScheduleId_ReturnsFalse()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            // Act
            var result = await service.DeleteScheduleAsync(Guid.NewGuid(), Guid.NewGuid());

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public async Task DeleteScheduleAsync_WithUnauthorizedUser_ReturnsFalse()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var application = new ApplicationBuilder()
                .WithUserId(Guid.NewGuid())
                .WithName("Test App")
                .Build();

            context.Applications.Add(application);
            await context.SaveChangesAsync();

            var schedule = new ConnectionTestSchedule
            {
                ApplicationId = application.Id,
                CronExpression = "0 */5 * * *",
                IsEnabled = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            context.ConnectionTestSchedules.Add(schedule);
            await context.SaveChangesAsync();

            // Act
            var result = await service.DeleteScheduleAsync(schedule.Id, Guid.NewGuid());

            // Assert
            result.Should().BeFalse();
        }

        #endregion

        #region ToggleScheduleAsync Tests

        [Fact]
        public async Task ToggleScheduleAsync_WithValidSchedule_TogglesEnabledStatus()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var userId = Guid.NewGuid();
            var application = new ApplicationBuilder()
                .WithUserId(userId)
                .WithName("Test App")
                .Build();

            context.Applications.Add(application);
            await context.SaveChangesAsync();

            var schedule = new ConnectionTestSchedule
            {
                ApplicationId = application.Id,
                CronExpression = "0 */5 * * *",
                IsEnabled = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            context.ConnectionTestSchedules.Add(schedule);
            await context.SaveChangesAsync();

            // Act
            var result = await service.ToggleScheduleAsync(schedule.Id, true, userId);

            // Assert
            result.Should().NotBeNull();
            result!.IsEnabled.Should().BeTrue();

            // Verify it was toggled
            var toggledSchedule = await context.ConnectionTestSchedules
                .FirstOrDefaultAsync(s => s.Id == schedule.Id);
            toggledSchedule.Should().NotBeNull();
            toggledSchedule!.IsEnabled.Should().BeTrue();
        }

        [Fact]
        public async Task ToggleScheduleAsync_WithInvalidScheduleId_ReturnsNull()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            // Act
            var result = await service.ToggleScheduleAsync(Guid.NewGuid(), true, Guid.NewGuid());

            // Assert
            result.Should().BeNull();
        }

        #endregion

        #region ValidateCronExpressionAsync Tests

        [Theory]
        [InlineData("* * * * *", true, "Every minute")]
        [InlineData("0 * * * *", true, "Every hour at minute 0")]
        [InlineData("0 0 * * *", true, "Daily at 0:00")]
        [InlineData("0 0 * * 1", true, "Weekly on day 1 at 0:00")]
        [InlineData("0 0 1 * *", true, "Monthly on day 1 at 0:00")]
        [InlineData("*/5 * * * *", true, "Every hour at minute */5")]
        [InlineData("invalid", false, null)]
        [InlineData("* * * *", false, null)]
        [InlineData("", false, null)]
        public async Task ValidateCronExpressionAsync_WithVariousExpressions_ReturnsExpectedResult(
            string expression, bool expectedValid, string? expectedDescription)
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            // Act
            var result = await service.ValidateCronExpressionAsync(expression);

            // Assert
            result.IsValid.Should().Be(expectedValid);
            if (expectedValid)
            {
                result.Description.Should().Be(expectedDescription);
                result.NextRunTime.Should().NotBeNull();
                result.ErrorMessage.Should().BeNull();
            }
            else
            {
                result.Description.Should().BeNull();
                result.NextRunTime.Should().BeNull();
                result.ErrorMessage.Should().NotBeNullOrEmpty();
            }
        }

        #endregion

        #region CalculateNextRunTime Tests

        [Theory]
        [InlineData("* * * * *")]
        [InlineData("0 * * * *")]
        [InlineData("0 0 * * *")]
        [InlineData("*/5 * * * *")]
        public void CalculateNextRunTime_WithValidCronExpression_ReturnsNextRunTime(string cronExpression)
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);
            var beforeCalculation = DateTime.UtcNow;

            // Act
            var result = service.CalculateNextRunTime(cronExpression);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeAfter(beforeCalculation);
        }

        [Theory]
        [InlineData("invalid")]
        [InlineData("")]
        [InlineData("* * * *")]
        public void CalculateNextRunTime_WithInvalidCronExpression_ReturnsNull(string cronExpression)
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            // Act
            var result = service.CalculateNextRunTime(cronExpression);

            // Assert
            result.Should().BeNull();
        }

        #endregion

        #region UpdateScheduleRunStatusAsync Tests

        [Fact]
        public async Task UpdateScheduleRunStatusAsync_WithValidSchedule_UpdatesRunStatus()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var schedule = new ConnectionTestSchedule
            {
                ApplicationId = Guid.NewGuid(),
                CronExpression = "0 */5 * * *",
                IsEnabled = true,
                CreatedAt = DateTime.UtcNow.AddMinutes(-5),
                UpdatedAt = DateTime.UtcNow.AddMinutes(-5)
            };

            context.ConnectionTestSchedules.Add(schedule);
            await context.SaveChangesAsync();

            var originalUpdatedAt = schedule.UpdatedAt;

            // Act
            await service.UpdateScheduleRunStatusAsync(
                schedule.Id, 
                "success", 
                "All connections tested successfully",
                TimeSpan.FromSeconds(2.5));

            // Assert
            var updatedSchedule = await context.ConnectionTestSchedules
                .FirstOrDefaultAsync(s => s.Id == schedule.Id);
            
            updatedSchedule.Should().NotBeNull();
            updatedSchedule!.LastRunStatus.Should().Be("success");
            updatedSchedule.LastRunMessage.Should().Be("All connections tested successfully");
            updatedSchedule.LastRunDuration.Should().Be(TimeSpan.FromSeconds(2.5));
            updatedSchedule.LastRunTime.Should().NotBeNull();
            updatedSchedule.LastRunTime.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
            updatedSchedule.NextRunTime.Should().NotBeNull();
            updatedSchedule.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        }

        [Fact]
        public async Task UpdateScheduleRunStatusAsync_WithInvalidScheduleId_DoesNotThrow()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            // Act & Assert
            await service.Invoking(s => s.UpdateScheduleRunStatusAsync(Guid.NewGuid(), "success"))
                .Should().NotThrowAsync();
        }

        #endregion
    }
}