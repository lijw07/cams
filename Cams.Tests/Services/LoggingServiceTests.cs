using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using cams.Backend.Services;
using cams.Backend.Data;
using cams.Backend.Model;
using Cams.Tests.Fixtures;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using Cams.Tests.Builders;

namespace Cams.Tests.Services
{
    public class LoggingServiceTests : IClassFixture<DatabaseFixture>
    {
        private readonly DatabaseFixture _fixture;
        private readonly Mock<ILogger<LoggingService>> _loggerMock;

        public LoggingServiceTests(DatabaseFixture fixture)
        {
            _fixture = fixture;
            _loggerMock = new Mock<ILogger<LoggingService>>();
        }

        private LoggingService CreateService(ApplicationDbContext context)
        {
            return new LoggingService(_loggerMock.Object, context);
        }

        #region Audit Log Tests

        [Fact]
        public async Task LogAuditAsync_WithValidData_CreatesAuditLog()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var userId = Guid.NewGuid();
            var entityId = Guid.NewGuid();

            // Act
            await service.LogAuditAsync(
                userId,
                "Create",
                "Application",
                entityId,
                "Test App",
                null,
                "New application created",
                "Created test application",
                "192.168.1.1",
                "Mozilla/5.0",
                "Information");

            // Assert
            var auditLog = await context.AuditLogs.FirstOrDefaultAsync();
            auditLog.Should().NotBeNull();
            auditLog!.UserId.Should().Be(userId);
            auditLog.Action.Should().Be("Create");
            auditLog.EntityType.Should().Be("Application");
            auditLog.EntityId.Should().Be(entityId.ToString());
            auditLog.EntityName.Should().Be("Test App");
            auditLog.NewValues.Should().Be("New application created");
            auditLog.Description.Should().Be("Created test application");
            auditLog.IpAddress.Should().Be("192.168.1.1");
            auditLog.UserAgent.Should().Be("Mozilla/5.0");
            auditLog.Severity.Should().Be("Information");
            auditLog.Timestamp.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        }

        [Fact]
        public async Task LogAuditAsync_WithMinimalData_CreatesAuditLogWithDefaults()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var userId = Guid.NewGuid();

            // Act
            await service.LogAuditAsync(userId, "Update", "User");

