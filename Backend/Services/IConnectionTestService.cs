using cams.Backend.Enums;
using cams.Backend.View;

namespace cams.Backend.Services
{
    public interface IConnectionTestService
    {
        Task<DatabaseConnectionTestResponse> TestConnectionAsync(
            string connectionString, 
            DatabaseType databaseType, 
            Guid userId,
            CancellationToken cancellationToken = default);
        
        Task<DatabaseConnectionTestResponse> TestConnectionWithDetailsAsync(
            DatabaseConnectionTestRequest request, 
            Guid userId,
            CancellationToken cancellationToken = default);
            
        ConnectionStringValidationResponse ValidateConnectionString(
            string connectionString, 
            DatabaseType databaseType);
    }
}