using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using cams.Backend.Services;
using cams.Backend.View;
using cams.Backend.Helpers;
using Backend.Helpers;
using cams.Backend.Enums;

namespace cams.Backend.Controller
{
    [ApiController]
    [Route("connection-test-schedules")]
    [Authorize]
    public class ConnectionTestScheduleController(
        IConnectionTestScheduleService scheduleService,
        ILogger<ConnectionTestScheduleController> logger,
        ILoggingService loggingService)
        : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetSchedules()
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                logger.LogInformation("User {UserId} requested connection test schedules", userId);
                
                var schedules = await scheduleService.GetUserSchedulesAsync(userId);
                
                logger.LogInformation("Retrieved {ScheduleCount} connection test schedules for user {UserId}", 
                    schedules.Count(), userId);
                
                // Log audit event
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.Read.ToString(),
                    "ConnectionTestSchedule",
                    description: $"Retrieved {schedules.Count()} connection test schedules",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );
                
                return Ok(schedules);
            }
            catch (UnauthorizedAccessException)
            {
                logger.LogWarning("Unauthorized access attempt to connection test schedules");
                return HttpResponseHelper.CreateUnauthorizedResponse();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving connection test schedules for user {UserId}", UserHelper.GetCurrentUserId(User));
                return HttpResponseHelper.CreateErrorResponse("Error retrieving connection test schedules");
            }
        }

        [HttpGet("application/{applicationId}")]
        public async Task<IActionResult> GetScheduleByApplicationId(Guid applicationId)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                logger.LogInformation("User {UserId} requested connection test schedule for application {ApplicationId}", userId, applicationId);
                
                var schedule = await scheduleService.GetScheduleByApplicationIdAsync(applicationId, userId);
                
                if (schedule == null)
                {
                    logger.LogInformation("No connection test schedule found for application {ApplicationId} and user {UserId}", applicationId, userId);
                    return NotFound(new { message = "Schedule not found for this application" });
                }

                logger.LogInformation("Retrieved connection test schedule {ScheduleId} for application {ApplicationId} and user {UserId}", 
                    schedule.Id, applicationId, userId);
                
                // Log audit event
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.Read.ToString(),
                    "ConnectionTestSchedule",
                    entityId: schedule.Id,
                    description: $"Retrieved connection test schedule for application {applicationId}",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );
                
                return Ok(schedule);
            }
            catch (UnauthorizedAccessException)
            {
                logger.LogWarning("Unauthorized access attempt to connection test schedule for application {ApplicationId}", applicationId);
                return HttpResponseHelper.CreateUnauthorizedResponse();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving connection test schedule for application {ApplicationId} and user {UserId}", applicationId, UserHelper.GetCurrentUserId(User));
                return HttpResponseHelper.CreateErrorResponse("Error retrieving connection test schedule");
            }
        }

        [HttpPost]
        public async Task<IActionResult> UpsertSchedule([FromBody] ConnectionTestScheduleRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return HttpResponseHelper.CreateValidationErrorResponse(
                        ModelState.Where(x => x.Value?.Errors.Count > 0)
                            .ToDictionary(
                                kvp => kvp.Key,
                                kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? Array.Empty<string>()
                            ));
                }

                var userId = UserHelper.GetCurrentUserId(User);
                logger.LogInformation("User {UserId} creating/updating connection test schedule for application {ApplicationId}", 
                    userId, request.ApplicationId);
                
                var schedule = await scheduleService.UpsertScheduleAsync(request, userId);
                
                logger.LogInformation("Successfully created/updated connection test schedule {ScheduleId} for application {ApplicationId} and user {UserId}", 
                    schedule.Id, request.ApplicationId, userId);
                
                // Log audit event
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.CreateOrUpdate.ToString(),
                    "ConnectionTestSchedule",
                    entityId: schedule.Id,
                    newValues: $"ApplicationId: {request.ApplicationId}, CronExpression: {LoggingHelper.Sanitize(request.CronExpression)}, IsEnabled: {request.IsEnabled}",
                    description: "Created or updated connection test schedule",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );
                
                return Ok(schedule);
            }
            catch (UnauthorizedAccessException ex)
            {
                logger.LogWarning("Unauthorized access attempt to create/update connection test schedule: {ErrorMessage}", ex.Message);
                return HttpResponseHelper.CreateUnauthorizedResponse(ex.Message);
            }
            catch (ArgumentException ex)
            {
                logger.LogWarning("Invalid connection test schedule request from user {UserId}: {ErrorMessage}", 
                    UserHelper.GetCurrentUserId(User), ex.Message);
                return HttpResponseHelper.CreateBadRequestResponse(ex.Message);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error creating/updating connection test schedule for application {ApplicationId} and user {UserId}", 
                    request.ApplicationId, UserHelper.GetCurrentUserId(User));
                return HttpResponseHelper.CreateErrorResponse("Error creating/updating connection test schedule");
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSchedule(Guid id, [FromBody] ConnectionTestScheduleRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return HttpResponseHelper.CreateValidationErrorResponse(
                        ModelState.Where(x => x.Value?.Errors.Count > 0)
                            .ToDictionary(
                                kvp => kvp.Key,
                                kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? Array.Empty<string>()
                            ));
                }

                var userId = UserHelper.GetCurrentUserId(User);
                var updateRequest = new ConnectionTestScheduleUpdateRequest
                {
                    Id = id,
                    ApplicationId = request.ApplicationId,
                    CronExpression = request.CronExpression,
                    IsEnabled = request.IsEnabled
                };
                
                var schedule = await scheduleService.UpdateScheduleAsync(updateRequest, userId);
                
                if (schedule == null)
                {
                    return HttpResponseHelper.CreateNotFoundResponse("Schedule");
                }
                
                logger.LogInformation("Successfully updated connection test schedule {ScheduleId} for user {UserId}", id, userId);
                
                // Log audit event
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.Update.ToString(),
                    "ConnectionTestSchedule",
                    entityId: schedule.Id,
                    newValues: $"CronExpression: {LoggingHelper.Sanitize(request.CronExpression)}, IsEnabled: {request.IsEnabled}",
                    description: "Updated connection test schedule",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );
                
                return Ok(schedule);
            }
            catch (UnauthorizedAccessException)
            {
                return HttpResponseHelper.CreateUnauthorizedResponse();
            }
            catch (ArgumentException ex)
            {
                return HttpResponseHelper.CreateBadRequestResponse(ex.Message);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error updating connection test schedule {ScheduleId}", id);
                return HttpResponseHelper.CreateErrorResponse("Error updating connection test schedule");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSchedule(Guid id)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                var deleted = await scheduleService.DeleteScheduleAsync(id, userId);
                
                if (!deleted)
                {
                    return HttpResponseHelper.CreateNotFoundResponse("Schedule");
                }
                
                logger.LogInformation("Successfully deleted connection test schedule {ScheduleId} for user {UserId}", id, userId);
                
                // Log audit event
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.Delete.ToString(),
                    "ConnectionTestSchedule",
                    entityId: id,
                    description: "Deleted connection test schedule",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );
                
                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return HttpResponseHelper.CreateUnauthorizedResponse();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error deleting connection test schedule {ScheduleId}", id);
                return HttpResponseHelper.CreateErrorResponse("Error deleting connection test schedule");
            }
        }

        [HttpPatch("{id}/toggle")]
        public async Task<IActionResult> ToggleSchedule(Guid id, [FromBody] ToggleScheduleRequest request)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                var schedule = await scheduleService.ToggleScheduleAsync(id, request.IsEnabled, userId);
                
                if (schedule == null)
                {
                    return HttpResponseHelper.CreateNotFoundResponse("Schedule");
                }

                logger.LogInformation("Successfully toggled connection test schedule {ScheduleId} to {Status} for user {UserId}", 
                    id, request.IsEnabled ? "enabled" : "disabled", userId);

                // Log audit event
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.StatusChange.ToString(),
                    "ConnectionTestSchedule",
                    entityId: id,
                    description: $"Schedule status changed to {(request.IsEnabled ? "enabled" : "disabled")}",
                    newValues: $"IsEnabled: {request.IsEnabled}",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                return Ok(schedule);
            }
            catch (UnauthorizedAccessException)
            {
                return HttpResponseHelper.CreateUnauthorizedResponse();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error toggling connection test schedule {ScheduleId}", id);
                return HttpResponseHelper.CreateErrorResponse("Error toggling connection test schedule");
            }
        }

        [HttpPost("validate-cron")]
        public async Task<IActionResult> ValidateCronExpression([FromBody] ValidateCronRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return HttpResponseHelper.CreateValidationErrorResponse(
                        ModelState.Where(x => x.Value?.Errors.Count > 0)
                            .ToDictionary(
                                kvp => kvp.Key,
                                kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? Array.Empty<string>()
                            ));
                }

                var userId = UserHelper.GetCurrentUserId(User);
                logger.LogInformation("User {UserId} validating cron expression: {CronExpression}", userId, request.Expression);
                
                var validation = await scheduleService.ValidateCronExpressionAsync(request.Expression);
                
                logger.LogInformation("Cron expression validation result for user {UserId}: {IsValid}", userId, validation.IsValid);
                
                return Ok(validation);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error validating cron expression for user {UserId}", UserHelper.GetCurrentUserId(User));
                return HttpResponseHelper.CreateErrorResponse("Error validating cron expression");
            }
        }

        [HttpPost("{id}/run-now")]
        public async Task<IActionResult> RunScheduleNow(Guid id, [FromServices] IDatabaseConnectionService databaseConnectionService)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                logger.LogInformation("User {UserId} manually triggering connection test for schedule {ScheduleId}", userId, id);
                
                // Get the schedule to verify access and get application info
                var schedule = await scheduleService.GetScheduleByIdAsync(id, userId);
                if (schedule == null)
                {
                    return HttpResponseHelper.CreateNotFoundResponse("Schedule");
                }

                var startTime = DateTime.UtcNow;
                var stopwatch = System.Diagnostics.Stopwatch.StartNew();

                try
                {
                    // Get all active database connections for this application
                    var connections = await databaseConnectionService.GetUserConnectionsAsync(userId, schedule.ApplicationId);
                    var activeConnections = connections.Where(c => c.IsActive).ToList();

                    if (!activeConnections.Any())
                    {
                        await scheduleService.UpdateScheduleRunStatusAsync(
                            id,
                            "skipped",
                            "No active database connections found",
                            stopwatch.Elapsed);

                        return Ok(new { 
                            status = "skipped", 
                            message = "No active database connections found",
                            duration = stopwatch.Elapsed
                        });
                    }

                    var successCount = 0;
                    var failCount = 0;
                    var testResults = new List<object>();

                    // Test each connection
                    foreach (var connection in activeConnections)
                    {
                        try
                        {
                            var testRequest = new DatabaseConnectionTestRequest
                            {
                                ConnectionId = connection.Id
                            };

                            var testResult = await databaseConnectionService.TestConnectionAsync(testRequest, userId);

                            testResults.Add(new {
                                connectionId = connection.Id,
                                connectionName = connection.Name,
                                isSuccessful = testResult.IsSuccessful,
                                message = testResult.Message,
                                responseTime = testResult.ResponseTime
                            });

                            if (testResult.IsSuccessful)
                                successCount++;
                            else
                                failCount++;
                        }
                        catch (Exception ex)
                        {
                            failCount++;
                            testResults.Add(new {
                                connectionId = connection.Id,
                                connectionName = connection.Name,
                                isSuccessful = false,
                                message = $"Test failed: {ex.Message}",
                                responseTime = TimeSpan.Zero
                            });
                        }
                    }

                    stopwatch.Stop();

                    // Update schedule with results
                    var status = failCount == 0 ? "success" : (successCount == 0 ? "failed" : "partial");
                    var message = $"Manual test: {successCount} successful, {failCount} failed out of {activeConnections.Count} connections";

                    await scheduleService.UpdateScheduleRunStatusAsync(id, status, message, stopwatch.Elapsed);

                    logger.LogInformation("Manual connection test completed for schedule {ScheduleId}. Status: {Status}", id, status);

                    // Log audit event
                    await loggingService.LogAuditAsync(
                        userId,
                        AuditAction.ConnectionTest.ToString(),
                        "ConnectionTestSchedule",
                        entityId: id,
                        description: $"Manually executed connection test - {message}",
                        ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                        userAgent: Request.Headers.UserAgent.ToString()
                    );

                    return Ok(new {
                        status,
                        message,
                        duration = stopwatch.Elapsed,
                        totalConnections = activeConnections.Count,
                        successfulTests = successCount,
                        failedTests = failCount,
                        testResults
                    });
                }
                catch (Exception ex)
                {
                    stopwatch.Stop();
                    logger.LogError(ex, "Error executing manual connection test for schedule {ScheduleId}", id);

                    await scheduleService.UpdateScheduleRunStatusAsync(
                        id,
                        "error",
                        $"Manual test failed: {ex.Message}",
                        stopwatch.Elapsed);

                    return HttpResponseHelper.CreateErrorResponse("Error executing connection test");
                }
            }
            catch (UnauthorizedAccessException)
            {
                return HttpResponseHelper.CreateUnauthorizedResponse();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error running manual connection test for schedule {ScheduleId}", id);
                return HttpResponseHelper.CreateErrorResponse("Error running connection test");
            }
        }
    }
}