using cams.Backend.View;
using cams.Backend.Enums;

namespace cams.Backend.Services
{
    public interface IDatabaseConnectionService
    {
        Task<IEnumerable<DatabaseConnectionResponse>> GetUserConnectionsAsync(int userId, int? applicationId = null);
        Task<DatabaseConnectionResponse?> GetConnectionByIdAsync(int id, int userId);
        Task<DatabaseConnectionResponse> CreateConnectionAsync(DatabaseConnectionRequest request, int userId);
        Task<DatabaseConnectionResponse?> UpdateConnectionAsync(DatabaseConnectionUpdateRequest request, int userId);
        Task<bool> DeleteConnectionAsync(int id, int userId);
        Task<DatabaseConnectionTestResponse> TestConnectionAsync(DatabaseConnectionTestRequest request, int userId);
        Task<bool> ToggleConnectionStatusAsync(int id, int userId, bool isActive);
        string BuildConnectionString(DatabaseConnectionRequest request);
        string EncryptSensitiveData(string data);
        string DecryptSensitiveData(string encryptedData);
        
        // Additional methods for new endpoints
        ConnectionStringValidationResponse ValidateConnectionString(string connectionString, DatabaseType databaseType);
        Task<DatabaseConnectionSummary?> GetConnectionSummaryAsync(int id, int userId);
        Task<IEnumerable<DatabaseConnectionSummary>> GetConnectionsSummaryAsync(int userId, int? applicationId = null);
        Task<ConnectionHealthResponse?> GetConnectionHealthAsync(int id, int userId);
        Task<ConnectionHealthResponse?> RefreshConnectionHealthAsync(int id, int userId);
        Task<BulkOperationResponse> BulkToggleStatusAsync(int[] connectionIds, bool isActive, int userId);
        Task<BulkOperationResponse> BulkDeleteAsync(int[] connectionIds, int userId);
        Task<ConnectionUsageStatsResponse?> GetConnectionUsageStatsAsync(int id, int userId);
        Task<bool> UpdateLastAccessedAsync(int id, int userId);
    }
}