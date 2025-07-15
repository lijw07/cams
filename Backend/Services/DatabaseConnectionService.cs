using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.EntityFrameworkCore;
using cams.Backend.Configuration;
using cams.Backend.Model;
using cams.Backend.View;
using cams.Backend.Enums;
using cams.Backend.Data;
using Backend.Helpers;
using cams.Backend.Helpers;

namespace cams.Backend.Services
{
    public class DatabaseConnectionService(
        ILogger<DatabaseConnectionService> logger,
        IOptions<JwtSettings> jwtSettings,
        IApplicationService applicationService,
        ApplicationDbContext context,
        IConnectionTestService connectionTestService)
        : IDatabaseConnectionService
    {
        private readonly JwtSettings _jwtSettings = jwtSettings.Value;

        public async Task<IEnumerable<DatabaseConnectionResponse>> GetUserConnectionsAsync(Guid userId, Guid? applicationId = null)
        {
            var query = context.DatabaseConnections
                .Include(c => c.Application)
                .Where(c => c.UserId == userId);

            if (applicationId.HasValue)
                query = query.Where(c => c.ApplicationId == applicationId.Value);

            var connections = await query
                .OrderBy(c => c.Name)
                .ToListAsync();

            return connections.Select(c => MapToResponse(c));
        }

        public async Task<DatabaseConnectionResponse?> GetConnectionByIdAsync(Guid id, Guid userId)
        {
            var connection = await context.DatabaseConnections
                .Include(c => c.Application)
                .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

            return connection != null ? MapToResponse(connection, includeSensitiveData: true) : null;
        }

        public async Task<DatabaseConnection?> GetConnectionAsync(Guid id, Guid userId)
        {
            return await context.DatabaseConnections
                .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
        }

        public async Task<DatabaseConnectionResponse> CreateConnectionAsync(DatabaseConnectionRequest request, Guid userId)
        {
            // Validate that the user has access to the specified application (if provided)
            if (request.ApplicationId.HasValue)
            {
                var hasAccess = await applicationService.ValidateApplicationAccessAsync(request.ApplicationId.Value, userId);
                if (!hasAccess)
                {
                    throw new UnauthorizedAccessException("User does not have access to the specified application");
                }
            }

            var connection = new DatabaseConnection
            {
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

            context.DatabaseConnections.Add(connection);
            await context.SaveChangesAsync();

            // Load the application for the response
            await context.Entry(connection)
                .Reference(c => c.Application)
                .LoadAsync();

            logger.LogInformation("Created database connection {ConnectionName} for user {UserId}",
                LoggingHelper.Sanitize(request.Name), userId);

            return MapToResponse(connection);
        }

        public async Task<DatabaseConnectionResponse?> UpdateConnectionAsync(DatabaseConnectionUpdateRequest request, Guid userId)
        {
            var connection = await context.DatabaseConnections
                .Include(c => c.Application)
                .FirstOrDefaultAsync(c => c.Id == request.Id && c.UserId == userId);

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

            await context.SaveChangesAsync();

            logger.LogInformation("Updated database connection {ConnectionName} for user {UserId}",
                LoggingHelper.Sanitize(request.Name), userId);

            return MapToResponse(connection);
        }

        public async Task<bool> DeleteConnectionAsync(Guid id, Guid userId)
        {
            var connection = await context.DatabaseConnections
                .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

            if (connection == null)
                return false;

            context.DatabaseConnections.Remove(connection);
            await context.SaveChangesAsync();

            logger.LogInformation("Deleted database connection {ConnectionId} for user {UserId}", id, userId);

            return true;
        }

        public async Task<DatabaseConnectionTestResponse> TestConnectionAsync(DatabaseConnectionTestRequest request, Guid userId)
        {
            try
            {
                // Use the new connection test service
                var testResult = await connectionTestService.TestConnectionWithDetailsAsync(request, userId);

                // Update connection status if testing an existing connection
                if (request.ConnectionId.HasValue && testResult != null)
                {
                    logger.LogInformation("Updating connection status for ConnectionId {ConnectionId} and UserId {UserId} - Test result: {IsSuccessful}", 
                        request.ConnectionId.Value, userId, testResult.IsSuccessful);
                    
                    var connection = await context.DatabaseConnections
                        .FirstOrDefaultAsync(c => c.Id == request.ConnectionId.Value && c.UserId == userId);
                    
                    if (connection != null)
                    {
                        logger.LogInformation("Found connection {ConnectionName} (Id: {ConnectionId}) - Current status: {CurrentStatus}, New status: {NewStatus}", 
                            connection.Name, connection.Id, connection.Status, testResult.IsSuccessful ? ConnectionStatus.Connected : ConnectionStatus.Failed);
                        connection.LastTestedAt = DateTime.UtcNow;
                        connection.Status = testResult.IsSuccessful ? ConnectionStatus.Connected : ConnectionStatus.Failed;
                        connection.LastTestResult = testResult.Message;

                        // If connection details were provided, update the connection with the new details
                        if (request.ConnectionDetails != null)
                        {
                            connection.Name = request.ConnectionDetails.Name ?? connection.Name;
                            connection.Description = request.ConnectionDetails.Description ?? connection.Description;
                            connection.Type = request.ConnectionDetails.Type;
                            connection.Server = request.ConnectionDetails.Server ?? connection.Server;
                            connection.Port = request.ConnectionDetails.Port;
                            connection.Database = request.ConnectionDetails.Database ?? connection.Database;
                            connection.Username = request.ConnectionDetails.Username ?? connection.Username;

                            // Update password if provided
                            if (!string.IsNullOrEmpty(request.ConnectionDetails.Password))
                            {
                                connection.PasswordHash = EncryptSensitiveData(request.ConnectionDetails.Password);
                            }

                            // Update connection string if provided
                            if (!string.IsNullOrEmpty(request.ConnectionDetails.ConnectionString))
                            {
                                connection.ConnectionString = EncryptSensitiveData(request.ConnectionDetails.ConnectionString);
                            }

                            connection.ApiBaseUrl = request.ConnectionDetails.ApiBaseUrl ?? connection.ApiBaseUrl;

                            // Update API key if provided
                            if (!string.IsNullOrEmpty(request.ConnectionDetails.ApiKey))
                            {
                                connection.ApiKey = EncryptSensitiveData(request.ConnectionDetails.ApiKey);
                            }

                            connection.AdditionalSettings = request.ConnectionDetails.AdditionalSettings ?? connection.AdditionalSettings;
                            connection.IsActive = request.ConnectionDetails.IsActive;
                            connection.UpdatedAt = DateTime.UtcNow;

                            logger.LogInformation("Updated connection details for {ConnectionId} during test for user {UserId}", 
                                connection.Id, userId);
                        }

                        // Explicitly mark as modified to ensure Entity Framework tracks changes
                        context.DatabaseConnections.Update(connection);
                        
                        try
                        {
                            var changeCount = await context.SaveChangesAsync();
                            
                            if (changeCount == 0)
                            {
                                logger.LogWarning("No changes were saved for connection {ConnectionId} test result update by user {UserId}", 
                                    connection.Id, userId);
                            }
                            else
                            {
                                logger.LogInformation("Successfully updated connection {ConnectionId} test result for user {UserId} - Status: {Status} ({ChangeCount} changes)",
                                    connection.Id, userId, testResult.IsSuccessful ? "Connected" : "Failed", changeCount);
                            }
                        }
                        catch (Exception ex)
                        {
                            logger.LogError(ex, "Error saving connection test result for {ConnectionId} by user {UserId}", 
                                connection.Id, userId);
                            throw;
                        }
                    }
                    else
                    {
                        logger.LogWarning("Connection not found for ConnectionId {ConnectionId} and UserId {UserId} - cannot update test result", 
                            request.ConnectionId.Value, userId);
                    }
                }

                return testResult;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error testing connection for user {UserId}", userId);

                return new DatabaseConnectionTestResponse
                {
                    IsSuccessful = false,
                    Message = "Connection test failed",
                    TestedAt = DateTime.UtcNow,
                    ResponseTime = TimeSpan.Zero,
                    ErrorDetails = "An unexpected error occurred while testing the connection"
                };
            }
        }

        public async Task<bool> ToggleConnectionStatusAsync(Guid id, Guid userId, bool isActive)
        {
            var connection = await context.DatabaseConnections
                .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

            if (connection == null)
                return false;

            connection.IsActive = isActive;
            connection.UpdatedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();

            logger.LogInformation("Toggled connection {ConnectionId} status to {IsActive} for user {UserId}", id, isActive, userId);

            return true;
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

        private DatabaseConnectionResponse MapToResponse(DatabaseConnection connection, bool includeSensitiveData = false)
        {
            var response = new DatabaseConnectionResponse
            {
                Id = connection.Id,
                ApplicationId = connection.ApplicationId,
                ApplicationName = connection.Application?.Name ?? (connection.ApplicationId.HasValue ? $"App-{connection.ApplicationId}" : null),
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


        // New methods implementation

        public async Task<DatabaseConnectionSummary?> GetConnectionSummaryAsync(Guid id, Guid userId)
        {
            var connection = await context.DatabaseConnections
                .Include(c => c.Application)
                .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

            if (connection == null)
                return null;

            return new DatabaseConnectionSummary
            {
                Id = connection.Id,
                Name = connection.Name,
                Type = connection.Type,
                IsActive = connection.IsActive,
                Status = connection.Status,
                LastTestedAt = connection.LastTestedAt,
                ApplicationId = connection.ApplicationId,
                ApplicationName = connection.Application?.Name ?? $"App-{connection.ApplicationId}"
            };
        }

        public async Task<IEnumerable<DatabaseConnectionSummary>> GetConnectionsSummaryAsync(Guid userId, Guid? applicationId = null)
        {
            var query = context.DatabaseConnections
                .Include(c => c.Application)
                .Where(c => c.UserId == userId);

            if (applicationId.HasValue)
                query = query.Where(c => c.ApplicationId == applicationId.Value);

            var connections = await query
                .OrderBy(c => c.Name)
                .ToListAsync();

            return connections.Select(c => new DatabaseConnectionSummary
            {
                Id = c.Id,
                Name = c.Name,
                Type = c.Type,
                IsActive = c.IsActive,
                Status = c.Status,
                LastTestedAt = c.LastTestedAt,
                ApplicationId = c.ApplicationId,
                ApplicationName = c.Application?.Name ?? $"App-{c.ApplicationId}"
            });
        }

        public async Task<ConnectionHealthResponse?> GetConnectionHealthAsync(Guid id, Guid userId)
        {
            var connection = await context.DatabaseConnections
                .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

            if (connection == null)
                return null;

            var isHealthy = connection.Status == ConnectionStatus.Connected;

            return new ConnectionHealthResponse
            {
                ConnectionId = id,
                IsHealthy = isHealthy,
                LastChecked = connection.LastTestedAt ?? connection.UpdatedAt,
                ResponseTime = TimeSpan.FromMilliseconds(Random.Shared.Next(50, 500)), // Simulated
                ErrorMessage = !isHealthy ? connection.LastTestResult : null
            };
        }

        public async Task<ConnectionHealthResponse?> RefreshConnectionHealthAsync(Guid id, Guid userId)
        {
            var connection = await context.DatabaseConnections
                .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

            if (connection == null)
                return null;

            // Perform a quick health check
            var testRequest = new DatabaseConnectionTestRequest { ConnectionId = id };
            var testResult = await TestConnectionAsync(testRequest, userId);

            return new ConnectionHealthResponse
            {
                ConnectionId = id,
                IsHealthy = testResult.IsSuccessful,
                LastChecked = DateTime.UtcNow,
                ResponseTime = testResult.ResponseTime,
                ErrorMessage = testResult.IsSuccessful ? null : testResult.Message
            };
        }

        public async Task<BulkOperationResponse> BulkToggleStatusAsync(Guid[] connectionIds, bool isActive, Guid userId)
        {
            await Task.CompletedTask;

            var successful = new List<Guid>();
            var failed = new List<BulkOperationError>();

            foreach (var id in connectionIds)
            {
                try
                {
                    var success = await ToggleConnectionStatusAsync(id, userId, isActive);
                    if (success)
                    {
                        successful.Add(id);
                    }
                    else
                    {
                        failed.Add(new BulkOperationError
                        {
                            Id = id,
                            Error = "Connection not found or access denied"
                        });
                    }
                }
                catch (Exception ex)
                {
                    failed.Add(new BulkOperationError
                    {
                        Id = id,
                        Error = ex.Message
                    });
                }
            }

            return new BulkOperationResponse
            {
                Successful = successful.ToArray(),
                Failed = failed.ToArray(),
                Message = $"Bulk toggle completed: {successful.Count} successful, {failed.Count} failed"
            };
        }

        public async Task<BulkOperationResponse> BulkDeleteAsync(Guid[] connectionIds, Guid userId)
        {
            await Task.CompletedTask;

            var successful = new List<Guid>();
            var failed = new List<BulkOperationError>();

            foreach (var id in connectionIds)
            {
                try
                {
                    var success = await DeleteConnectionAsync(id, userId);
                    if (success)
                    {
                        successful.Add(id);
                    }
                    else
                    {
                        failed.Add(new BulkOperationError
                        {
                            Id = id,
                            Error = "Connection not found or access denied"
                        });
                    }
                }
                catch (Exception ex)
                {
                    failed.Add(new BulkOperationError
                    {
                        Id = id,
                        Error = ex.Message
                    });
                }
            }

            return new BulkOperationResponse
            {
                Successful = successful.ToArray(),
                Failed = failed.ToArray(),
                Message = $"Bulk delete completed: {successful.Count} successful, {failed.Count} failed"
            };
        }

        public async Task<ConnectionUsageStatsResponse?> GetConnectionUsageStatsAsync(Guid id, Guid userId)
        {
            var connection = await context.DatabaseConnections
                .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

            if (connection == null)
                return null;

            // In a real implementation, this would query actual usage data
            return new ConnectionUsageStatsResponse
            {
                ConnectionId = id,
                TotalApplications = 1, // Simplified - one app per connection in this model
                ActiveApplications = connection.IsActive ? 1 : 0,
                LastUsed = connection.LastTestedAt ?? connection.UpdatedAt,
                UsageFrequency = new UsageFrequency
                {
                    Daily = Random.Shared.Next(1, 10),
                    Weekly = Random.Shared.Next(5, 50),
                    Monthly = Random.Shared.Next(20, 200)
                }
            };
        }

        public async Task<bool> UpdateLastAccessedAsync(Guid id, Guid userId)
        {
            var connection = await context.DatabaseConnections
                .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

            if (connection == null)
                return false;

            connection.LastAccessedAt = DateTime.UtcNow;
            connection.UpdatedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();

            return true;
        }

        public async Task<IEnumerable<DatabaseConnectionSummary>> GetUnassignedConnectionsAsync(Guid userId)
        {
            var connections = await context.DatabaseConnections
                .Include(c => c.Application)
                .Where(c => c.UserId == userId && !c.ApplicationId.HasValue)
                .OrderBy(c => c.Name)
                .Select(c => new DatabaseConnectionSummary
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    Type = c.Type,
                    TypeName = DatabaseTypeHelper.GetDatabaseTypeName(c.Type),
                    Server = c.Server,
                    Port = c.Port,
                    Database = c.Database,
                    IsActive = c.IsActive,
                    Status = c.Status,
                    StatusName = c.Status.ToString(),
                    LastTestedAt = c.LastTestedAt,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt,
                    ApplicationId = c.ApplicationId,
                    ApplicationName = null // No application assigned
                })
                .ToListAsync();

            return connections;
        }

        public async Task<bool> AssignConnectionToApplicationAsync(Guid connectionId, Guid applicationId, Guid userId)
        {
            using var transaction = await context.Database.BeginTransactionAsync();
            try
            {
                // Verify user owns the connection
                var connection = await context.DatabaseConnections
                    .FirstOrDefaultAsync(c => c.Id == connectionId && c.UserId == userId);

                if (connection == null)
                    return false;

                // Verify user has access to the application  
                var hasAppAccess = await applicationService.ValidateApplicationAccessAsync(applicationId, userId);
                if (!hasAppAccess)
                    return false;

                // Assign the connection to the application
                connection.ApplicationId = applicationId;
                connection.UpdatedAt = DateTime.UtcNow;

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                return true;
            }
            catch
            {
                await transaction.RollbackAsync();
                return false;
            }
        }

        public async Task<bool> UnassignConnectionFromApplicationAsync(Guid connectionId, Guid userId)
        {
            var connection = await context.DatabaseConnections
                .FirstOrDefaultAsync(c => c.Id == connectionId && c.UserId == userId);

            if (connection == null)
                return false;

            // Remove the application assignment
            connection.ApplicationId = null;
            connection.UpdatedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();

            return true;
        }
    }
}