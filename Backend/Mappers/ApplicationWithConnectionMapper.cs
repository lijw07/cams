using cams.Backend.Model;
using cams.Backend.View;

namespace cams.Backend.Mappers
{
    public interface IApplicationWithConnectionMapper
    {
        (Application application, DatabaseConnection connection) MapToEntities(ApplicationWithConnectionRequest request, int userId);
        ApplicationWithConnectionResponse MapToResponse(Application application, DatabaseConnection connection, bool testResult = false, string? testMessage = null, TimeSpan? testDuration = null);
        (Application application, DatabaseConnection connection) MapUpdateToEntities(ApplicationWithConnectionUpdateRequest request, Application existingApp, DatabaseConnection existingConnection);
    }

    public class ApplicationWithConnectionMapper : IApplicationWithConnectionMapper
    {
        private readonly IApplicationMapper _applicationMapper;
        private readonly IDatabaseConnectionMapper _connectionMapper;

        public ApplicationWithConnectionMapper(IApplicationMapper applicationMapper, IDatabaseConnectionMapper connectionMapper)
        {
            _applicationMapper = applicationMapper;
            _connectionMapper = connectionMapper;
        }

        public (Application application, DatabaseConnection connection) MapToEntities(ApplicationWithConnectionRequest request, int userId)
        {
            // Create application
            var application = new Application
            {
                UserId = userId,
                Name = request.ApplicationName,
                Description = request.ApplicationDescription,
                Version = request.Version,
                Environment = request.Environment,
                Tags = request.Tags,
                IsActive = request.IsApplicationActive,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Create database connection (will be linked to application after application is saved)
            var connection = new DatabaseConnection
            {
                UserId = userId,
                // ApplicationId will be set after application is created
                Name = request.ConnectionName,
                Description = request.ConnectionDescription,
                Type = request.DatabaseType,
                Server = request.Server,
                Port = request.Port,
                Database = request.Database,
                Username = request.Username,
                PasswordHash = request.Password, // Should be encrypted in production
                ConnectionString = request.ConnectionString,
                ApiBaseUrl = request.ApiBaseUrl,
                ApiKey = request.ApiKey,
                AdditionalSettings = request.AdditionalSettings,
                IsActive = request.IsConnectionActive,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            return (application, connection);
        }

        public ApplicationWithConnectionResponse MapToResponse(Application application, DatabaseConnection connection, bool testResult = false, string? testMessage = null, TimeSpan? testDuration = null)
        {
            var appResponse = _applicationMapper.MapToResponse(application);
            var connResponse = _connectionMapper.MapToResponse(connection);

            return new ApplicationWithConnectionResponse
            {
                Application = appResponse,
                DatabaseConnection = connResponse,
                ConnectionTestResult = testResult,
                ConnectionTestMessage = testMessage,
                ConnectionTestDuration = testDuration
            };
        }

        public (Application application, DatabaseConnection connection) MapUpdateToEntities(ApplicationWithConnectionUpdateRequest request, Application existingApp, DatabaseConnection existingConnection)
        {
            // Update application
            existingApp.Name = request.ApplicationName;
            existingApp.Description = request.ApplicationDescription;
            existingApp.Version = request.Version;
            existingApp.Environment = request.Environment;
            existingApp.Tags = request.Tags;
            existingApp.IsActive = request.IsApplicationActive;
            existingApp.UpdatedAt = DateTime.UtcNow;

            // Update connection
            existingConnection.Name = request.ConnectionName;
            existingConnection.Description = request.ConnectionDescription;
            existingConnection.Type = request.DatabaseType;
            existingConnection.Server = request.Server;
            existingConnection.Port = request.Port;
            existingConnection.Database = request.Database;
            existingConnection.Username = request.Username;
            
            // Only update password if provided
            if (!string.IsNullOrWhiteSpace(request.Password))
            {
                existingConnection.PasswordHash = request.Password; // Should be encrypted in production
            }
            
            existingConnection.ConnectionString = request.ConnectionString;
            existingConnection.ApiBaseUrl = request.ApiBaseUrl;
            existingConnection.ApiKey = request.ApiKey;
            existingConnection.AdditionalSettings = request.AdditionalSettings;
            existingConnection.IsActive = request.IsConnectionActive;
            existingConnection.UpdatedAt = DateTime.UtcNow;

            return (existingApp, existingConnection);
        }
    }
}