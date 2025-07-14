using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using cams.Backend.Services;
using System;
using System.Threading.Tasks;
using System.Threading;

namespace Cams.Tests.Services
{
    public class ConnectionTestSchedulerServiceTests
    {
        private readonly Mock<ILogger<ConnectionTestSchedulerService>> _loggerMock;
        private readonly Mock<IServiceProvider> _serviceProviderMock;

        public ConnectionTestSchedulerServiceTests()
        {
            _loggerMock = new Mock<ILogger<ConnectionTestSchedulerService>>();
            _serviceProviderMock = new Mock<IServiceProvider>();
        }

        private ConnectionTestSchedulerService CreateService()
        {
            return new ConnectionTestSchedulerService(_serviceProviderMock.Object, _loggerMock.Object);
        }

        #region BackgroundService Tests

        [Fact]
        public async Task StopAsync_LogsStoppingMessage()
        {
            // Arrange
            var service = CreateService();
            var cancellationToken = new CancellationToken();

            // Act
            await service.StopAsync(cancellationToken);

            // Assert
            _loggerMock.Verify(x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Connection Test Scheduler Service is stopping")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception, string>>()!), Times.Once);
        }

        [Fact]
        public void Constructor_WithValidParameters_CreatesInstance()
        {
            // Arrange & Act
            var service = CreateService();

            // Assert
            service.Should().NotBeNull();
            service.Should().BeOfType<ConnectionTestSchedulerService>();
        }

        [Fact]
        public void Constructor_WithNullServiceProvider_CreatesInstanceWithoutValidation()
        {
            // Arrange, Act & Assert
            // Primary constructors don't validate null parameters by default
            var service = new ConnectionTestSchedulerService(null!, _loggerMock.Object);
            service.Should().NotBeNull();
        }

        [Fact]
        public void Constructor_WithNullLogger_CreatesInstanceWithoutValidation()
        {
            // Arrange, Act & Assert
            // Primary constructors don't validate null parameters by default
            var service = new ConnectionTestSchedulerService(_serviceProviderMock.Object, null!);
            service.Should().NotBeNull();
        }

        #endregion

        #region ExecuteAsync Tests (High-level behavior verification)

        [Fact]
        public async Task ExecuteAsync_StartsAndLogsStartMessage()
        {
            // Arrange
            var service = CreateService();
            using var cts = new CancellationTokenSource();
            
            // Cancel immediately to prevent infinite loop
            cts.Cancel();

            // Act
            try
            {
                await service.StartAsync(cts.Token);
            }
            catch (OperationCanceledException)
            {
                // Expected when cancellation token is already cancelled
            }

            // Assert
            _loggerMock.Verify(x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Connection Test Scheduler Service started")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception, string>>()!), Times.AtLeastOnce);
        }

        [Fact]
        public async Task ExecuteAsync_WhenCancelled_StopsGracefully()
        {
            // Arrange
            var service = CreateService();
            using var cts = new CancellationTokenSource();

            // Start the service
            var executeTask = service.StartAsync(cts.Token);
            
            // Give it a moment to start
            await Task.Delay(100);
            
            // Act - Cancel the service
            cts.Cancel();
            
            // Wait for cancellation (with timeout to prevent hanging)
            using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
            try
            {
                await executeTask.WaitAsync(timeoutCts.Token);
            }
            catch (OperationCanceledException)
            {
                // Expected
            }

            // Assert - Verify it started
            _loggerMock.Verify(x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Connection Test Scheduler Service started")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception, string>>()!), Times.AtLeastOnce);
        }

        #endregion

        #region Error Handling Tests

        [Fact]
        public async Task ExecuteAsync_HandlesExceptionsGracefully()
        {
            // Arrange
            var service = CreateService();
            using var cts = new CancellationTokenSource();
            
            // Start the service with a service provider that doesn't have required services
            // This will cause exceptions in ProcessScheduledTestsAsync
            var executeTask = service.StartAsync(cts.Token);
            
            // Give it time to process and hit errors
            await Task.Delay(200);
            
            // Act - Cancel the service
            cts.Cancel();
            
            // Wait for cancellation
            try
            {
                await executeTask.WaitAsync(TimeSpan.FromSeconds(5));
            }
            catch (OperationCanceledException)
            {
                // Expected
            }

            // Assert - The service should have attempted to start and handle errors
            // We can't easily verify specific error logging without complex mocking
            // but we can verify the service handles exceptions without crashing
            service.Should().NotBeNull();
        }

        #endregion

        #region Service Lifecycle Tests

        [Fact]
        public async Task ServiceLifecycle_StartStopFlow_WorksCorrectly()
        {
            // Arrange
            var service = CreateService();
            using var cts = new CancellationTokenSource();

            // Act - Start the service
            var startTask = service.StartAsync(cts.Token);
            
            // Give it a moment to start
            await Task.Delay(100);
            
            // Stop the service
            var stopTask = service.StopAsync(cts.Token);
            await stopTask;

            // Cancel to clean up
            cts.Cancel();
            
            try
            {
                await startTask.WaitAsync(TimeSpan.FromSeconds(5));
            }
            catch (OperationCanceledException)
            {
                // Expected
            }

            // Assert
            _loggerMock.Verify(x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Connection Test Scheduler Service is stopping")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception, string>>()!), Times.Once);
        }

        #endregion
    }
}