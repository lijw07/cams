using Microsoft.EntityFrameworkCore;
using NCrontab;
using cams.Backend.Data;
using cams.Backend.Model;
using cams.Backend.View;

namespace cams.Backend.Services
{
    /// <summary>
    /// Background service that executes scheduled connection tests
    /// </summary>
    public class ConnectionTestSchedulerService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ConnectionTestSchedulerService> _logger;
        private readonly TimeSpan _pollingInterval = TimeSpan.FromMinutes(1); // Check every minute

        public ConnectionTestSchedulerService(
            IServiceProvider serviceProvider,
            ILogger<ConnectionTestSchedulerService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Connection Test Scheduler Service started");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessScheduledTestsAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while processing scheduled connection tests");
                }

                await Task.Delay(_pollingInterval, stoppingToken);
            }

            _logger.LogInformation("Connection Test Scheduler Service stopped");
        }

        private async Task ProcessScheduledTestsAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var databaseConnectionService = scope.ServiceProvider.GetRequiredService<IDatabaseConnectionService>();
            var connectionTestScheduleService = scope.ServiceProvider.GetRequiredService<IConnectionTestScheduleService>();

            var currentTime = DateTime.UtcNow;

            // Get all enabled schedules that are due to run
            var dueSchedules = await context.ConnectionTestSchedules
                .Include(s => s.Application)
                    .ThenInclude(a => a.DatabaseConnections)
                .Where(s => s.IsEnabled && s.NextRunTime <= currentTime)
                .ToListAsync();

            _logger.LogDebug("Found {Count} schedules due for execution", dueSchedules.Count);

            foreach (var schedule in dueSchedules)
            {
                await ExecuteScheduledTestAsync(schedule, databaseConnectionService, connectionTestScheduleService);
            }
        }

        private async Task ExecuteScheduledTestAsync(
            ConnectionTestSchedule schedule,
            IDatabaseConnectionService databaseConnectionService,
            IConnectionTestScheduleService connectionTestScheduleService)
        {
            var startTime = DateTime.UtcNow;
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();

            try
            {
                _logger.LogInformation("Executing scheduled connection test for application {ApplicationId} (Schedule: {ScheduleId})", 
                    schedule.ApplicationId, schedule.Id);

                // Get all active database connections for this application
                var connections = await databaseConnectionService.GetUserConnectionsAsync(
                    schedule.Application.UserId, 
                    schedule.ApplicationId);

                var activeConnections = connections.Where(c => c.IsActive).ToList();

                if (!activeConnections.Any())
                {
                    await connectionTestScheduleService.UpdateScheduleRunStatusAsync(
                        schedule.Id,
                        "skipped",
                        "No active database connections found",
                        stopwatch.Elapsed);

                    _logger.LogWarning("No active connections found for application {ApplicationId}", schedule.ApplicationId);
                    return;
                }

                var testResults = new List<DatabaseConnectionTestResponse>();
                var successCount = 0;
                var failCount = 0;

                // Test each connection
                foreach (var connection in activeConnections)
                {
                    try
                    {
                        var testRequest = new DatabaseConnectionTestRequest
                        {
                            ConnectionId = connection.Id
                        };

                        var testResult = await databaseConnectionService.TestConnectionAsync(
                            testRequest, 
                            schedule.Application.UserId);

                        testResults.Add(testResult);

                        if (testResult.IsSuccessful)
                        {
                            successCount++;
                            _logger.LogDebug("Connection test successful for connection {ConnectionId} ({ConnectionName})", 
                                connection.Id, connection.Name);
                        }
                        else
                        {
                            failCount++;
                            _logger.LogWarning("Connection test failed for connection {ConnectionId} ({ConnectionName}): {Error}", 
                                connection.Id, connection.Name, testResult.Message);
                        }
                    }
                    catch (Exception ex)
                    {
                        failCount++;
                        _logger.LogError(ex, "Error testing connection {ConnectionId} ({ConnectionName})", 
                            connection.Id, connection.Name);
                    }
                }

                stopwatch.Stop();

                // Update schedule with results
                var status = failCount == 0 ? "success" : (successCount == 0 ? "failed" : "partial");
                var message = $"Tested {activeConnections.Count} connections: {successCount} successful, {failCount} failed";

                await connectionTestScheduleService.UpdateScheduleRunStatusAsync(
                    schedule.Id,
                    status,
                    message,
                    stopwatch.Elapsed);

                _logger.LogInformation("Completed scheduled connection test for application {ApplicationId}. " +
                    "Status: {Status}, Duration: {Duration}ms", 
                    schedule.ApplicationId, status, stopwatch.ElapsedMilliseconds);
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                _logger.LogError(ex, "Error executing scheduled connection test for application {ApplicationId}", 
                    schedule.ApplicationId);

                try
                {
                    await connectionTestScheduleService.UpdateScheduleRunStatusAsync(
                        schedule.Id,
                        "error",
                        $"Test execution failed: {ex.Message}",
                        stopwatch.Elapsed);
                }
                catch (Exception updateEx)
                {
                    _logger.LogError(updateEx, "Failed to update schedule status after error for schedule {ScheduleId}", schedule.Id);
                }
            }
        }

        public override async Task StopAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Connection Test Scheduler Service is stopping");
            await base.StopAsync(stoppingToken);
        }
    }
}