            // Assert
            var auditLog = await context.AuditLogs.FirstOrDefaultAsync();
            auditLog.Should().NotBeNull();
            auditLog!.UserId.Should().Be(userId);
            auditLog.Action.Should().Be("Update");
            auditLog.EntityType.Should().Be("User");
            auditLog.EntityName.Should().Be("");
            auditLog.IpAddress.Should().Be("Unknown");
            auditLog.Severity.Should().Be("Information");
        }

        [Fact]
        public async Task GetAuditLogsAsync_WithNoFilters_ReturnsAllLogs()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var user1 = new UserBuilder().WithUsername("user1").Build();
            var user2 = new UserBuilder().WithUsername("user2").Build();
            context.Users.AddRange(user1, user2);
            await context.SaveChangesAsync();

            // Create test audit logs
            await service.LogAuditAsync(user1.Id, "Create", "Application");
            await service.LogAuditAsync(user2.Id, "Update", "User");
            await service.LogAuditAsync(user1.Id, "Delete", "Application");

            // Act
            var logs = await service.GetAuditLogsAsync();

            // Assert
            logs.Should().HaveCount(3);
            logs.Should().BeInDescendingOrder(l => l.Timestamp);
        }

        [Fact]
        public async Task GetAuditLogsAsync_WithUserIdFilter_ReturnsFilteredLogs()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var user1 = new UserBuilder().WithUsername("user1").Build();
            var user2 = new UserBuilder().WithUsername("user2").Build();
            context.Users.AddRange(user1, user2);
            await context.SaveChangesAsync();

            await service.LogAuditAsync(user1.Id, "Create", "Application");
            await service.LogAuditAsync(user2.Id, "Update", "User");
            await service.LogAuditAsync(user1.Id, "Delete", "Application");

            // Act
            var logs = await service.GetAuditLogsAsync(userId: user1.Id);

            // Assert
            logs.Should().HaveCount(2);
            logs.Should().OnlyContain(l => l.UserId == user1.Id);
        }

        [Fact]
        public async Task GetAuditLogsAsync_WithEntityTypeFilter_ReturnsFilteredLogs()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var user = new UserBuilder().WithUsername("testuser").Build();
            context.Users.Add(user);
            await context.SaveChangesAsync();

            await service.LogAuditAsync(user.Id, "Create", "Application");
            await service.LogAuditAsync(user.Id, "Update", "User");
            await service.LogAuditAsync(user.Id, "Delete", "Application");

            // Act
            var logs = await service.GetAuditLogsAsync(entityType: "Application");

            // Assert
            logs.Should().HaveCount(2);
            logs.Should().OnlyContain(l => l.EntityType == "Application");
        }

        [Fact]
        public async Task GetAuditLogsAsync_WithDateFilter_ReturnsFilteredLogs()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var user = new UserBuilder().WithUsername("testuser").Build();
            context.Users.Add(user);
            await context.SaveChangesAsync();

            var fromDate = DateTime.UtcNow.AddDays(-1);

            await service.LogAuditAsync(user.Id, "Create", "Application");
            
            // Add an old log directly to the database
            var oldLog = new AuditLog
            {
                UserId = user.Id,
                Action = "Old",
                EntityType = "Test",
                EntityName = "",
                IpAddress = "Unknown",
                Timestamp = DateTime.UtcNow.AddDays(-2)
            };
            context.AuditLogs.Add(oldLog);
            await context.SaveChangesAsync();

            // Act
            var logs = await service.GetAuditLogsAsync(fromDate: fromDate);

            // Assert
            logs.Should().HaveCount(1);
            logs.Should().OnlyContain(l => l.Timestamp >= fromDate);
        }

        [Fact]
        public async Task GetAuditLogsAsync_WithPagination_ReturnsPagedResults()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var user = new UserBuilder().WithUsername("testuser").Build();
            context.Users.Add(user);
            await context.SaveChangesAsync();

            for (int i = 0; i < 5; i++)
            {
                await service.LogAuditAsync(user.Id, "Action" + i, "Entity");
            }

            // Act
            var page1 = await service.GetAuditLogsAsync(pageSize: 2, pageNumber: 1);
            var page2 = await service.GetAuditLogsAsync(pageSize: 2, pageNumber: 2);

            // Assert
            page1.Should().HaveCount(2);
            page2.Should().HaveCount(2);
            page1.Should().NotIntersectWith(page2);
        }

        [Fact]
        public async Task GetAuditLogsWithCountAsync_ReturnsDataAndTotalCount()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var user = new UserBuilder().WithUsername("testuser").Build();
            context.Users.Add(user);
            await context.SaveChangesAsync();

            for (int i = 0; i < 5; i++)
            {
                await service.LogAuditAsync(user.Id, "Action" + i, "Entity");
            }

            // Act
            var (data, totalCount) = await service.GetAuditLogsWithCountAsync(pageSize: 3, pageNumber: 1);

            // Assert
            data.Should().HaveCount(3);
            totalCount.Should().Be(5);
        }

        [Fact]
        public async Task GetAuditLogByIdAsync_WithValidId_ReturnsLog()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var user = new UserBuilder().WithUsername("testuser").Build();
            context.Users.Add(user);
            await context.SaveChangesAsync();

            await service.LogAuditAsync(user.Id, "Create", "Application");

            var log = await context.AuditLogs.FirstAsync();

            // Act
            var result = await service.GetAuditLogByIdAsync(log.Id);

            // Assert
            result.Should().NotBeNull();
            result!.Id.Should().Be(log.Id);
        }

        [Fact]
        public async Task GetAuditLogByIdAsync_WithInvalidId_ReturnsNull()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            // Act
            var result = await service.GetAuditLogByIdAsync(Guid.NewGuid());

            // Assert
            result.Should().BeNull();
        }

        #endregion

        #region Security Log Tests

        [Fact]
        public async Task LogSecurityEventAsync_WithValidData_CreatesSecurityLog()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var userId = Guid.NewGuid();

            // Act
            await service.LogSecurityEventAsync(
                "LoginAttempt",
                "Success",
                userId,
                "testuser",
                "Successful login",
                "192.168.1.1",
                "Mozilla/5.0",
                "session123",
                "/login",
                "Additional data",
                "Information",
                null);

            // Assert
            var securityLog = await context.SecurityLogs.FirstOrDefaultAsync();
            securityLog.Should().NotBeNull();
            securityLog!.EventType.Should().Be("LoginAttempt");
            securityLog.Status.Should().Be("Success");
            securityLog.UserId.Should().Be(userId);
            securityLog.Username.Should().Be("testuser");
            securityLog.Description.Should().Be("Successful login");
            securityLog.IpAddress.Should().Be("192.168.1.1");
            securityLog.UserAgent.Should().Be("Mozilla/5.0");
            securityLog.SessionId.Should().Be("session123");
            securityLog.Resource.Should().Be("/login");
            securityLog.Metadata.Should().Be("Additional data");
            securityLog.Severity.Should().Be("Information");
            securityLog.RequiresAction.Should().BeFalse();
        }

        [Fact]
        public async Task LogSecurityEventAsync_WithCriticalSeverity_SetsRequiresAction()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            // Act
            await service.LogSecurityEventAsync("SecurityBreach", "Failed", severity: "Critical");

            // Assert
            var securityLog = await context.SecurityLogs.FirstOrDefaultAsync();
            securityLog.Should().NotBeNull();
            securityLog!.RequiresAction.Should().BeTrue();
        }

        [Fact]
        public async Task GetFailedLoginAttemptsAsync_WithThreshold_ReturnsFilteredResults()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var ipAddress = "192.168.1.100";

            // Create multiple failed login attempts from same IP
            for (int i = 0; i < 6; i++)
            {
                await service.LogSecurityEventAsync("LoginFailure", "Failed", ipAddress: ipAddress);
            }

            // Create failed attempts from different IP (below threshold)
            for (int i = 0; i < 3; i++)
            {
                await service.LogSecurityEventAsync("LoginFailure", "Failed", ipAddress: "192.168.1.200");
            }

            // Act
            var failedAttempts = await service.GetFailedLoginAttemptsAsync(threshold: 5);

            // Assert
            failedAttempts.Should().HaveCount(6);
            failedAttempts.Should().OnlyContain(l => l.IpAddress == ipAddress);
        }

        #endregion

        #region System Log Tests

        [Fact]
        public async Task LogSystemEventAsync_WithValidData_CreatesSystemLog()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var userId = Guid.NewGuid();

            // Act
            await service.LogSystemEventAsync(
                "ApplicationError",
                "Error",
                "UserController",
                "Database connection failed",
                "Connection timeout occurred",
                "Stack trace here",
                "corr-123",
                userId,
                "192.168.1.1",
                "/api/users",
                "GET",
                500,
                TimeSpan.FromMilliseconds(5000));

            // Assert
            var systemLog = await context.SystemLogs.FirstOrDefaultAsync();
            systemLog.Should().NotBeNull();
            systemLog!.EventType.Should().Be("ApplicationError");
            systemLog.Level.Should().Be("Error");
            systemLog.Source.Should().Be("UserController");
            systemLog.Message.Should().Be("Database connection failed");
            systemLog.Details.Should().Be("Connection timeout occurred");
            systemLog.StackTrace.Should().Be("Stack trace here");
            systemLog.CorrelationId.Should().Be("corr-123");
            systemLog.UserId.Should().Be(userId);
            systemLog.IpAddress.Should().Be("192.168.1.1");
            systemLog.RequestPath.Should().Be("/api/users");
            systemLog.HttpMethod.Should().Be("GET");
            systemLog.StatusCode.Should().Be(500);
            systemLog.Duration.Should().Be(TimeSpan.FromMilliseconds(5000));
            systemLog.MachineName.Should().Be(Environment.MachineName);
            systemLog.ProcessId.Should().Be(Environment.ProcessId.ToString());
            systemLog.IsResolved.Should().BeFalse(); // Error level should not be auto-resolved
        }

        [Fact]
        public async Task LogSystemEventAsync_WithInformationLevel_SetsIsResolvedTrue()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            // Act
            await service.LogSystemEventAsync("Info", "Information", "Source", "Message");

            // Assert
            var systemLog = await context.SystemLogs.FirstOrDefaultAsync();
            systemLog.Should().NotBeNull();
            systemLog!.IsResolved.Should().BeTrue();
        }

        [Fact]
        public async Task MarkSystemLogResolvedAsync_WithValidLog_MarksAsResolved()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            await service.LogSystemEventAsync("Error", "Error", "Source", "Message");
            var log = await context.SystemLogs.FirstAsync();
            var originalUpdatedTime = log.Timestamp;

            // Act
            await service.MarkSystemLogResolvedAsync(log.Id, "Issue fixed");

            // Assert
            var resolvedLog = await context.SystemLogs.FirstAsync();
            resolvedLog.IsResolved.Should().BeTrue();
            resolvedLog.ResolvedAt.Should().NotBeNull();
            resolvedLog.ResolvedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
            resolvedLog.ResolutionNotes.Should().Be("Issue fixed");
        }

        [Fact]
        public async Task MarkSystemLogResolvedAsync_WithInvalidId_DoesNothing()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            // Act & Assert - Should not throw
            await service.MarkSystemLogResolvedAsync(Guid.NewGuid(), "Notes");
        }

        #endregion

        #region Performance Log Tests

        [Fact]
        public async Task LogPerformanceAsync_WithValidData_CreatesPerformanceLog()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var userId = Guid.NewGuid();
            var duration = TimeSpan.FromMilliseconds(250);

            // Act
            await service.LogPerformanceAsync(
                "GetUsers",
                duration,
                "UserController",
                "Index",
                "/api/users",
                "GET",
                userId,
                200,
                TimeSpan.FromMilliseconds(50),
                TimeSpan.FromMilliseconds(100),
                1024,
                2048,
                "192.168.1.1",
                "Mozilla/5.0",
                "corr-123",
                3,
                2,
                1,
                "metadata");

            // Assert
            var performanceLog = await context.PerformanceLogs.FirstOrDefaultAsync();
            performanceLog.Should().NotBeNull();
            performanceLog!.Operation.Should().Be("GetUsers");
            performanceLog.Duration.Should().Be(duration);
            performanceLog.Controller.Should().Be("UserController");
            performanceLog.Action.Should().Be("Index");
            performanceLog.RequestPath.Should().Be("/api/users");
            performanceLog.HttpMethod.Should().Be("GET");
            performanceLog.UserId.Should().Be(userId);
            performanceLog.StatusCode.Should().Be(200);
            performanceLog.DatabaseTime.Should().Be(TimeSpan.FromMilliseconds(50));
            performanceLog.ExternalServiceTime.Should().Be(TimeSpan.FromMilliseconds(100));
            performanceLog.RequestSizeBytes.Should().Be(1024);
            performanceLog.ResponseSizeBytes.Should().Be(2048);
            performanceLog.IpAddress.Should().Be("192.168.1.1");
            performanceLog.UserAgent.Should().Be("Mozilla/5.0");
            performanceLog.CorrelationId.Should().Be("corr-123");
            performanceLog.DatabaseQueryCount.Should().Be(3);
            performanceLog.CacheHitCount.Should().Be(2);
            performanceLog.CacheMissCount.Should().Be(1);
            performanceLog.Metadata.Should().Be("metadata");
            performanceLog.PerformanceLevel.Should().Be("Good"); // 250ms should be "Good"
            performanceLog.IsSlowQuery.Should().BeFalse();
        }

        [Fact]
        public async Task LogPerformanceAsync_WithSlowDuration_MarksAsSlowQuery()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var slowDuration = TimeSpan.FromMilliseconds(5000); // 5 seconds

            // Act
            await service.LogPerformanceAsync("SlowOperation", slowDuration);

            // Assert
            var performanceLog = await context.PerformanceLogs.FirstOrDefaultAsync();
            performanceLog.Should().NotBeNull();
            performanceLog!.IsSlowQuery.Should().BeTrue();
            performanceLog.PerformanceLevel.Should().Be("Critical");
        }

        [Fact]
        public async Task GetPerformanceMetricsAsync_WithValidData_ReturnsMetrics()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            // Create test performance logs
            var durations = new[] { 100, 200, 300, 500, 1000 }; // ms
            foreach (var duration in durations)
            {
                await service.LogPerformanceAsync("TestOp", TimeSpan.FromMilliseconds(duration), statusCode: duration > 400 ? 500 : 200);
            }

            // Act
            var metrics = await service.GetPerformanceMetricsAsync();

            // Assert
            metrics.Should().NotBeNull();
            metrics.TotalRequests.Should().Be(5);
            metrics.AverageResponseTime.Should().Be(420); // (100+200+300+500+1000)/5
            metrics.MedianResponseTime.Should().Be(300);
            metrics.ErrorRequests.Should().Be(2); // 500ms and 1000ms had status 500
            metrics.ErrorRate.Should().Be(40); // 2/5 * 100
            metrics.ResponseTimeDistribution.Should().ContainKeys("0-100ms", "101-300ms", "301-1000ms");
            metrics.OperationAverages.Should().ContainKey("TestOp");
        }

        [Fact]
        public async Task GetPerformanceMetricsAsync_WithNoData_ReturnsEmptyMetrics()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            // Act
            var metrics = await service.GetPerformanceMetricsAsync();

            // Assert
            metrics.Should().NotBeNull();
            metrics.TotalRequests.Should().Be(0);
            metrics.AverageResponseTime.Should().Be(0);
        }

        #endregion

        #region Cleanup Tests

        [Fact]
        public async Task CleanupAuditLogsAsync_RemovesOldLogs()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            var userId = Guid.NewGuid();

            // Create recent log
            await service.LogAuditAsync(userId, "Recent", "Entity");

            // Create old log directly in database
            var oldLog = new AuditLog
            {
                UserId = userId,
                Action = "Old",
                EntityType = "Entity",
                EntityName = "",
                IpAddress = "Unknown",
                Timestamp = DateTime.UtcNow.AddDays(-400) // Older than default 365 days
            };
            context.AuditLogs.Add(oldLog);
            await context.SaveChangesAsync();

            // Act
            await service.CleanupAuditLogsAsync(365);

            // Assert
            var remainingLogs = await context.AuditLogs.ToListAsync();
            remainingLogs.Should().HaveCount(1);
            remainingLogs.Single().Action.Should().Be("Recent");
        }

        [Fact]
        public async Task CleanupSecurityLogsAsync_RemovesOldLogs()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            // Create recent log
            await service.LogSecurityEventAsync("Recent", "Status");

            // Create old log directly in database
            var oldLog = new SecurityLog
            {
                EventType = "Old",
                Status = "Status",
                IpAddress = "Unknown",
                Timestamp = DateTime.UtcNow.AddDays(-200) // Older than default 180 days
            };
            context.SecurityLogs.Add(oldLog);
            await context.SaveChangesAsync();

            // Act
            await service.CleanupSecurityLogsAsync(180);

            // Assert
            var remainingLogs = await context.SecurityLogs.ToListAsync();
            remainingLogs.Should().HaveCount(1);
            remainingLogs.Single().EventType.Should().Be("Recent");
        }

        [Fact]
        public async Task CleanupSystemLogsAsync_RemovesOldLogs()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            // Create recent log
            await service.LogSystemEventAsync("Recent", "Info", "Source", "Message");

            // Create old log directly in database
            var oldLog = new SystemLog
            {
                EventType = "Old",
                Level = "Info",
                Source = "Source",
                Message = "Message",
                MachineName = Environment.MachineName,
                ProcessId = Environment.ProcessId.ToString(),
                ThreadId = Thread.CurrentThread.ManagedThreadId.ToString(),
                Timestamp = DateTime.UtcNow.AddDays(-100) // Older than default 90 days
            };
            context.SystemLogs.Add(oldLog);
            await context.SaveChangesAsync();

            // Act
            await service.CleanupSystemLogsAsync(90);

            // Assert
            var remainingLogs = await context.SystemLogs.ToListAsync();
            remainingLogs.Should().HaveCount(1);
            remainingLogs.Single().EventType.Should().Be("Recent");
        }

        [Fact]
        public async Task CleanupPerformanceLogsAsync_RemovesOldLogs()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            // Create recent log
            await service.LogPerformanceAsync("Recent", TimeSpan.FromMilliseconds(100));

            // Create old log directly in database
            var oldLog = new PerformanceLog
            {
                Operation = "Old",
                Duration = TimeSpan.FromMilliseconds(100),
                StatusCode = 200,
                PerformanceLevel = "Good",
                Timestamp = DateTime.UtcNow.AddDays(-40) // Older than default 30 days
            };
            context.PerformanceLogs.Add(oldLog);
            await context.SaveChangesAsync();

            // Act
            await service.CleanupPerformanceLogsAsync(30);

            // Assert
            var remainingLogs = await context.PerformanceLogs.ToListAsync();
            remainingLogs.Should().HaveCount(1);
            remainingLogs.Single().Operation.Should().Be("Recent");
        }

        [Fact]
        public async Task CleanupOldLogsAsync_CallsAllCleanupMethods()
        {
            // Arrange
            using var context = _fixture.CreateContext();
            var service = CreateService(context);

            // Create logs of different types that should be cleaned up
            await service.LogAuditAsync(Guid.NewGuid(), "Action", "Entity");
            await service.LogSecurityEventAsync("Event", "Status");
            await service.LogSystemEventAsync("Event", "Info", "Source", "Message");
            await service.LogPerformanceAsync("Operation", TimeSpan.FromMilliseconds(100));

            var initialAuditCount = await context.AuditLogs.CountAsync();
            var initialSecurityCount = await context.SecurityLogs.CountAsync();
            var initialSystemCount = await context.SystemLogs.CountAsync();
            var initialPerformanceCount = await context.PerformanceLogs.CountAsync();

            // Act
            await service.CleanupOldLogsAsync(90);

            // Assert - Recent logs should still be there since they're not old enough
            (await context.AuditLogs.CountAsync()).Should().Be(initialAuditCount);
            (await context.SecurityLogs.CountAsync()).Should().Be(initialSecurityCount);
            (await context.SystemLogs.CountAsync()).Should().Be(initialSystemCount);
            (await context.PerformanceLogs.CountAsync()).Should().Be(initialPerformanceCount);
        }

        #endregion
    }
}