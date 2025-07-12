using cams.Backend.View;
using cams.Backend.Enums;

namespace cams.Backend.Services
{
    public interface IDatabaseConnectionService
    {
        Task<IEnumerable<DatabaseConnectionResponse>> GetUserConnectionsAsync(Guid userId, Guid? applicationId = null);
        Task<DatabaseConnectionResponse?> GetConnectionByIdAsync(Guid id, Guid userId);
        Task<DatabaseConnectionResponse> CreateConnectionAsync(DatabaseConnectionRequest request, Guid userId);
        Task<DatabaseConnectionResponse?> UpdateConnectionAsync(DatabaseConnectionUpdateRequest request, Guid userId);
        Task<bool> DeleteConnectionAsync(Guid id, Guid userId);
        Task<DatabaseConnectionTestResponse> TestConnectionAsync(DatabaseConnectionTestRequest request, Guid userId);
        Task<bool> ToggleConnectionStatusAsync(Guid id, Guid userId, bool isActive);
        string BuildConnectionString(DatabaseConnectionRequest request);
        string EncryptSensitiveData(string data);
        string DecryptSensitiveData(string encryptedData);

        // Additional methods for new endpoints
        ConnectionStringValidationResponse ValidateConnectionString(string connectionString, DatabaseType databaseType);
        Task<DatabaseConnectionSummary?> GetConnectionSummaryAsync(Guid id, Guid userId);
        Task<IEnumerable<DatabaseConnectionSummary>> GetConnectionsSummaryAsync(Guid userId, Guid? applicationId = null);
        Task<ConnectionHealthResponse?> GetConnectionHealthAsync(Guid id, Guid userId);
        Task<ConnectionHealthResponse?> RefreshConnectionHealthAsync(Guid id, Guid userId);
        Task<BulkOperationResponse> BulkToggleStatusAsync(Guid[] connectionIds, bool isActive, Guid userId);
        Task<BulkOperationResponse> BulkDeleteAsync(Guid[] connectionIds, Guid userId);
        Task<ConnectionUsageStatsResponse?> GetConnectionUsageStatsAsync(Guid id, Guid userId);
        Task<bool> UpdateLastAccessedAsync(Guid id, Guid userId);
        
        // New methods for connection assignment
        Task<IEnumerable<DatabaseConnectionSummary>> GetUnassignedConnectionsAsync(Guid userId);
        Task<bool> AssignConnectionToApplicationAsync(Guid connectionId, Guid applicationId, Guid userId);
        Task<bool> UnassignConnectionFromApplicationAsync(Guid connectionId, Guid userId);
    }
}