using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using cams.Backend.Attributes;
using cams.Backend.Constants;
using cams.Backend.Helpers;
using cams.Backend.Services;
using cams.Backend.View;
using cams.Backend.Model;

namespace cams.Backend.Controller
{
    /// <summary>
    /// Controller for accessing system logs.
    /// IMPORTANT: Log access is restricted to PlatformAdmin users only.
    /// Regular Admin users should NOT have access to logs for security reasons.
    /// </summary>
    [ApiController]
    [Route("logs")]
    [Authorize]
    [RequireRole(RoleConstants.PLATFORM_ADMIN)] // Only PlatformAdmin can access logs
    public class LogsController(
        ILoggingService loggingService,
        ILogger<LogsController> logger)
        : ControllerBase
    {
        /// <summary>
        /// Get audit logs - PlatformAdmin only
        /// </summary>
        [HttpGet("audit")]
        public async Task<IActionResult> GetAuditLogs(
            [FromQuery(Name = "user-id")] int? userId = null,
            [FromQuery(Name = "entity-type")] string? entityType = null,
            [FromQuery(Name = "from-date")] DateTime? fromDate = null,
            [FromQuery(Name = "to-date")] DateTime? toDate = null,
            [FromQuery(Name = "page-size")] int pageSize = 20,
            [FromQuery] int page = 1,
            [FromQuery(Name = "sort-by")] string? sortBy = "timestamp",
            [FromQuery(Name = "sort-direction")] string? sortDirection = "desc",
            [FromQuery] string? search = null)
        {
            try
            {
                var currentUserId = UserHelper.GetCurrentUserId(User);
                logger.LogInformation("PlatformAdmin user {UserId} accessing audit logs with filters: userId={FilterUserId}, entityType={EntityType}, fromDate={FromDate}, toDate={ToDate}",
                    currentUserId, userId, entityType, fromDate, toDate);
                
                var (data, totalCount) = await loggingService.GetAuditLogsWithCountAsync(userId, entityType, fromDate, toDate, pageSize, page);
                var logsList = data.ToList();
                
                var response = new LogsResponse<Model.AuditLog>
                {
                    Data = logsList,
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize
                };
                
                await loggingService.LogAuditAsync(
                    currentUserId,
                    "ViewAuditLogs",
                    "AuditLog",
                    description: $"Retrieved {logsList.Count} audit logs",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );
                
                logger.LogInformation("Successfully retrieved {LogCount} audit logs for PlatformAdmin user {UserId}",
                    logsList.Count, currentUserId);
                
                return Ok(response);
            }
            catch (Exception ex)
            {
                var currentUserId = UserHelper.GetCurrentUserId(User);
                logger.LogError(ex, "Error retrieving audit logs for user {UserId}", currentUserId);
                return StatusCode(500, new { message = "Error retrieving audit logs" });
            }
        }

        /// <summary>
        /// Get system logs - PlatformAdmin only
        /// </summary>
        [HttpGet("system")]
        public async Task<IActionResult> GetSystemLogs(
            [FromQuery] string? level = null,
            [FromQuery(Name = "event-type")] string? eventType = null,
            [FromQuery(Name = "from-date")] DateTime? fromDate = null,
            [FromQuery(Name = "to-date")] DateTime? toDate = null,
            [FromQuery(Name = "is-resolved")] bool? isResolved = null,
            [FromQuery(Name = "page-size")] int pageSize = 20,
            [FromQuery] int page = 1,
            [FromQuery(Name = "sort-by")] string? sortBy = "timestamp",
            [FromQuery(Name = "sort-direction")] string? sortDirection = "desc",
            [FromQuery] string? search = null)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                logger.LogInformation("PlatformAdmin user {UserId} accessing system logs with filters: level={Level}, eventType={EventType}, fromDate={FromDate}, toDate={ToDate}, isResolved={IsResolved}",
                    userId, level, eventType, fromDate, toDate, isResolved);
                
                var (data, totalCount) = await loggingService.GetSystemLogsWithCountAsync(level, eventType, fromDate, toDate, isResolved, pageSize, page);
                var logsList = data.ToList();
                
                var response = new LogsResponse<Model.SystemLog>
                {
                    Data = logsList,
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize
                };
                
                await loggingService.LogAuditAsync(
                    userId,
                    "ViewSystemLogs",
                    "SystemLog",
                    description: $"Retrieved {logsList.Count} system logs",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );
                
                logger.LogInformation("Successfully retrieved {LogCount} system logs for PlatformAdmin user {UserId}",
                    logsList.Count, userId);
                
                return Ok(response);
            }
            catch (Exception ex)
            {
                var userId = UserHelper.GetCurrentUserId(User);
                logger.LogError(ex, "Error retrieving system logs for user {UserId}", userId);
                return StatusCode(500, new { message = "Error retrieving system logs" });
            }
        }

        /// <summary>
        /// Get security logs - PlatformAdmin only
        /// </summary>
        [HttpGet("security")]
        public async Task<IActionResult> GetSecurityLogs(
            [FromQuery(Name = "event-type")] string? eventType = null,
            [FromQuery] string? status = null,
            [FromQuery(Name = "user-id")] int? userId = null,
            [FromQuery(Name = "from-date")] DateTime? fromDate = null,
            [FromQuery(Name = "to-date")] DateTime? toDate = null,
            [FromQuery] string? severity = null,
            [FromQuery(Name = "page-size")] int pageSize = 20,
            [FromQuery] int page = 1,
            [FromQuery(Name = "sort-by")] string? sortBy = "timestamp",
            [FromQuery(Name = "sort-direction")] string? sortDirection = "desc",
            [FromQuery] string? search = null)
        {
            try
            {
                var currentUserId = UserHelper.GetCurrentUserId(User);
                logger.LogInformation("PlatformAdmin user {UserId} accessing security logs with filters: eventType={EventType}, status={Status}, userId={FilterUserId}, fromDate={FromDate}, toDate={ToDate}",
                    currentUserId, eventType, status, userId, fromDate, toDate);
                
                var (data, totalCount) = await loggingService.GetSecurityLogsWithCountAsync(eventType, status, userId, fromDate, toDate, pageSize, page);
                var logsList = data.ToList();
                
                var response = new LogsResponse<Model.SecurityLog>
                {
                    Data = logsList,
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize
                };
                
                await loggingService.LogAuditAsync(
                    currentUserId,
                    "ViewSecurityLogs",
                    "SecurityLog",
                    description: $"Retrieved {logsList.Count} security logs",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );
                
                logger.LogInformation("Successfully retrieved {LogCount} security logs for PlatformAdmin user {UserId}",
                    logsList.Count, currentUserId);
                
                return Ok(response);
            }
            catch (Exception ex)
            {
                var currentUserId = UserHelper.GetCurrentUserId(User);
                logger.LogError(ex, "Error retrieving security logs for user {UserId}", currentUserId);
                return StatusCode(500, new { message = "Error retrieving security logs" });
            }
        }

        /// <summary>
        /// Get performance logs - PlatformAdmin only
        /// </summary>
        [HttpGet("performance")]
        public async Task<IActionResult> GetPerformanceLogs(
            [FromQuery] string? operation = null,
            [FromQuery(Name = "performance-level")] string? performanceLevel = null,
            [FromQuery(Name = "from-date")] DateTime? fromDate = null,
            [FromQuery(Name = "to-date")] DateTime? toDate = null,
            [FromQuery(Name = "is-slow-query")] bool? isSlowQuery = null,
            [FromQuery(Name = "page-size")] int pageSize = 20,
            [FromQuery] int page = 1,
            [FromQuery(Name = "sort-by")] string? sortBy = "timestamp",
            [FromQuery(Name = "sort-direction")] string? sortDirection = "desc",
            [FromQuery] string? search = null)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                logger.LogInformation("PlatformAdmin user {UserId} accessing performance logs with filters: operation={Operation}, performanceLevel={PerformanceLevel}, fromDate={FromDate}, toDate={ToDate}, isSlowQuery={IsSlowQuery}",
                    userId, operation, performanceLevel, fromDate, toDate, isSlowQuery);
                
                var (data, totalCount) = await loggingService.GetPerformanceLogsWithCountAsync(operation, performanceLevel, fromDate, toDate, isSlowQuery, pageSize, page);
                var logsList = data.ToList();
                
                var response = new LogsResponse<Model.PerformanceLog>
                {
                    Data = logsList,
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize
                };
                
                await loggingService.LogAuditAsync(
                    userId,
                    "ViewPerformanceLogs",
                    "PerformanceLog",
                    description: $"Retrieved {logsList.Count} performance logs",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );
                
                logger.LogInformation("Successfully retrieved {LogCount} performance logs for PlatformAdmin user {UserId}",
                    logsList.Count, userId);
                
                return Ok(response);
            }
            catch (Exception ex)
            {
                var userId = UserHelper.GetCurrentUserId(User);
                logger.LogError(ex, "Error retrieving performance logs for user {UserId}", userId);
                return StatusCode(500, new { message = "Error retrieving performance logs" });
            }
        }

        /// <summary>
        /// Mark system log as resolved - PlatformAdmin only
        /// </summary>
        [HttpPut("system/{logId}/resolve")]
        public async Task<IActionResult> MarkSystemLogResolved(int logId, [FromBody] string? resolutionNotes = null)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                logger.LogInformation("PlatformAdmin user {UserId} marking system log {LogId} as resolved", userId, logId);
                
                await loggingService.MarkSystemLogResolvedAsync(logId, resolutionNotes);
                
                await loggingService.LogAuditAsync(
                    userId,
                    "ResolveSystemLog",
                    "SystemLog",
                    entityId: logId,
                    description: $"Marked system log {logId} as resolved",
                    newValues: resolutionNotes,
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );
                
                logger.LogInformation("Successfully marked system log {LogId} as resolved by PlatformAdmin user {UserId}",
                    logId, userId);
                
                return Ok(new { message = "System log marked as resolved successfully" });
            }
            catch (Exception ex)
            {
                var userId = UserHelper.GetCurrentUserId(User);
                logger.LogError(ex, "Error marking system log {LogId} as resolved for user {UserId}", logId, userId);
                return StatusCode(500, new { message = "Error marking system log as resolved" });
            }
        }

        /// <summary>
        /// Get specific audit log details - PlatformAdmin only
        /// </summary>
        [HttpGet("audit/{id}")]
        public async Task<IActionResult> GetAuditLogById(int id)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                var log = await loggingService.GetAuditLogByIdAsync(id);
                
                if (log == null)
                {
                    return NotFound(new { message = "Audit log not found" });
                }

                await loggingService.LogAuditAsync(
                    userId,
                    "ViewAuditLog",
                    "AuditLog",
                    entityId: id,
                    description: $"Retrieved audit log details for ID {id}",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );
                
                return Ok(log);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving audit log {LogId}", id);
                return StatusCode(500, new { message = "Error retrieving audit log" });
            }
        }

        /// <summary>
        /// Get specific system log details - PlatformAdmin only
        /// </summary>
        [HttpGet("system/{id}")]
        public async Task<IActionResult> GetSystemLogById(int id)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                var log = await loggingService.GetSystemLogByIdAsync(id);
                
                if (log == null)
                {
                    return NotFound(new { message = "System log not found" });
                }

                await loggingService.LogAuditAsync(
                    userId,
                    "ViewSystemLog",
                    "SystemLog",
                    entityId: id,
                    description: $"Retrieved system log details for ID {id}",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );
                
                return Ok(log);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving system log {LogId}", id);
                return StatusCode(500, new { message = "Error retrieving system log" });
            }
        }

        /// <summary>
        /// Get specific security log details - PlatformAdmin only
        /// </summary>
        [HttpGet("security/{id}")]
        public async Task<IActionResult> GetSecurityLogById(int id)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                var log = await loggingService.GetSecurityLogByIdAsync(id);
                
                if (log == null)
                {
                    return NotFound(new { message = "Security log not found" });
                }

                await loggingService.LogAuditAsync(
                    userId,
                    "ViewSecurityLog",
                    "SecurityLog",
                    entityId: id,
                    description: $"Retrieved security log details for ID {id}",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );
                
                return Ok(log);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving security log {LogId}", id);
                return StatusCode(500, new { message = "Error retrieving security log" });
            }
        }

        /// <summary>
        /// Get specific performance log details - PlatformAdmin only
        /// </summary>
        [HttpGet("performance/{id}")]
        public async Task<IActionResult> GetPerformanceLogById(int id)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                var log = await loggingService.GetPerformanceLogByIdAsync(id);
                
                if (log == null)
                {
                    return NotFound(new { message = "Performance log not found" });
                }

                await loggingService.LogAuditAsync(
                    userId,
                    "ViewPerformanceLog",
                    "PerformanceLog",
                    entityId: id,
                    description: $"Retrieved performance log details for ID {id}",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );
                
                return Ok(log);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving performance log {LogId}", id);
                return StatusCode(500, new { message = "Error retrieving performance log" });
            }
        }

        /// <summary>
        /// Get performance metrics - PlatformAdmin only
        /// </summary>
        [HttpGet("performance/metrics")]
        public async Task<IActionResult> GetPerformanceMetrics(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] string? operation = null)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                logger.LogInformation("PlatformAdmin user {UserId} accessing performance metrics with filters: fromDate={FromDate}, toDate={ToDate}, operation={Operation}",
                    userId, fromDate, toDate, operation);
                
                var metrics = await loggingService.GetPerformanceMetricsAsync(fromDate, toDate, operation);
                
                await loggingService.LogAuditAsync(
                    userId,
                    "ViewPerformanceMetrics",
                    "PerformanceLog",
                    description: "Retrieved performance metrics",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );
                
                logger.LogInformation("Successfully retrieved performance metrics for PlatformAdmin user {UserId}", userId);
                
                return Ok(metrics);
            }
            catch (Exception ex)
            {
                var userId = UserHelper.GetCurrentUserId(User);
                logger.LogError(ex, "Error retrieving performance metrics for user {UserId}", userId);
                return StatusCode(500, new { message = "Error retrieving performance metrics" });
            }
        }
    }
}