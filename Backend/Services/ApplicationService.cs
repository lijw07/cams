using cams.Backend.Model;
using cams.Backend.View;
using cams.Backend.Enums;

namespace cams.Backend.Services
{
    public class ApplicationService : IApplicationService
    {
        private readonly ILogger<ApplicationService> _logger;
        
        // In a real application, this would be replaced with a database context
        private static readonly List<Application> _applications = new();
        private static readonly List<DatabaseConnection> _connections = new();
        private static int _nextId = 1;
        private static int _nextConnectionId = 1;

        public ApplicationService(ILogger<ApplicationService> logger)
        {
            _logger = logger;
        }

        public async Task<IEnumerable<ApplicationSummaryResponse>> GetUserApplicationsAsync(int userId)
        {
            await Task.CompletedTask;
            
            var applications = _applications
                .Where(a => a.UserId == userId)
                .OrderBy(a => a.Name)
                .ToList();

            return applications.Select(a => MapToSummaryResponse(a));
        }

        public async Task<ApplicationResponse?> GetApplicationByIdAsync(int id, int userId)
        {
            await Task.CompletedTask;
            
            var application = _applications.FirstOrDefault(a => a.Id == id && a.UserId == userId);
            return application != null ? MapToResponse(application) : null;
        }

        public async Task<ApplicationResponse> CreateApplicationAsync(ApplicationRequest request, int userId)
        {
            await Task.CompletedTask;
            
            var application = new Application
            {
                Id = _nextId++,
                UserId = userId,
                Name = request.Name,
                Description = request.Description,
                Version = request.Version,
                Environment = request.Environment,
                Tags = request.Tags,
                IsActive = request.IsActive,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _applications.Add(application);
            
            _logger.LogInformation("Created application {ApplicationName} for user {UserId}", request.Name, userId);
            
            return MapToResponse(application);
        }

        public async Task<ApplicationResponse?> UpdateApplicationAsync(ApplicationUpdateRequest request, int userId)
        {
            await Task.CompletedTask;
            
            var application = _applications.FirstOrDefault(a => a.Id == request.Id && a.UserId == userId);
            if (application == null)
                return null;

            application.Name = request.Name;
            application.Description = request.Description;
            application.Version = request.Version;
            application.Environment = request.Environment;
            application.Tags = request.Tags;
            application.IsActive = request.IsActive;
            application.UpdatedAt = DateTime.UtcNow;

            _logger.LogInformation("Updated application {ApplicationName} for user {UserId}", request.Name, userId);
            
            return MapToResponse(application);
        }

        public async Task<bool> DeleteApplicationAsync(int id, int userId)
        {
            await Task.CompletedTask;
            
            var application = _applications.FirstOrDefault(a => a.Id == id && a.UserId == userId);
            if (application == null)
                return false;

            // Also delete all database connections for this application
            var connectionsToDelete = _connections.Where(c => c.ApplicationId == id).ToList();
            foreach (var connection in connectionsToDelete)
            {
                _connections.Remove(connection);
            }

            _applications.Remove(application);
            
            _logger.LogInformation("Deleted application {ApplicationId} and {ConnectionCount} connections for user {UserId}", 
                id, connectionsToDelete.Count, userId);
            
            return true;
        }

        public async Task<bool> ToggleApplicationStatusAsync(int id, int userId, bool isActive)
        {
            await Task.CompletedTask;
            
            var application = _applications.FirstOrDefault(a => a.Id == id && a.UserId == userId);
            if (application == null)
                return false;

            application.IsActive = isActive;
            application.UpdatedAt = DateTime.UtcNow;
            
            _logger.LogInformation("Toggled application {ApplicationId} status to {IsActive} for user {UserId}", 
                id, isActive, userId);
            
            return true;
        }

        public async Task<bool> UpdateLastAccessedAsync(int id, int userId)
        {
            await Task.CompletedTask;
            
            var application = _applications.FirstOrDefault(a => a.Id == id && a.UserId == userId);
            if (application == null)
                return false;

            application.LastAccessedAt = DateTime.UtcNow;
            
            return true;
        }

        public async Task<IEnumerable<DatabaseConnectionSummary>> GetApplicationConnectionsAsync(int applicationId, int userId)
        {
            await Task.CompletedTask;
            
            // Verify user has access to this application
            var application = _applications.FirstOrDefault(a => a.Id == applicationId && a.UserId == userId);
            if (application == null)
                return Enumerable.Empty<DatabaseConnectionSummary>();

            var connections = _connections
                .Where(c => c.ApplicationId == applicationId)
                .OrderBy(c => c.Name)
                .ToList();

            return connections.Select(c => new DatabaseConnectionSummary
            {
                Id = c.Id,
                Name = c.Name,
                TypeName = c.Type.ToString(),
                IsActive = c.IsActive,
                StatusName = c.Status.ToString(),
                LastTestedAt = c.LastTestedAt
            });
        }

        public async Task<bool> ValidateApplicationAccessAsync(int applicationId, int userId)
        {
            await Task.CompletedTask;
            
            return _applications.Any(a => a.Id == applicationId && a.UserId == userId);
        }

        private ApplicationResponse MapToResponse(Application application)
        {
            var connections = _connections
                .Where(c => c.ApplicationId == application.Id)
                .ToList();

            return new ApplicationResponse
            {
                Id = application.Id,
                Name = application.Name,
                Description = application.Description,
                Version = application.Version,
                Environment = application.Environment,
                Tags = application.Tags,
                IsActive = application.IsActive,
                CreatedAt = application.CreatedAt,
                UpdatedAt = application.UpdatedAt,
                LastAccessedAt = application.LastAccessedAt,
                DatabaseConnectionCount = connections.Count,
                DatabaseConnections = connections.Select(c => new DatabaseConnectionSummary
                {
                    Id = c.Id,
                    Name = c.Name,
                    TypeName = c.Type.ToString(),
                    IsActive = c.IsActive,
                    StatusName = c.Status.ToString(),
                    LastTestedAt = c.LastTestedAt
                }).ToList()
            };
        }

        private ApplicationSummaryResponse MapToSummaryResponse(Application application)
        {
            var connections = _connections
                .Where(c => c.ApplicationId == application.Id)
                .ToList();

            return new ApplicationSummaryResponse
            {
                Id = application.Id,
                Name = application.Name,
                Description = application.Description,
                Version = application.Version,
                Environment = application.Environment,
                IsActive = application.IsActive,
                CreatedAt = application.CreatedAt,
                UpdatedAt = application.UpdatedAt,
                LastAccessedAt = application.LastAccessedAt,
                DatabaseConnectionCount = connections.Count,
                ActiveConnectionCount = connections.Count(c => c.IsActive)
            };
        }

        // Combined application and database connection operations
        public async Task<ApplicationWithConnectionResponse> CreateApplicationWithConnectionAsync(ApplicationWithConnectionRequest request, int userId)
        {
            await Task.CompletedTask;
            
            // Create application
            var application = new Application
            {
                Id = _nextId++,
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

            // Create database connection
            var connection = new DatabaseConnection
            {
                Id = _nextConnectionId++,
                UserId = userId,
                ApplicationId = application.Id,
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
                Status = ConnectionStatus.Untested,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            // Add to collections
            _applications.Add(application);
            _connections.Add(connection);
            
            _logger.LogInformation("Created application {ApplicationName} with connection {ConnectionName} for user {UserId}", 
                application.Name, connection.Name, userId);
            
            // Simple connection test simulation if requested
            bool testResult = false;
            string? testMessage = null;
            TimeSpan? testDuration = null;
            
            if (request.TestConnectionOnCreate)
            {
                try
                {
                    var testStartTime = DateTime.UtcNow;
                    // Simple validation - in production this would actually test the connection
                    testResult = !string.IsNullOrEmpty(connection.Server) && 
                                 (connection.Type != DatabaseType.SqlServer || !string.IsNullOrEmpty(connection.Database));
                    testMessage = testResult ? "Connection validated successfully" : "Connection validation failed - missing required fields";
                    testDuration = DateTime.UtcNow - testStartTime;
                    
                    // Update connection status
                    connection.Status = testResult ? ConnectionStatus.Connected : ConnectionStatus.Failed;
                    connection.LastTestedAt = DateTime.UtcNow;
                    connection.LastTestResult = testMessage;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error testing connection during application creation");
                    testResult = false;
                    testMessage = $"Connection test failed: {ex.Message}";
                    connection.Status = ConnectionStatus.Failed;
                    connection.LastTestedAt = DateTime.UtcNow;
                    connection.LastTestResult = testMessage;
                }
            }
            
            return MapToApplicationWithConnectionResponse(application, connection, testResult, testMessage, testDuration);
        }

        public async Task<ApplicationWithConnectionResponse?> UpdateApplicationWithConnectionAsync(ApplicationWithConnectionUpdateRequest request, int userId)
        {
            await Task.CompletedTask;
            
            // Find existing application and connection
            var existingApp = _applications.FirstOrDefault(a => a.Id == request.ApplicationId && a.UserId == userId);
            var existingConnection = _connections.FirstOrDefault(c => c.Id == request.ConnectionId && c.UserId == userId);
            
            if (existingApp == null || existingConnection == null)
                return null;
            
            // Verify connection belongs to application
            if (existingConnection.ApplicationId != existingApp.Id)
                return null;
            
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
            
            _logger.LogInformation("Updated application {ApplicationName} with connection {ConnectionName} for user {UserId}", 
                existingApp.Name, existingConnection.Name, userId);
            
            // Test connection if requested
            bool testResult = false;
            string? testMessage = null;
            TimeSpan? testDuration = null;
            
            if (request.TestConnectionOnCreate)
            {
                try
                {
                    var testStartTime = DateTime.UtcNow;
                    // Simple validation
                    testResult = !string.IsNullOrEmpty(existingConnection.Server) && 
                                 (existingConnection.Type != DatabaseType.SqlServer || !string.IsNullOrEmpty(existingConnection.Database));
                    testMessage = testResult ? "Connection validated successfully" : "Connection validation failed - missing required fields";
                    testDuration = DateTime.UtcNow - testStartTime;
                    
                    // Update connection status
                    existingConnection.Status = testResult ? ConnectionStatus.Connected : ConnectionStatus.Failed;
                    existingConnection.LastTestedAt = DateTime.UtcNow;
                    existingConnection.LastTestResult = testMessage;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error testing connection during application update");
                    testResult = false;
                    testMessage = $"Connection test failed: {ex.Message}";
                    existingConnection.Status = ConnectionStatus.Failed;
                    existingConnection.LastTestedAt = DateTime.UtcNow;
                    existingConnection.LastTestResult = testMessage;
                }
            }
            
            return MapToApplicationWithConnectionResponse(existingApp, existingConnection, testResult, testMessage, testDuration);
        }

        public async Task<ApplicationWithConnectionResponse?> GetApplicationWithPrimaryConnectionAsync(int applicationId, int userId)
        {
            await Task.CompletedTask;
            
            // Find application
            var application = _applications.FirstOrDefault(a => a.Id == applicationId && a.UserId == userId);
            if (application == null)
                return null;
            
            // Get the first (primary) connection for this application
            var primaryConnection = _connections.FirstOrDefault(c => c.ApplicationId == applicationId);
            if (primaryConnection == null)
                return null;
            
            return MapToApplicationWithConnectionResponse(application, primaryConnection);
        }

        private ApplicationWithConnectionResponse MapToApplicationWithConnectionResponse(Application application, DatabaseConnection connection, bool testResult = false, string? testMessage = null, TimeSpan? testDuration = null)
        {
            var appResponse = MapToResponse(application);
            var connResponse = MapConnectionToResponse(connection);

            return new ApplicationWithConnectionResponse
            {
                Application = appResponse,
                DatabaseConnection = connResponse,
                ConnectionTestResult = testResult,
                ConnectionTestMessage = testMessage,
                ConnectionTestDuration = testDuration
            };
        }

        private DatabaseConnectionResponse MapConnectionToResponse(DatabaseConnection connection)
        {
            return new DatabaseConnectionResponse
            {
                Id = connection.Id,
                ApplicationId = connection.ApplicationId,
                ApplicationName = _applications.FirstOrDefault(a => a.Id == connection.ApplicationId)?.Name ?? "Unknown",
                Name = connection.Name,
                Description = connection.Description,
                Type = connection.Type,
                Server = connection.Server,
                Port = connection.Port,
                Database = connection.Database,
                Username = connection.Username,
                ApiBaseUrl = connection.ApiBaseUrl,
                AdditionalSettings = connection.AdditionalSettings,
                IsActive = connection.IsActive,
                CreatedAt = connection.CreatedAt,
                UpdatedAt = connection.UpdatedAt,
                LastTestedAt = connection.LastTestedAt,
                Status = connection.Status,
                LastTestResult = connection.LastTestResult,
                // Note: Never return password or sensitive data
                ConnectionString = MaskSensitiveInformation(connection.ConnectionString),
                ApiKey = string.IsNullOrEmpty(connection.ApiKey) ? null : "***"
            };
        }

        private static string? MaskSensitiveInformation(string? connectionString)
        {
            if (string.IsNullOrWhiteSpace(connectionString))
                return connectionString;

            // Simple masking - replace password with ***
            var masked = connectionString;
            
            if (masked.Contains("password", StringComparison.OrdinalIgnoreCase))
            {
                var passwordPattern = @"(password\s*=\s*)[^;]+";
                masked = System.Text.RegularExpressions.Regex.Replace(
                    masked, 
                    passwordPattern, 
                    "$1***", 
                    System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            }

            return masked;
        }
    }
}