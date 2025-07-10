using Microsoft.Data.SqlClient;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using cams.Backend.Configuration;
using cams.Backend.Model;
using cams.Backend.View;
using cams.Backend.Enums;

namespace cams.Backend.Services
{
    public class DatabaseConnectionService : IDatabaseConnectionService
    {
        private readonly ILogger<DatabaseConnectionService> _logger;
        private readonly JwtSettings _jwtSettings;
        private readonly IApplicationService _applicationService;
        
        // In a real application, this would be replaced with a database context
        private static readonly List<DatabaseConnection> _connections = new();
        private static int _nextId = 1;

        public DatabaseConnectionService(ILogger<DatabaseConnectionService> logger, IOptions<JwtSettings> jwtSettings, IApplicationService applicationService)
        {
            _logger = logger;
            _jwtSettings = jwtSettings.Value;
            _applicationService = applicationService;
        }

        public async Task<IEnumerable<DatabaseConnectionResponse>> GetUserConnectionsAsync(int userId, int? applicationId = null)
        {
            await Task.CompletedTask;
            
            var connections = _connections
                .Where(c => c.UserId == userId)
                .Where(c => applicationId == null || c.ApplicationId == applicationId)
                .OrderBy(c => c.Name)
                .ToList();

            return connections.Select(c => MapToResponse(c));
        }

        public async Task<DatabaseConnectionResponse?> GetConnectionByIdAsync(int id, int userId)
        {
            await Task.CompletedTask;
            
            var connection = _connections.FirstOrDefault(c => c.Id == id && c.UserId == userId);
            return connection != null ? MapToResponse(connection, includeSensitiveData: true) : null;
        }

