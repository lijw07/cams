using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using cams.Backend.Attributes;
using cams.Backend.Constants;
using cams.Backend.Helpers;
using cams.Backend.Services;
using cams.Backend.View;

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
            [FromQuery] int? userId = null,
            [FromQuery] string? entityType = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] int pageSize = 100,
            [FromQuery] int pageNumber = 1)
        {
            try
            {
                var currentUserId = UserHelper.GetCurrentUserId(User);
                logger.LogInformation("PlatformAdmin user {UserId} accessing audit logs with filters: userId={FilterUserId}, entityType={EntityType}, fromDate={FromDate}, toDate={ToDate}",
                    currentUserId, userId, entityType, fromDate, toDate);
                
                var logs = await loggingService.GetAuditLogsAsync(userId, entityType, fromDate, toDate, pageSize, pageNumber);
                
                await loggingService.LogAuditAsync(
                    currentUserId,
                    "ViewAuditLogs",
                    "AuditLog",
                    description: $"Retrieved {logs.Count()} audit logs",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );
                
                logger.LogInformation("Successfully retrieved {LogCount} audit logs for PlatformAdmin user {UserId}",
                    logs.Count(), currentUserId);
                
                return Ok(logs);
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
            [FromQuery] string? source = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] bool? isResolved = null,
            [FromQuery] int pageSize = 100,
            [FromQuery] int pageNumber = 1)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                logger.LogInformation("PlatformAdmin user {UserId} accessing system logs with filters: level={Level}, source={Source}, fromDate={FromDate}, toDate={ToDate}, isResolved={IsResolved}",
                    userId, level, source, fromDate, toDate, isResolved);
                
                var logs = await loggingService.GetSystemLogsAsync(level, source, fromDate, toDate, isResolved, pageSize, pageNumber);
                
                await loggingService.LogAuditAsync(
                    userId,
                    "ViewSystemLogs",
                    "SystemLog",
                    description: $"Retrieved {logs.Count()} system logs",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );
                
                logger.LogInformation("Successfully retrieved {LogCount} system logs for PlatformAdmin user {UserId}",
                    logs.Count(), userId);
                
                return Ok(logs);
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
            [FromQuery] string? eventType = null,
            [FromQuery] string? status = null,
            [FromQuery] int? userId = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] int pageSize = 100,
            [FromQuery] int pageNumber = 1)
        {
            try
            {
                var currentUserId = UserHelper.GetCurrentUserId(User);
                logger.LogInformation("PlatformAdmin user {UserId} accessing security logs with filters: eventType={EventType}, status={Status}, userId={FilterUserId}, fromDate={FromDate}, toDate={ToDate}",
                    currentUserId, eventType, status, userId, fromDate, toDate);
                
                var logs = await loggingService.GetSecurityLogsAsync(eventType, status, userId, fromDate, toDate, pageSize, pageNumber);
                
                await loggingService.LogAuditAsync(
                    currentUserId,
                    "ViewSecurityLogs",
                    "SecurityLog",
                    description: $"Retrieved {logs.Count()} security logs",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );
                
                logger.LogInformation("Successfully retrieved {LogCount} security logs for PlatformAdmin user {UserId}",
                    logs.Count(), currentUserId);
                
                return Ok(logs);
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
            [FromQuery] string? performanceLevel = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] bool? isSlowQuery = null,
            [FromQuery] int pageSize = 100,
            [FromQuery] int pageNumber = 1)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                logger.LogInformation("PlatformAdmin user {UserId} accessing performance logs with filters: operation={Operation}, performanceLevel={PerformanceLevel}, fromDate={FromDate}, toDate={ToDate}, isSlowQuery={IsSlowQuery}",
                    userId, operation, performanceLevel, fromDate, toDate, isSlowQuery);
                
                var logs = await loggingService.GetPerformanceLogsAsync(operation, performanceLevel, fromDate, toDate, isSlowQuery, pageSize, pageNumber);
                
                await loggingService.LogAuditAsync(
                    userId,
                    "ViewPerformanceLogs",
                    "PerformanceLog",
                    description: $"Retrieved {logs.Count()} performance logs",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );
                
                logger.LogInformation("Successfully retrieved {LogCount} performance logs for PlatformAdmin user {UserId}",
                    logs.Count(), userId);
                
                return Ok(logs);
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