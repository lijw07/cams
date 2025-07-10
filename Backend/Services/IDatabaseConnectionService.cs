using cams.Backend.Model;
using cams.Backend.View;

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
    }
}