        public async Task<DatabaseConnectionResponse> CreateConnectionAsync(DatabaseConnectionRequest request, int userId)
        {
            // Validate that the user has access to the specified application
            var hasAccess = await _applicationService.ValidateApplicationAccessAsync(request.ApplicationId, userId);
            if (!hasAccess)
            {
                throw new UnauthorizedAccessException("User does not have access to the specified application");
            }
            
            var connection = new DatabaseConnection
            {
                Id = _nextId++,
                UserId = userId,
                ApplicationId = request.ApplicationId,
                Name = request.Name,
                Description = request.Description,
                Type = request.Type,
                Server = request.Server,
                Port = request.Port,
                Database = request.Database,
                Username = request.Username,
                PasswordHash = !string.IsNullOrEmpty(request.Password) ? EncryptSensitiveData(request.Password) : null,
                ConnectionString = !string.IsNullOrEmpty(request.ConnectionString) ? EncryptSensitiveData(request.ConnectionString) : null,
                ApiBaseUrl = request.ApiBaseUrl,
                ApiKey = !string.IsNullOrEmpty(request.ApiKey) ? EncryptSensitiveData(request.ApiKey) : null,
                AdditionalSettings = request.AdditionalSettings,
                IsActive = request.IsActive,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _connections.Add(connection);
            
            _logger.LogInformation("Created database connection {ConnectionName} for user {UserId}", request.Name, userId);
            
            return MapToResponse(connection);
        }

        public async Task<DatabaseConnectionResponse?> UpdateConnectionAsync(DatabaseConnectionUpdateRequest request, int userId)
        {
            await Task.CompletedTask;
            
            var connection = _connections.FirstOrDefault(c => c.Id == request.Id && c.UserId == userId);
            if (connection == null)
                return null;

            connection.Name = request.Name;
            connection.Description = request.Description;
            connection.Type = request.Type;
            connection.Server = request.Server;
            connection.Port = request.Port;
            connection.Database = request.Database;
            connection.Username = request.Username;
            
            if (!string.IsNullOrEmpty(request.Password))
                connection.PasswordHash = EncryptSensitiveData(request.Password);
            
            if (!string.IsNullOrEmpty(request.ConnectionString))
                connection.ConnectionString = EncryptSensitiveData(request.ConnectionString);
            
            connection.ApiBaseUrl = request.ApiBaseUrl;
            
            if (!string.IsNullOrEmpty(request.ApiKey))
                connection.ApiKey = EncryptSensitiveData(request.ApiKey);
            
            connection.AdditionalSettings = request.AdditionalSettings;
            connection.IsActive = request.IsActive;
            connection.UpdatedAt = DateTime.UtcNow;

            _logger.LogInformation("Updated database connection {ConnectionName} for user {UserId}", request.Name, userId);
            
            return MapToResponse(connection);
        }

        public async Task<bool> DeleteConnectionAsync(int id, int userId)
        {
            await Task.CompletedTask;
            
            var connection = _connections.FirstOrDefault(c => c.Id == id && c.UserId == userId);
            if (connection == null)
                return false;

            _connections.Remove(connection);
            
            _logger.LogInformation("Deleted database connection {ConnectionId} for user {UserId}", id, userId);
            
            return true;
        }

        public async Task<DatabaseConnectionTestResponse> TestConnectionAsync(DatabaseConnectionTestRequest request, int userId)
        {
            var startTime = DateTime.UtcNow;
            
            try
            {
                DatabaseConnection? connection = null;
                DatabaseConnectionRequest? connectionDetails = null;

                if (request.ConnectionId.HasValue)
                {
                    connection = _connections.FirstOrDefault(c => c.Id == request.ConnectionId.Value && c.UserId == userId);
                    if (connection == null)
                    {
                        return new DatabaseConnectionTestResponse
                        {
                            IsSuccessful = false,
                            Message = "Connection not found",
                            TestedAt = DateTime.UtcNow,
                            ResponseTime = TimeSpan.Zero
                        };
                    }
                }
                else if (request.ConnectionDetails != null)
                {
                    connectionDetails = request.ConnectionDetails;
                }
                else
                {
                    return new DatabaseConnectionTestResponse
                    {
                        IsSuccessful = false,
                        Message = "No connection details provided",
                        TestedAt = DateTime.UtcNow,
                        ResponseTime = TimeSpan.Zero
                    };
                }

                var testResult = await PerformConnectionTestAsync(connection, connectionDetails);
                
                if (connection != null)
                {
                    connection.LastTestedAt = DateTime.UtcNow;
                    connection.Status = testResult.IsSuccessful ? ConnectionStatus.Connected : ConnectionStatus.Failed;
                    connection.LastTestResult = testResult.Message;
                }

                return testResult;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error testing connection for user {UserId}", userId);
                
                return new DatabaseConnectionTestResponse
                {
                    IsSuccessful = false,
                    Message = "Connection test failed",
                    TestedAt = DateTime.UtcNow,
                    ResponseTime = DateTime.UtcNow - startTime,
                    ErrorDetails = ex.Message
                };
            }
        }

        public async Task<bool> ToggleConnectionStatusAsync(int id, int userId, bool isActive)
        {
            await Task.CompletedTask;
            
            var connection = _connections.FirstOrDefault(c => c.Id == id && c.UserId == userId);
            if (connection == null)
                return false;

            connection.IsActive = isActive;
            connection.UpdatedAt = DateTime.UtcNow;
            
            _logger.LogInformation("Toggled connection {ConnectionId} status to {IsActive} for user {UserId}", id, isActive, userId);
            
            return true;
        }

        public string BuildConnectionString(DatabaseConnectionRequest request)
        {
            if (!string.IsNullOrEmpty(request.ConnectionString))
                return request.ConnectionString;

            return request.Type switch
            {
                DatabaseType.SqlServer => $"Server={request.Server}{(request.Port.HasValue ? $",{request.Port}" : "")};Database={request.Database};User Id={request.Username};Password={request.Password};TrustServerCertificate=true",
                DatabaseType.Oracle => $"Data Source={request.Server}:{request.Port ?? 1521}/{request.Database};User Id={request.Username};Password={request.Password};",
                DatabaseType.SQLite => $"Data Source={request.Database}",
                _ => throw new NotSupportedException($"Database type {request.Type} is not supported for connection string generation")
            };
        }

        public string EncryptSensitiveData(string data)
        {
            if (string.IsNullOrEmpty(data))
                return string.Empty;

            var key = Encoding.UTF8.GetBytes(_jwtSettings.Secret.PadRight(32)[..32]);
            using var aes = Aes.Create();
            aes.Key = key;
            aes.GenerateIV();
            
            using var encryptor = aes.CreateEncryptor();
            using var ms = new MemoryStream();
            ms.Write(aes.IV, 0, aes.IV.Length);
            
            using (var cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
            using (var writer = new StreamWriter(cs))
            {
                writer.Write(data);
            }
            
            return Convert.ToBase64String(ms.ToArray());
        }

        public string DecryptSensitiveData(string encryptedData)
        {
            if (string.IsNullOrEmpty(encryptedData))
                return string.Empty;

            var key = Encoding.UTF8.GetBytes(_jwtSettings.Secret.PadRight(32)[..32]);
            var buffer = Convert.FromBase64String(encryptedData);
            
            using var aes = Aes.Create();
            aes.Key = key;
            
            var iv = new byte[aes.IV.Length];
            Array.Copy(buffer, 0, iv, 0, iv.Length);
            aes.IV = iv;
            
            using var decryptor = aes.CreateDecryptor();
            using var ms = new MemoryStream(buffer, iv.Length, buffer.Length - iv.Length);
            using var cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read);
            using var reader = new StreamReader(cs);
            
            return reader.ReadToEnd();
        }

        private async Task<DatabaseConnectionTestResponse> PerformConnectionTestAsync(DatabaseConnection? connection, DatabaseConnectionRequest? request)
        {
            var startTime = DateTime.UtcNow;
            
            try
            {
                var dbType = connection?.Type ?? request?.Type ?? DatabaseType.SqlServer;
                
                switch (dbType)
                {
                    case DatabaseType.SqlServer:
                        return await TestSqlServerConnectionAsync(connection, request, startTime);
                    case DatabaseType.MySQL:
                    case DatabaseType.PostgreSQL:
                        return new DatabaseConnectionTestResponse
                        {
                            IsSuccessful = false,
                            Message = $"Testing for {dbType} is not currently supported",
                            TestedAt = DateTime.UtcNow,
                            ResponseTime = DateTime.UtcNow - startTime
                        };
                    case DatabaseType.RestApi:
                        return await TestApiConnectionAsync(connection, request, startTime);
                    default:
                        return new DatabaseConnectionTestResponse
                        {
                            IsSuccessful = false,
                            Message = $"Testing for {dbType} is not yet implemented",
                            TestedAt = DateTime.UtcNow,
                            ResponseTime = DateTime.UtcNow - startTime
                        };
                }
            }
            catch (Exception ex)
            {
                return new DatabaseConnectionTestResponse
                {
                    IsSuccessful = false,
                    Message = "Connection test failed",
                    TestedAt = DateTime.UtcNow,
                    ResponseTime = DateTime.UtcNow - startTime,
                    ErrorDetails = ex.Message
                };
            }
        }

        private async Task<DatabaseConnectionTestResponse> TestSqlServerConnectionAsync(DatabaseConnection? connection, DatabaseConnectionRequest? request, DateTime startTime)
        {
            var connectionString = GetConnectionString(connection, request);
            
            using var sqlConnection = new SqlConnection(connectionString);
            await sqlConnection.OpenAsync();
            
            var command = sqlConnection.CreateCommand();
            command.CommandText = "SELECT 1";
            var result = await command.ExecuteScalarAsync();
            
            return new DatabaseConnectionTestResponse
            {
                IsSuccessful = true,
                Message = "SQL Server connection successful",
                TestedAt = DateTime.UtcNow,
                ResponseTime = DateTime.UtcNow - startTime,
                AdditionalInfo = new Dictionary<string, object>
                {
                    {"ServerVersion", sqlConnection.ServerVersion},
                    {"Database", sqlConnection.Database}
                }
            };
        }


        private async Task<DatabaseConnectionTestResponse> TestApiConnectionAsync(DatabaseConnection? connection, DatabaseConnectionRequest? request, DateTime startTime)
        {
            var baseUrl = connection?.ApiBaseUrl ?? request?.ApiBaseUrl;
            var apiKey = connection?.ApiKey != null ? DecryptSensitiveData(connection.ApiKey) : request?.ApiKey;
            
            if (string.IsNullOrEmpty(baseUrl))
            {
                return new DatabaseConnectionTestResponse
                {
                    IsSuccessful = false,
                    Message = "API base URL is required",
                    TestedAt = DateTime.UtcNow,
                    ResponseTime = DateTime.UtcNow - startTime
                };
            }

            using var httpClient = new HttpClient();
            httpClient.Timeout = TimeSpan.FromSeconds(30);
            
            if (!string.IsNullOrEmpty(apiKey))
            {
                httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");
            }

            var response = await httpClient.GetAsync(baseUrl);
            
            return new DatabaseConnectionTestResponse
            {
                IsSuccessful = response.IsSuccessStatusCode,
                Message = response.IsSuccessStatusCode ? "API connection successful" : $"API connection failed: {response.StatusCode}",
                TestedAt = DateTime.UtcNow,
                ResponseTime = DateTime.UtcNow - startTime,
                AdditionalInfo = new Dictionary<string, object>
                {
                    {"StatusCode", (int)response.StatusCode},
                    {"ContentType", response.Content.Headers.ContentType?.ToString() ?? "unknown"}
                }
            };
        }

        private string GetConnectionString(DatabaseConnection? connection, DatabaseConnectionRequest? request)
        {
            if (connection?.ConnectionString != null)
                return DecryptSensitiveData(connection.ConnectionString);
            
            if (request?.ConnectionString != null)
                return request.ConnectionString;
            
            if (request != null)
                return BuildConnectionString(request);
            
            throw new InvalidOperationException("No connection string available");
        }

        private DatabaseConnectionResponse MapToResponse(DatabaseConnection connection, bool includeSensitiveData = false)
        {
            var response = new DatabaseConnectionResponse
            {
                Id = connection.Id,
                ApplicationId = connection.ApplicationId,
                ApplicationName = GetApplicationName(connection.ApplicationId),
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
                LastTestResult = connection.LastTestResult
            };

            if (includeSensitiveData)
            {
                response.ConnectionString = connection.ConnectionString != null ? DecryptSensitiveData(connection.ConnectionString) : null;
                response.ApiKey = connection.ApiKey != null ? DecryptSensitiveData(connection.ApiKey) : null;
            }

            return response;
        }
        
        private string GetApplicationName(int applicationId)
        {
            // In a real application, this would be a proper database lookup
            // For now, we'll use a simple approach to get the application name
            return $"App-{applicationId}";
        }
    }
}