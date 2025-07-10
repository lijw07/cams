using cams.Backend.Enums;
using cams.Backend.Model;
using cams.Backend.Constants;

namespace cams.Backend.Services
{
    public class LoggingService : ILoggingService
    {
        private readonly ILogger<LoggingService> _logger;
        private readonly List<AuditLog> _auditLogs = new();
        private readonly List<SecurityLog> _securityLogs = new();
        private readonly List<SystemLog> _systemLogs = new();
        private readonly List<PerformanceLog> _performanceLogs = new();

        public LoggingService(ILogger<LoggingService> logger)
        {
            _logger = logger;
        }

        // Audit Log methods
        public async Task LogAuditAsync(int userId, string action, string entityType, int? entityId = null,
            string? entityName = null, string? oldValues = null, string? newValues = null,
            string? description = null, string? ipAddress = null, string? userAgent = null,
            string severity = "Information")
        {
            var auditLog = new AuditLog
            {
                Id = _auditLogs.Count + 1,
                UserId = userId,
                Action = action,
                EntityType = entityType,
                EntityId = entityId,
                EntityName = entityName ?? "",
                OldValues = oldValues,
                NewValues = newValues,
                Description = description,
                IpAddress = ipAddress ?? "Unknown",
                UserAgent = userAgent,
                Timestamp = DateTime.UtcNow,
                Severity = severity
            };

            _auditLogs.Add(auditLog);
            _logger.LogInformation("Audit log created: User {UserId} performed {Action} on {EntityType} {EntityId}",
                userId, action, entityType, entityId);

            await Task.CompletedTask;
        }

        public async Task<IEnumerable<AuditLog>> GetAuditLogsAsync(int? userId = null, string? entityType = null,
            DateTime? fromDate = null, DateTime? toDate = null, int pageSize = 100, int pageNumber = 1)
        {
            var query = _auditLogs.AsEnumerable();

            if (userId.HasValue)
                query = query.Where(log => log.UserId == userId.Value);

            if (!string.IsNullOrEmpty(entityType))
                query = query.Where(log => log.EntityType.Equals(entityType, StringComparison.OrdinalIgnoreCase));

            if (fromDate.HasValue)
                query = query.Where(log => log.Timestamp >= fromDate.Value);

            if (toDate.HasValue)
                query = query.Where(log => log.Timestamp <= toDate.Value);

            var result = query
                .OrderByDescending(log => log.Timestamp)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize);

            return await Task.FromResult(result);
        }

        // Security Log methods
        public async Task LogSecurityEventAsync(string eventType, string status, int? userId = null,
            string? username = null, string? description = null, string? ipAddress = null,
            string? userAgent = null, string? sessionId = null, string? resource = null,
            string? metadata = null, string severity = "Information", string? failureReason = null)
        {
            var securityLog = new SecurityLog
            {
                Id = _securityLogs.Count + 1,
                UserId = userId,
                Username = username,
                EventType = eventType,
                Status = status,
                Description = description,
                IpAddress = ipAddress ?? "Unknown",
                UserAgent = userAgent,
                SessionId = sessionId,
                Resource = resource,
                Metadata = metadata,
                Timestamp = DateTime.UtcNow,
                Severity = severity,
                FailureReason = failureReason,
                RequiresAction = severity == "Critical" || severity == "Error"
            };

            _securityLogs.Add(securityLog);
            _logger.LogInformation("Security event logged: {EventType} - {Status} for user {UserId}",
                eventType, status, userId);

            await Task.CompletedTask;
        }

        public async Task<IEnumerable<SecurityLog>> GetSecurityLogsAsync(string? eventType = null, string? status = null,
            int? userId = null, DateTime? fromDate = null, DateTime? toDate = null,
            int pageSize = 100, int pageNumber = 1)
        {
            var query = _securityLogs.AsEnumerable();

            if (!string.IsNullOrEmpty(eventType))
                query = query.Where(log => log.EventType.Equals(eventType, StringComparison.OrdinalIgnoreCase));

            if (!string.IsNullOrEmpty(status))
                query = query.Where(log => log.Status.Equals(status, StringComparison.OrdinalIgnoreCase));

            if (userId.HasValue)
                query = query.Where(log => log.UserId == userId.Value);

            if (fromDate.HasValue)
                query = query.Where(log => log.Timestamp >= fromDate.Value);

            if (toDate.HasValue)
                query = query.Where(log => log.Timestamp <= toDate.Value);

            var result = query
                .OrderByDescending(log => log.Timestamp)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize);

