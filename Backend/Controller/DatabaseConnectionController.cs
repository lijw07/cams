using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using cams.Backend.Services;
using cams.Backend.View;
using cams.Backend.Helpers;
using Backend.Helpers;
using cams.Backend.Constants;
using cams.Backend.Enums;

namespace cams.Backend.Controller
{
    [ApiController]
    [Route("database-connections")]
    [Authorize]
    public class DatabaseConnectionController(
        IDatabaseConnectionService connectionService,
        ILogger<DatabaseConnectionController> logger,
        ILoggingService loggingService)
        : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetConnections([FromQuery] Guid? applicationId = null)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                logger.LogInformation("User {UserId} requested database connections{ApplicationFilter}",
                    userId, applicationId.HasValue ? $" for application {applicationId}" : "");

                var connections = await connectionService.GetUserConnectionsAsync(userId, applicationId);

                logger.LogInformation("Retrieved {ConnectionCount} database connections for user {UserId}{ApplicationFilter}",
                    connections.Count(), userId, applicationId.HasValue ? $" for application {applicationId}" : "");

                // Log audit event for database connection list retrieval
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.Read.ToString(),
                    AuditEntityTypes.DATABASE_CONNECTION,
                    description: $"Retrieved {connections.Count()} database connections{(applicationId.HasValue ? $" for application {applicationId}" : "")}",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                return Ok(connections);
            }
            catch (UnauthorizedAccessException)
            {
                logger.LogWarning("Unauthorized access attempt to database connections");
                return HttpResponseHelper.CreateUnauthorizedResponse();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving database connections for user {UserId}", UserHelper.GetCurrentUserId(User));
                return HttpResponseHelper.CreateErrorResponse("Error retrieving database connections");
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetConnection(Guid id)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                logger.LogInformation("User {UserId} requested database connection {ConnectionId}", userId, id);

                var connection = await connectionService.GetConnectionByIdAsync(id, userId);

                if (connection == null)
                {
                    logger.LogWarning("Database connection {ConnectionId} not found for user {UserId}", id, userId);
                    return HttpResponseHelper.CreateNotFoundResponse("Connection");
                }

                logger.LogInformation("Successfully retrieved database connection {ConnectionId} for user {UserId}", id, userId);

                // Log audit event for database connection retrieval
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.Read.ToString(),
                    AuditEntityTypes.DATABASE_CONNECTION,
                    entityId: id,
                    entityName: connection.Name,
                    description: "Retrieved database connection details",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                return Ok(connection);
            }
            catch (UnauthorizedAccessException)
            {
                logger.LogWarning("Unauthorized access attempt to database connection {ConnectionId}", id);
                return HttpResponseHelper.CreateUnauthorizedResponse();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving database connection {ConnectionId} for user {UserId}", id, UserHelper.GetCurrentUserId(User));
                return HttpResponseHelper.CreateErrorResponse("Error retrieving database connection");
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateConnection([FromBody] DatabaseConnectionRequest request)
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
                logger.LogInformation("User {UserId} creating database connection: {ConnectionName} (Type: {DatabaseType})",
                    userId, LoggingHelper.Sanitize(request.Name), request.Type);

                var connection = await connectionService.CreateConnectionAsync(request, userId);

                logger.LogInformation("Successfully created database connection {ConnectionId} ({ConnectionName}) for user {UserId}",
                    connection.Id, LoggingHelper.Sanitize(connection.Name), userId);

                // Log audit event for database connection creation
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.Create.ToString(),
                    AuditEntityTypes.DATABASE_CONNECTION,
                    entityId: connection.Id,
                    entityName: connection.Name,
                    newValues: $"Name: {LoggingHelper.Sanitize(connection.Name)}, Type: {request.Type}, ApplicationId: {request.ApplicationId}",
                    description: "Created new database connection",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                // Log system event for database connection creation
                await loggingService.LogSystemEventAsync(
                    SystemEventType.ConfigurationChange.ToString(),
                    SystemLogLevel.Information.ToString(),
                    SystemLogSources.DATABASE,
                    $"Database connection created: {LoggingHelper.Sanitize(connection.Name)}",
                    details: $"ConnectionId: {connection.Id}, Type: {request.Type}, ApplicationId: {request.ApplicationId}, UserId: {userId}",
                    userId: userId,
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    httpMethod: HttpContext.Request.Method,
                    requestPath: HttpContext.Request.Path,
                    statusCode: 201
                );

                return CreatedAtAction(nameof(GetConnection), new { id = connection.Id }, connection);
            }
            catch (UnauthorizedAccessException)
            {
                logger.LogWarning("Unauthorized access attempt to create database connection");
                return HttpResponseHelper.CreateUnauthorizedResponse();
            }
            catch (ArgumentException ex)
            {
                logger.LogWarning("Invalid database connection request from user {UserId}: {ErrorMessage}",
                    UserHelper.GetCurrentUserId(User), ex.Message);
                return HttpResponseHelper.CreateBadRequestResponse(ex.Message);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error creating database connection {ConnectionName} for user {UserId}",
                    LoggingHelper.Sanitize(request.Name), UserHelper.GetCurrentUserId(User));
                return HttpResponseHelper.CreateErrorResponse("Error creating database connection");
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateConnection(Guid id, [FromBody] DatabaseConnectionUpdateRequest request)
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

                if (id != request.Id)
                {
                    return HttpResponseHelper.CreateBadRequestResponse(ApplicationConstants.ErrorMessages.CONNECTION_ID_MISMATCH);
                }

                var userId = UserHelper.GetCurrentUserId(User);
                var connection = await connectionService.UpdateConnectionAsync(request, userId);

                if (connection == null)
                {
                    return HttpResponseHelper.CreateNotFoundResponse("Connection");
                }

                // Log audit event for database connection update
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.Update.ToString(),
                    AuditEntityTypes.DATABASE_CONNECTION,
                    entityId: connection.Id,
                    entityName: connection.Name,
                    newValues: $"Name: {connection.Name}, IsActive: {connection.IsActive}",
                    description: "Updated database connection",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                return Ok(connection);
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
                logger.LogError(ex, "Error updating database connection {ConnectionId}", id);
                return HttpResponseHelper.CreateErrorResponse("Error updating database connection");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteConnection(Guid id)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                var deleted = await connectionService.DeleteConnectionAsync(id, userId);

                if (!deleted)
                {
                    return HttpResponseHelper.CreateNotFoundResponse("Connection");
                }

                // Log audit event for database connection deletion
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.Delete.ToString(),
                    AuditEntityTypes.DATABASE_CONNECTION,
                    entityId: id,
                    description: "Deleted database connection",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                // Log system event for database connection deletion
                await loggingService.LogSystemEventAsync(
                    SystemEventType.ConfigurationChange.ToString(),
                    SystemLogLevel.Information.ToString(),
                    SystemLogSources.DATABASE,
                    $"Database connection deleted",
                    details: $"ConnectionId: {id}, UserId: {userId}",
                    userId: userId,
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    httpMethod: HttpContext.Request.Method,
                    requestPath: HttpContext.Request.Path,
                    statusCode: 204
                );

                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return HttpResponseHelper.CreateUnauthorizedResponse();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error deleting database connection {ConnectionId}", id);
                return HttpResponseHelper.CreateErrorResponse("Error deleting database connection");
            }
        }

        [HttpPost("test")]
        public async Task<IActionResult> TestConnection([FromBody] DatabaseConnectionTestRequest request)
        {
            try
            {
                if (request.ConnectionId == null && request.ConnectionDetails == null)
                {
                    return HttpResponseHelper.CreateBadRequestResponse("Either ConnectionId or ConnectionDetails must be provided");
                }

                var userId = UserHelper.GetCurrentUserId(User);

                if (request.ConnectionId.HasValue)
                {
                    logger.LogInformation("User {UserId} testing existing database connection {ConnectionId}",
                        userId, request.ConnectionId.Value);
                }
                else
                {
                    logger.LogInformation("User {UserId} testing new database connection (Type: {DatabaseType})",
                        userId, request.ConnectionDetails?.Type);
                }

                var testResult = await connectionService.TestConnectionAsync(request, userId);

                logger.LogInformation("Database connection test completed for user {UserId} - Success: {IsSuccessful}, Response Time: {ResponseTime}ms",
                    userId, testResult.IsSuccessful, testResult.ResponseTime.TotalMilliseconds);

                // Log audit event for connection test
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.ConnectionTest.ToString(),
                    AuditEntityTypes.DATABASE_CONNECTION,
                    entityId: request.ConnectionId,
                    description: $"Connection test - Success: {testResult.IsSuccessful}, Response Time: {testResult.ResponseTime.TotalMilliseconds}ms",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                // Log performance data for connection test
                await loggingService.LogPerformanceAsync(
                    PerformanceOperations.DATABASE_QUERY,
                    testResult.ResponseTime,
                    controller: "DatabaseConnection",
                    action: "TestConnection",
                    userId: userId,
                    statusCode: testResult.IsSuccessful ? 200 : 500,
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString(),
                    metadata: $"ConnectionId: {request.ConnectionId}, DatabaseType: {request.ConnectionDetails?.Type}"
                );

                // Log system event for failed connection tests
                if (!testResult.IsSuccessful)
                {
                    await loggingService.LogSystemEventAsync(
                        SystemEventType.DatabaseError.ToString(),
                        SystemLogLevel.Warning.ToString(),
                        SystemLogSources.DATABASE,
                        $"Database connection test failed: {testResult.Message}",
                        details: $"ConnectionId: {request.ConnectionId}, DatabaseType: {request.ConnectionDetails?.Type}, ErrorMessage: {testResult.Message}",
                        userId: userId,
                        ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                        httpMethod: HttpContext.Request.Method,
                        requestPath: HttpContext.Request.Path,
                        statusCode: 500,
                        duration: testResult.ResponseTime
                    );
                }

                // Log system event for slow connection tests (performance degradation)
                if (testResult.ResponseTime.TotalSeconds > 5)
                {
                    await loggingService.LogSystemEventAsync(
                        SystemEventType.PerformanceAlert.ToString(),
                        SystemLogLevel.Warning.ToString(),
                        SystemLogSources.PERFORMANCE,
                        $"Slow database connection detected: {testResult.ResponseTime.TotalSeconds:F2}s",
                        details: $"ConnectionId: {request.ConnectionId}, DatabaseType: {request.ConnectionDetails?.Type}, ResponseTime: {testResult.ResponseTime.TotalMilliseconds}ms, Threshold: 5000ms",
                        userId: userId,
                        ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                        httpMethod: HttpContext.Request.Method,
                        requestPath: HttpContext.Request.Path,
                        statusCode: 200,
                        duration: testResult.ResponseTime
                    );
                }

                return Ok(testResult);
            }
            catch (UnauthorizedAccessException)
            {
                logger.LogWarning("Unauthorized access attempt to test database connection");
                return HttpResponseHelper.CreateUnauthorizedResponse();
            }
            catch (ArgumentException ex)
            {
                logger.LogWarning("Invalid database connection test request from user {UserId}: {ErrorMessage}",
                    UserHelper.GetCurrentUserId(User), ex.Message);
                return HttpResponseHelper.CreateBadRequestResponse(ex.Message);
            }
            catch (Exception ex)
            {
                var userId = UserHelper.GetCurrentUserId(User);
                logger.LogError(ex, "Error testing database connection for user {UserId}", userId);

                // Log system event for connection test system error
                await loggingService.LogSystemEventAsync(
                    SystemEventType.DatabaseError.ToString(),
                    SystemLogLevel.Error.ToString(),
                    SystemLogSources.DATABASE,
                    $"Database connection test system error: {ex.Message}",
                    details: $"ConnectionId: {request?.ConnectionId}, DatabaseType: {request?.ConnectionDetails?.Type}",
                    stackTrace: ex.StackTrace,
                    userId: userId,
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    httpMethod: HttpContext.Request.Method,
                    requestPath: HttpContext.Request.Path,
                    statusCode: 500
                );

                return HttpResponseHelper.CreateErrorResponse("Error testing database connection");
            }
        }

        [HttpPatch("{id}/toggle")]
        public async Task<IActionResult> ToggleConnectionStatus(Guid id, [FromBody] ToggleConnectionStatusRequest request)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                var updated = await connectionService.ToggleConnectionStatusAsync(id, userId, request.IsActive);

                if (!updated)
                {
                    return HttpResponseHelper.CreateNotFoundResponse("Connection");
                }

                // Log audit event for connection status toggle
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.StatusChange.ToString(),
                    AuditEntityTypes.DATABASE_CONNECTION,
                    entityId: id,
                    description: $"Connection status changed to {(request.IsActive ? "active" : "inactive")}",
                    newValues: $"IsActive: {request.IsActive}",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                var message = request.IsActive
                    ? ApplicationConstants.SuccessMessages.CONNECTION_ACTIVATED
                    : ApplicationConstants.SuccessMessages.CONNECTION_DEACTIVATED;

                return HttpResponseHelper.CreateSuccessResponse(new { }, message);
            }
            catch (UnauthorizedAccessException)
            {
                return HttpResponseHelper.CreateUnauthorizedResponse();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error toggling connection status for {ConnectionId}", id);
                return HttpResponseHelper.CreateErrorResponse("Error toggling connection status");
            }
        }

        [HttpGet("types")]
        [AllowAnonymous]
        public IActionResult GetSupportedDatabaseTypes()
        {
            var types = DatabaseTypeHelper.GetAllDatabaseTypes();
            return Ok(types);
        }

        [HttpPost("connection-string/build")]
        public IActionResult BuildConnectionString([FromBody] DatabaseConnectionRequest request)
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

                var connectionString = connectionService.BuildConnectionString(request);
                return Ok(new { connectionString });
            }
            catch (ArgumentException ex)
            {
                return HttpResponseHelper.CreateBadRequestResponse(ex.Message);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error building connection string");
                return HttpResponseHelper.CreateErrorResponse("Error building connection string");
            }
        }

        [HttpPost("validate-connection-string")]
        public IActionResult ValidateConnectionString([FromBody] ValidateConnectionStringRequest request)
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

                var validation = connectionService.ValidateConnectionString(request.ConnectionString, request.DatabaseType);
                return Ok(validation);
            }
            catch (ArgumentException ex)
            {
                return HttpResponseHelper.CreateBadRequestResponse(ex.Message);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error validating connection string");
                return HttpResponseHelper.CreateErrorResponse("Error validating connection string");
            }
        }

        [HttpGet("{id}/summary")]
        public async Task<IActionResult> GetConnectionSummary(Guid id)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                var summary = await connectionService.GetConnectionSummaryAsync(id, userId);

                if (summary == null)
                {
                    return HttpResponseHelper.CreateNotFoundResponse("Connection");
                }

                return Ok(summary);
            }
            catch (UnauthorizedAccessException)
            {
                return HttpResponseHelper.CreateUnauthorizedResponse();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving connection summary for {ConnectionId}", id);
                return HttpResponseHelper.CreateErrorResponse("Error retrieving connection summary");
            }
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetConnectionsSummary([FromQuery] Guid? applicationId = null)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                var summaries = await connectionService.GetConnectionsSummaryAsync(userId, applicationId);

                return Ok(summaries);
            }
            catch (UnauthorizedAccessException)
            {
                return HttpResponseHelper.CreateUnauthorizedResponse();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving connections summary for user {UserId}", UserHelper.GetCurrentUserId(User));
                return HttpResponseHelper.CreateErrorResponse("Error retrieving connections summary");
            }
        }

        [HttpGet("{id}/health")]
        public async Task<IActionResult> GetConnectionHealth(Guid id)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                var health = await connectionService.GetConnectionHealthAsync(id, userId);

                if (health == null)
                {
                    return HttpResponseHelper.CreateNotFoundResponse("Connection");
                }

                return Ok(health);
            }
            catch (UnauthorizedAccessException)
            {
                return HttpResponseHelper.CreateUnauthorizedResponse();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving connection health for {ConnectionId}", id);
                return HttpResponseHelper.CreateErrorResponse("Error retrieving connection health");
            }
        }

        [HttpPost("{id}/health/refresh")]
        public async Task<IActionResult> RefreshConnectionHealth(Guid id)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                var health = await connectionService.RefreshConnectionHealthAsync(id, userId);

                if (health == null)
                {
                    return HttpResponseHelper.CreateNotFoundResponse("Connection");
                }

                return Ok(health);
            }
            catch (UnauthorizedAccessException)
            {
                return HttpResponseHelper.CreateUnauthorizedResponse();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error refreshing connection health for {ConnectionId}", id);
                return HttpResponseHelper.CreateErrorResponse("Error refreshing connection health");
            }
        }

        [HttpPost("bulk/toggle")]
        public async Task<IActionResult> BulkToggleStatus([FromBody] BulkToggleRequest request)
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
                var result = await connectionService.BulkToggleStatusAsync(request.ConnectionIds, request.IsActive, userId);

                return Ok(result);
            }
            catch (UnauthorizedAccessException)
            {
                return HttpResponseHelper.CreateUnauthorizedResponse();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error bulk toggling connection status for user {UserId}", UserHelper.GetCurrentUserId(User));
                return HttpResponseHelper.CreateErrorResponse("Error bulk toggling connection status");
            }
        }

        [HttpPost("bulk/delete")]
        public async Task<IActionResult> BulkDelete([FromBody] BulkDeleteRequest request)
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
                var result = await connectionService.BulkDeleteAsync(request.ConnectionIds, userId);

                return Ok(result);
            }
            catch (UnauthorizedAccessException)
            {
                return HttpResponseHelper.CreateUnauthorizedResponse();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error bulk deleting connections for user {UserId}", UserHelper.GetCurrentUserId(User));
                return HttpResponseHelper.CreateErrorResponse("Error bulk deleting connections");
            }
        }

        [HttpGet("{id}/usage-stats")]
        public async Task<IActionResult> GetConnectionUsageStats(Guid id)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                var stats = await connectionService.GetConnectionUsageStatsAsync(id, userId);

                if (stats == null)
                {
                    return HttpResponseHelper.CreateNotFoundResponse("Connection");
                }

                return Ok(stats);
            }
            catch (UnauthorizedAccessException)
            {
                return HttpResponseHelper.CreateUnauthorizedResponse();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving connection usage stats for {ConnectionId}", id);
                return HttpResponseHelper.CreateErrorResponse("Error retrieving connection usage stats");
            }
        }

        [HttpPost("{id}/test")]
        public async Task<IActionResult> TestExistingConnection(Guid id)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                logger.LogInformation("User {UserId} testing existing database connection {ConnectionId}", userId, id);

                var request = new DatabaseConnectionTestRequest
                {
                    ConnectionId = id
                };

                var testResult = await connectionService.TestConnectionAsync(request, userId);

                logger.LogInformation("Database connection test completed for connection {ConnectionId} and user {UserId} - Success: {IsSuccessful}",
                    id, userId, testResult.IsSuccessful);

                // Log audit event for connection test
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.ConnectionTest.ToString(),
                    AuditEntityTypes.DATABASE_CONNECTION,
                    entityId: id,
                    description: $"Existing connection test - Success: {testResult.IsSuccessful}",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                return Ok(testResult);
            }
            catch (UnauthorizedAccessException)
            {
                logger.LogWarning("Unauthorized access attempt to test database connection {ConnectionId}", id);
                return HttpResponseHelper.CreateUnauthorizedResponse();
            }
            catch (ArgumentException ex)
            {
                logger.LogWarning("Invalid database connection test request for connection {ConnectionId} from user {UserId}: {ErrorMessage}",
                    id, UserHelper.GetCurrentUserId(User), ex.Message);
                return HttpResponseHelper.CreateBadRequestResponse(ex.Message);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error testing database connection {ConnectionId} for user {UserId}", id, UserHelper.GetCurrentUserId(User));
                return HttpResponseHelper.CreateErrorResponse("Error testing database connection");
            }
        }

        [HttpPost("{id}/access")]
        public async Task<IActionResult> UpdateLastAccessed(Guid id)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                var updated = await connectionService.UpdateLastAccessedAsync(id, userId);

                if (!updated)
                {
                    return HttpResponseHelper.CreateNotFoundResponse("Connection");
                }

                return Ok(new { message = "Last accessed time updated successfully" });
            }
            catch (UnauthorizedAccessException)
            {
                return HttpResponseHelper.CreateUnauthorizedResponse();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error updating last accessed time for connection {ConnectionId}", id);
                return HttpResponseHelper.CreateErrorResponse("Error updating last accessed time");
            }
        }
    }
}