using cams.Backend.Model;

namespace cams.Backend.Services
{
    public interface ILoggingService
    {
        // Audit Log methods
        Task LogAuditAsync(Guid userId, string action, string entityType, Guid? entityId = null,
            string? entityName = null, string? oldValues = null, string? newValues = null,
            string? description = null, string? ipAddress = null, string? userAgent = null,
            string severity = "Information");

        Task<IEnumerable<AuditLog>> GetAuditLogsAsync(Guid? userId = null, string? entityType = null,
            DateTime? fromDate = null, DateTime? toDate = null, int pageSize = 100, int pageNumber = 1);

        Task<(IEnumerable<AuditLog> data, int totalCount)> GetAuditLogsWithCountAsync(Guid? userId = null,
            string? entityType = null, DateTime? fromDate = null, DateTime? toDate = null,
            int pageSize = 100, int pageNumber = 1);

        Task<AuditLog?> GetAuditLogByIdAsync(Guid id);

        // Security Log methods
        Task LogSecurityEventAsync(string eventType, string status, Guid? userId = null,
            string? username = null, string? description = null, string? ipAddress = null,
            string? userAgent = null, string? sessionId = null, string? resource = null,
            string? metadata = null, string severity = "Information", string? failureReason = null);

        Task<IEnumerable<SecurityLog>> GetSecurityLogsAsync(string? eventType = null, string? status = null,
            Guid? userId = null, DateTime? fromDate = null, DateTime? toDate = null,
            int pageSize = 100, int pageNumber = 1);

        Task<(IEnumerable<SecurityLog> data, int totalCount)> GetSecurityLogsWithCountAsync(string? eventType = null, string? status = null,
            Guid? userId = null, DateTime? fromDate = null, DateTime? toDate = null,
            int pageSize = 100, int pageNumber = 1);

        Task<SecurityLog?> GetSecurityLogByIdAsync(Guid id);

        Task<IEnumerable<SecurityLog>> GetFailedLoginAttemptsAsync(string? ipAddress = null,
            DateTime? fromDate = null, int? threshold = 5);

        // System Log methods
        Task LogSystemEventAsync(string eventType, string level, string source, string message,
            string? details = null, string? stackTrace = null, string? correlationId = null,
            Guid? userId = null, string? ipAddress = null, string? requestPath = null,
            string? httpMethod = null, int? statusCode = null, TimeSpan? duration = null);

        Task<IEnumerable<SystemLog>> GetSystemLogsAsync(string? level = null, string? source = null,
            DateTime? fromDate = null, DateTime? toDate = null, bool? isResolved = null,
            int pageSize = 100, int pageNumber = 1);

        Task<(IEnumerable<SystemLog> data, int totalCount)> GetSystemLogsWithCountAsync(string? level = null, string? source = null,
            DateTime? fromDate = null, DateTime? toDate = null, bool? isResolved = null,
            int pageSize = 100, int pageNumber = 1);

        Task<SystemLog?> GetSystemLogByIdAsync(Guid id);

        Task MarkSystemLogResolvedAsync(Guid logId, string? resolutionNotes = null);

        // Performance Log methods
        Task LogPerformanceAsync(string operation, TimeSpan duration, string? controller = null,
            string? action = null, string? requestPath = null, string? httpMethod = null,
            Guid? userId = null, int statusCode = 200, TimeSpan? databaseTime = null,
            TimeSpan? externalServiceTime = null, long? requestSizeBytes = null,
            long? responseSizeBytes = null, string? ipAddress = null, string? userAgent = null,
            string? correlationId = null, int? databaseQueryCount = null,
            int? cacheHitCount = null, int? cacheMissCount = null, string? metadata = null);

        Task<IEnumerable<PerformanceLog>> GetPerformanceLogsAsync(string? operation = null,
            string? performanceLevel = null, DateTime? fromDate = null, DateTime? toDate = null,
            bool? isSlowQuery = null, int pageSize = 100, int pageNumber = 1);

        Task<(IEnumerable<PerformanceLog> data, int totalCount)> GetPerformanceLogsWithCountAsync(string? operation = null,
            string? performanceLevel = null, DateTime? fromDate = null, DateTime? toDate = null,
            bool? isSlowQuery = null, int pageSize = 100, int pageNumber = 1);

        Task<PerformanceLog?> GetPerformanceLogByIdAsync(Guid id);

        Task<PerformanceMetrics> GetPerformanceMetricsAsync(DateTime? fromDate = null,
            DateTime? toDate = null, string? operation = null);

        // Cleanup methods
        Task CleanupOldLogsAsync(int retentionDays = 90);
        Task CleanupAuditLogsAsync(int retentionDays = 365);
        Task CleanupSecurityLogsAsync(int retentionDays = 180);
        Task CleanupSystemLogsAsync(int retentionDays = 90);
        Task CleanupPerformanceLogsAsync(int retentionDays = 30);
    }
}