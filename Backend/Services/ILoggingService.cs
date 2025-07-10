using cams.Backend.Model;

namespace cams.Backend.Services
{
    public interface ILoggingService
    {
        // Audit Log methods
        Task LogAuditAsync(int userId, string action, string entityType, int? entityId = null, 
            string? entityName = null, string? oldValues = null, string? newValues = null, 
            string? description = null, string? ipAddress = null, string? userAgent = null, 
            string severity = "Information");

        Task<IEnumerable<AuditLog>> GetAuditLogsAsync(int? userId = null, string? entityType = null, 
            DateTime? fromDate = null, DateTime? toDate = null, int pageSize = 100, int pageNumber = 1);

        // Security Log methods
        Task LogSecurityEventAsync(string eventType, string status, int? userId = null, 
            string? username = null, string? description = null, string? ipAddress = null, 
            string? userAgent = null, string? sessionId = null, string? resource = null, 
            string? metadata = null, string severity = "Information", string? failureReason = null);

        Task<IEnumerable<SecurityLog>> GetSecurityLogsAsync(string? eventType = null, string? status = null, 
            int? userId = null, DateTime? fromDate = null, DateTime? toDate = null, 
            int pageSize = 100, int pageNumber = 1);

        Task<IEnumerable<SecurityLog>> GetFailedLoginAttemptsAsync(string? ipAddress = null, 
            DateTime? fromDate = null, int? threshold = 5);

        // System Log methods
        Task LogSystemEventAsync(string eventType, string level, string source, string message, 
            string? details = null, string? stackTrace = null, string? correlationId = null, 
            int? userId = null, string? ipAddress = null, string? requestPath = null, 
            string? httpMethod = null, int? statusCode = null, TimeSpan? duration = null);

        Task<IEnumerable<SystemLog>> GetSystemLogsAsync(string? level = null, string? source = null, 
            DateTime? fromDate = null, DateTime? toDate = null, bool? isResolved = null, 
            int pageSize = 100, int pageNumber = 1);

        Task MarkSystemLogResolvedAsync(int logId, string? resolutionNotes = null);

        // Performance Log methods
        Task LogPerformanceAsync(string operation, TimeSpan duration, string? controller = null, 
            string? action = null, string? requestPath = null, string? httpMethod = null, 
            int? userId = null, int statusCode = 200, TimeSpan? databaseTime = null, 
            TimeSpan? externalServiceTime = null, long? requestSizeBytes = null, 
            long? responseSizeBytes = null, string? ipAddress = null, string? userAgent = null, 
            string? correlationId = null, int? databaseQueryCount = null, 
            int? cacheHitCount = null, int? cacheMissCount = null, string? metadata = null);

        Task<IEnumerable<PerformanceLog>> GetPerformanceLogsAsync(string? operation = null, 
            string? performanceLevel = null, DateTime? fromDate = null, DateTime? toDate = null, 
            bool? isSlowQuery = null, int pageSize = 100, int pageNumber = 1);

        Task<PerformanceMetrics> GetPerformanceMetricsAsync(DateTime? fromDate = null, 
            DateTime? toDate = null, string? operation = null);

        // Cleanup methods
        Task CleanupOldLogsAsync(int retentionDays = 90);
        Task CleanupAuditLogsAsync(int retentionDays = 365);
        Task CleanupSecurityLogsAsync(int retentionDays = 180);
        Task CleanupSystemLogsAsync(int retentionDays = 90);
        Task CleanupPerformanceLogsAsync(int retentionDays = 30);
    }

    public class PerformanceMetrics
    {
        public double AverageResponseTime { get; set; }
        public double MedianResponseTime { get; set; }
        public double P95ResponseTime { get; set; }
        public double P99ResponseTime { get; set; }
        public int TotalRequests { get; set; }
        public int SlowRequests { get; set; }
        public int ErrorRequests { get; set; }
        public double ErrorRate { get; set; }
        public double ThroughputPerMinute { get; set; }
        public Dictionary<string, int> ResponseTimeDistribution { get; set; } = new();
        public Dictionary<string, double> OperationAverages { get; set; } = new();
    }
}