            return await Task.FromResult(result);
        }

        public async Task<IEnumerable<SecurityLog>> GetFailedLoginAttemptsAsync(string? ipAddress = null,
            DateTime? fromDate = null, int? threshold = 5)
        {
            var query = _securityLogs
                .Where(log => log.EventType == "LoginFailure")
                .AsEnumerable();

            if (!string.IsNullOrEmpty(ipAddress))
                query = query.Where(log => log.IpAddress == ipAddress);

            if (fromDate.HasValue)
                query = query.Where(log => log.Timestamp >= fromDate.Value);

            var failedAttempts = query
                .GroupBy(log => log.IpAddress)
                .Where(group => group.Count() >= (threshold ?? 5))
                .SelectMany(group => group)
                .OrderByDescending(log => log.Timestamp);

            return await Task.FromResult(failedAttempts);
        }

        // System Log methods
        public async Task LogSystemEventAsync(string eventType, string level, string source, string message,
            string? details = null, string? stackTrace = null, string? correlationId = null,
            int? userId = null, string? ipAddress = null, string? requestPath = null,
            string? httpMethod = null, int? statusCode = null, TimeSpan? duration = null)
        {
            var systemLog = new SystemLog
            {
                Id = _systemLogs.Count + 1,
                EventType = eventType,
                Level = level,
                Source = source,
                Message = message,
                Details = details,
                StackTrace = stackTrace,
                CorrelationId = correlationId,
                UserId = userId,
                IpAddress = ipAddress,
                RequestPath = requestPath,
                HttpMethod = httpMethod,
                StatusCode = statusCode,
                Duration = duration,
                Timestamp = DateTime.UtcNow,
                MachineName = Environment.MachineName,
                ProcessId = Environment.ProcessId.ToString(),
                ThreadId = Thread.CurrentThread.ManagedThreadId.ToString(),
                IsResolved = level == "Information" || level == "Debug"
            };

            _systemLogs.Add(systemLog);
            _logger.LogInformation("System event logged: {EventType} - {Level} from {Source}: {Message}",
                eventType, level, source, message);

            await Task.CompletedTask;
        }

        public async Task<IEnumerable<SystemLog>> GetSystemLogsAsync(string? level = null, string? source = null,
            DateTime? fromDate = null, DateTime? toDate = null, bool? isResolved = null,
            int pageSize = 100, int pageNumber = 1)
        {
            var query = _systemLogs.AsEnumerable();

            if (!string.IsNullOrEmpty(level))
                query = query.Where(log => log.Level.Equals(level, StringComparison.OrdinalIgnoreCase));

            if (!string.IsNullOrEmpty(source))
                query = query.Where(log => log.Source.Equals(source, StringComparison.OrdinalIgnoreCase));

            if (fromDate.HasValue)
                query = query.Where(log => log.Timestamp >= fromDate.Value);

            if (toDate.HasValue)
                query = query.Where(log => log.Timestamp <= toDate.Value);

            if (isResolved.HasValue)
                query = query.Where(log => log.IsResolved == isResolved.Value);

            var result = query
                .OrderByDescending(log => log.Timestamp)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize);

            return await Task.FromResult(result);
        }

        public async Task MarkSystemLogResolvedAsync(int logId, string? resolutionNotes = null)
        {
            var log = _systemLogs.FirstOrDefault(l => l.Id == logId);
            if (log != null)
            {
                log.IsResolved = true;
                log.ResolvedAt = DateTime.UtcNow;
                log.ResolutionNotes = resolutionNotes;
                _logger.LogInformation("System log {LogId} marked as resolved", logId);
            }

            await Task.CompletedTask;
        }

        // Performance Log methods
        public async Task LogPerformanceAsync(string operation, TimeSpan duration, string? controller = null,
            string? action = null, string? requestPath = null, string? httpMethod = null,
            int? userId = null, int statusCode = 200, TimeSpan? databaseTime = null,
            TimeSpan? externalServiceTime = null, long? requestSizeBytes = null,
            long? responseSizeBytes = null, string? ipAddress = null, string? userAgent = null,
            string? correlationId = null, int? databaseQueryCount = null,
            int? cacheHitCount = null, int? cacheMissCount = null, string? metadata = null)
        {
            var performanceLevel = GetPerformanceLevel(duration);
            var isSlowQuery = duration.TotalMilliseconds > PerformanceThresholds.SLOW_MS;

            var performanceLog = new PerformanceLog
            {
                Id = _performanceLogs.Count + 1,
                Operation = operation,
                Controller = controller,
                Action = action,
                RequestPath = requestPath,
                HttpMethod = httpMethod,
                UserId = userId,
                Duration = duration,
                DatabaseTime = databaseTime,
                ExternalServiceTime = externalServiceTime,
                StatusCode = statusCode,
                RequestSizeBytes = requestSizeBytes,
                ResponseSizeBytes = responseSizeBytes,
                Timestamp = DateTime.UtcNow,
                IpAddress = ipAddress,
                UserAgent = userAgent,
                CorrelationId = correlationId,
                PerformanceLevel = performanceLevel,
                IsSlowQuery = isSlowQuery,
                DatabaseQueryCount = databaseQueryCount,
                CacheHitCount = cacheHitCount,
                CacheMissCount = cacheMissCount,
                Metadata = metadata
            };

            _performanceLogs.Add(performanceLog);

            if (isSlowQuery)
            {
                _logger.LogWarning("Slow operation detected: {Operation} took {Duration}ms",
                    operation, duration.TotalMilliseconds);
            }

            await Task.CompletedTask;
        }

        public async Task<IEnumerable<PerformanceLog>> GetPerformanceLogsAsync(string? operation = null,
            string? performanceLevel = null, DateTime? fromDate = null, DateTime? toDate = null,
            bool? isSlowQuery = null, int pageSize = 100, int pageNumber = 1)
        {
            var query = _performanceLogs.AsEnumerable();

            if (!string.IsNullOrEmpty(operation))
                query = query.Where(log => log.Operation.Equals(operation, StringComparison.OrdinalIgnoreCase));

            if (!string.IsNullOrEmpty(performanceLevel))
                query = query.Where(log => log.PerformanceLevel.Equals(performanceLevel, StringComparison.OrdinalIgnoreCase));

            if (fromDate.HasValue)
                query = query.Where(log => log.Timestamp >= fromDate.Value);

            if (toDate.HasValue)
                query = query.Where(log => log.Timestamp <= toDate.Value);

            if (isSlowQuery.HasValue)
                query = query.Where(log => log.IsSlowQuery == isSlowQuery.Value);

            var result = query
                .OrderByDescending(log => log.Timestamp)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize);

            return await Task.FromResult(result);
        }

        public async Task<PerformanceMetrics> GetPerformanceMetricsAsync(DateTime? fromDate = null,
            DateTime? toDate = null, string? operation = null)
        {
            var query = _performanceLogs.AsEnumerable();

            if (fromDate.HasValue)
                query = query.Where(log => log.Timestamp >= fromDate.Value);

            if (toDate.HasValue)
                query = query.Where(log => log.Timestamp <= toDate.Value);

            if (!string.IsNullOrEmpty(operation))
                query = query.Where(log => log.Operation.Equals(operation, StringComparison.OrdinalIgnoreCase));

            var logs = query.ToList();
            if (!logs.Any())
            {
                return new PerformanceMetrics();
            }

            var durations = logs.Select(l => l.Duration.TotalMilliseconds).OrderBy(d => d).ToList();
            var totalRequests = logs.Count;
            var slowRequests = logs.Count(l => l.IsSlowQuery);
            var errorRequests = logs.Count(l => l.StatusCode >= 400);

            var metrics = new PerformanceMetrics
            {
                AverageResponseTime = durations.Average(),
                MedianResponseTime = durations[durations.Count / 2],
                P95ResponseTime = durations[(int)(durations.Count * 0.95)],
                P99ResponseTime = durations[(int)(durations.Count * 0.99)],
                TotalRequests = totalRequests,
                SlowRequests = slowRequests,
                ErrorRequests = errorRequests,
                ErrorRate = (double)errorRequests / totalRequests * 100,
                ThroughputPerMinute = CalculateThroughput(logs),
                ResponseTimeDistribution = GetResponseTimeDistribution(logs),
                OperationAverages = GetOperationAverages(logs)
            };

            return await Task.FromResult(metrics);
        }

        // Cleanup methods
        public async Task CleanupOldLogsAsync(int retentionDays = 90)
        {
            await CleanupAuditLogsAsync(365);
            await CleanupSecurityLogsAsync(180);
            await CleanupSystemLogsAsync(retentionDays);
            await CleanupPerformanceLogsAsync(30);
        }

        public async Task CleanupAuditLogsAsync(int retentionDays = 365)
        {
            var cutoffDate = DateTime.UtcNow.AddDays(-retentionDays);
            var logsToRemove = _auditLogs.Where(log => log.Timestamp < cutoffDate).ToList();
            
            foreach (var log in logsToRemove)
            {
                _auditLogs.Remove(log);
            }

            _logger.LogInformation("Cleaned up {Count} audit logs older than {Days} days", logsToRemove.Count, retentionDays);
            await Task.CompletedTask;
        }

        public async Task CleanupSecurityLogsAsync(int retentionDays = 180)
        {
            var cutoffDate = DateTime.UtcNow.AddDays(-retentionDays);
            var logsToRemove = _securityLogs.Where(log => log.Timestamp < cutoffDate).ToList();
            
            foreach (var log in logsToRemove)
            {
                _securityLogs.Remove(log);
            }

            _logger.LogInformation("Cleaned up {Count} security logs older than {Days} days", logsToRemove.Count, retentionDays);
            await Task.CompletedTask;
        }

        public async Task CleanupSystemLogsAsync(int retentionDays = 90)
        {
            var cutoffDate = DateTime.UtcNow.AddDays(-retentionDays);
            var logsToRemove = _systemLogs.Where(log => log.Timestamp < cutoffDate).ToList();
            
            foreach (var log in logsToRemove)
            {
                _systemLogs.Remove(log);
            }

            _logger.LogInformation("Cleaned up {Count} system logs older than {Days} days", logsToRemove.Count, retentionDays);
            await Task.CompletedTask;
        }

        public async Task CleanupPerformanceLogsAsync(int retentionDays = 30)
        {
            var cutoffDate = DateTime.UtcNow.AddDays(-retentionDays);
            var logsToRemove = _performanceLogs.Where(log => log.Timestamp < cutoffDate).ToList();
            
            foreach (var log in logsToRemove)
            {
                _performanceLogs.Remove(log);
            }

            _logger.LogInformation("Cleaned up {Count} performance logs older than {Days} days", logsToRemove.Count, retentionDays);
            await Task.CompletedTask;
        }

        // Helper methods
        private static string GetPerformanceLevel(TimeSpan duration)
        {
            var ms = duration.TotalMilliseconds;
            return ms switch
            {
                <= PerformanceThresholds.EXCELLENT_MS => "Excellent",
                <= PerformanceThresholds.GOOD_MS => "Good",
                <= PerformanceThresholds.NORMAL_MS => "Normal",
                <= PerformanceThresholds.SLOW_MS => "Slow",
                _ => "Critical"
            };
        }

        private static double CalculateThroughput(List<PerformanceLog> logs)
        {
            if (!logs.Any()) return 0;

            var timeSpan = logs.Max(l => l.Timestamp) - logs.Min(l => l.Timestamp);
            var minutes = timeSpan.TotalMinutes;
            
            return minutes > 0 ? logs.Count / minutes : logs.Count;
        }

        private static Dictionary<string, int> GetResponseTimeDistribution(List<PerformanceLog> logs)
        {
            var distribution = new Dictionary<string, int>
            {
                ["0-100ms"] = logs.Count(l => l.Duration.TotalMilliseconds <= 100),
                ["101-300ms"] = logs.Count(l => l.Duration.TotalMilliseconds > 100 && l.Duration.TotalMilliseconds <= 300),
                ["301-1000ms"] = logs.Count(l => l.Duration.TotalMilliseconds > 300 && l.Duration.TotalMilliseconds <= 1000),
                ["1001-3000ms"] = logs.Count(l => l.Duration.TotalMilliseconds > 1000 && l.Duration.TotalMilliseconds <= 3000),
                ["3000ms+"] = logs.Count(l => l.Duration.TotalMilliseconds > 3000)
            };

            return distribution;
        }

        private static Dictionary<string, double> GetOperationAverages(List<PerformanceLog> logs)
        {
            return logs
                .GroupBy(l => l.Operation)
                .ToDictionary(
                    g => g.Key,
                    g => g.Average(l => l.Duration.TotalMilliseconds)
                );
        }
    }
}