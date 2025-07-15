using cams.Backend.Model;
using cams.Backend.View;
using cams.Backend.Enums;
using cams.Backend.Data;
using Backend.Helpers;
using Microsoft.EntityFrameworkCore;

namespace cams.Backend.Services
{
    public class ApplicationService(ILogger<ApplicationService> logger, ApplicationDbContext context)
        : IApplicationService
    {
        public async Task<IEnumerable<ApplicationSummaryResponse>> GetUserApplicationsAsync(Guid userId)
        {
            var applications = await context.Applications
                .Include(a => a.DatabaseConnections)
                .Where(a => a.UserId == userId)
                .OrderBy(a => a.Name)
                .ToListAsync();

            return applications.Select(a => MapToSummaryResponse(a));
        }

        public async Task<PagedResult<ApplicationSummaryResponse>> GetUserApplicationsPaginatedAsync(Guid userId, PaginationRequest request)
        {
            var query = context.Applications
                .Include(a => a.DatabaseConnections)
                .Where(a => a.UserId == userId);

            // Apply search filter
            if (!string.IsNullOrWhiteSpace(request.SearchTerm))
            {
                var searchTerm = request.SearchTerm.ToLower();
                query = query.Where(a =>
                    a.Name.ToLower().Contains(searchTerm) ||
                    a.Description!.ToLower().Contains(searchTerm) ||
                    a.Environment!.ToLower().Contains(searchTerm) ||
                    a.Tags!.ToLower().Contains(searchTerm));
            }

            // Apply sorting
            query = request.SortBy?.ToLower() switch
            {
                "name" => request.SortDirection?.ToLower() == "desc"
                    ? query.OrderByDescending(a => a.Name)
                    : query.OrderBy(a => a.Name),
                "createdat" => request.SortDirection?.ToLower() == "desc"
                    ? query.OrderByDescending(a => a.CreatedAt)
                    : query.OrderBy(a => a.CreatedAt),
                "updatedat" => request.SortDirection?.ToLower() == "desc"
                    ? query.OrderByDescending(a => a.UpdatedAt)
                    : query.OrderBy(a => a.UpdatedAt),
                "environment" => request.SortDirection?.ToLower() == "desc"
                    ? query.OrderByDescending(a => a.Environment)
                    : query.OrderBy(a => a.Environment),
                _ => query.OrderBy(a => a.Name) // Default sorting
            };

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Apply pagination
            var applications = await query
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            var mappedApplications = applications.Select(a => MapToSummaryResponse(a));

            return new PagedResult<ApplicationSummaryResponse>
            {
                Items = mappedApplications,
                TotalCount = totalCount,
                PageNumber = request.PageNumber,
                PageSize = request.PageSize
            };
        }

        public async Task<ApplicationResponse?> GetApplicationByIdAsync(Guid id, Guid userId)
        {
            var application = await context.Applications
                .Include(a => a.DatabaseConnections)
                .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
            return application != null ? MapToResponse(application) : null;
        }

        public async Task<ApplicationResponse> CreateApplicationAsync(ApplicationRequest request, Guid userId)
        {
            var application = new Application
            {
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

            context.Applications.Add(application);
            await context.SaveChangesAsync();

            logger.LogInformation("Created application {ApplicationName} for user {UserId}",
                LoggingHelper.Sanitize(request.Name), userId);

            return MapToResponse(application);
        }

        public async Task<ApplicationResponse?> UpdateApplicationAsync(ApplicationUpdateRequest request, Guid userId)
        {
            var application = await context.Applications
                .Include(a => a.DatabaseConnections)
                .FirstOrDefaultAsync(a => a.Id == request.Id && a.UserId == userId);
            if (application == null)
                return null;

            // Update properties
            application.Name = request.Name;
            application.Description = request.Description;
            application.Version = request.Version;
            application.Environment = request.Environment;
            application.Tags = request.Tags;
            application.IsActive = request.IsActive;
            application.UpdatedAt = DateTime.UtcNow;

            // Explicitly mark as modified to ensure Entity Framework tracks changes
            context.Applications.Update(application);
            
            try
            {
                var changeCount = await context.SaveChangesAsync();
                
                if (changeCount == 0)
                {
                    logger.LogWarning("No changes were saved for application {ApplicationId} by user {UserId}", 
                        request.Id, userId);
                }
                else
                {
                    logger.LogInformation("Successfully updated application {ApplicationName} for user {UserId} ({ChangeCount} changes)",
                        LoggingHelper.Sanitize(request.Name), userId, changeCount);
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error saving application update for {ApplicationId} by user {UserId}", 
                    request.Id, userId);
                throw;
            }

            return MapToResponse(application);
        }

        public async Task<bool> DeleteApplicationAsync(Guid id, Guid userId)
        {
            var application = await context.Applications
                .Include(a => a.DatabaseConnections)
                .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
            if (application == null)
                return false;

            var connectionCount = application.DatabaseConnections.Count;
            context.Applications.Remove(application); // Cascade delete will handle connections
            await context.SaveChangesAsync();

            logger.LogInformation("Deleted application {ApplicationId} and {ConnectionCount} connections for user {UserId}",
                id, connectionCount, userId);

            return true;
        }

        public async Task<bool> ToggleApplicationStatusAsync(Guid id, Guid userId, bool isActive)
        {
            var application = await context.Applications
                .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
            if (application == null)
                return false;

            application.IsActive = isActive;
            application.UpdatedAt = DateTime.UtcNow;
            await context.SaveChangesAsync();

            logger.LogInformation("Toggled application {ApplicationId} status to {IsActive} for user {UserId}",
                id, isActive, userId);

            return true;
        }

        public async Task<bool> UpdateLastAccessedAsync(Guid id, Guid userId)
        {
            var application = await context.Applications
                .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
            if (application == null)
                return false;

            application.LastAccessedAt = DateTime.UtcNow;
            await context.SaveChangesAsync();

            return true;
        }

        public async Task<IEnumerable<DatabaseConnectionSummary>> GetApplicationConnectionsAsync(Guid applicationId, Guid userId)
        {
            // Verify user has access to this application
            var application = await context.Applications
                .FirstOrDefaultAsync(a => a.Id == applicationId && a.UserId == userId);
            if (application == null)
                return Enumerable.Empty<DatabaseConnectionSummary>();

            var connections = await context.DatabaseConnections
                .Where(c => c.ApplicationId == applicationId)
                .OrderBy(c => c.Name)
                .ToListAsync();

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

        public async Task<bool> ValidateApplicationAccessAsync(Guid applicationId, Guid userId)
        {
            return await context.Applications
                .AnyAsync(a => a.Id == applicationId && a.UserId == userId);
        }

        private ApplicationResponse MapToResponse(Application application)
        {
            var connections = application.DatabaseConnections ?? new List<DatabaseConnection>();

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
            var connections = application.DatabaseConnections ?? new List<DatabaseConnection>();

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
        public async Task<ApplicationWithConnectionResponse> CreateApplicationWithConnectionAsync(ApplicationWithConnectionRequest request, Guid userId)
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

            context.Applications.Add(application);
            await context.SaveChangesAsync(); // Save to get the application ID

            // Create database connection
            var connection = new DatabaseConnection
            {
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

            context.DatabaseConnections.Add(connection);
            await context.SaveChangesAsync();

            logger.LogInformation("Created application {ApplicationName} with connection {ConnectionName} for user {UserId}",
                LoggingHelper.Sanitize(application.Name), LoggingHelper.Sanitize(connection.Name), userId);

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
                    logger.LogError(ex, "Error testing connection during application creation");
                    testResult = false;
                    testMessage = $"Connection test failed: {ex.Message}";
                    connection.Status = ConnectionStatus.Failed;
                    connection.LastTestedAt = DateTime.UtcNow;
                    connection.LastTestResult = testMessage;
                }
            }

            return MapToApplicationWithConnectionResponse(application, connection, testResult, testMessage, testDuration);
        }

        public async Task<ApplicationWithConnectionResponse?> UpdateApplicationWithConnectionAsync(ApplicationWithConnectionUpdateRequest request, Guid userId)
        {
            // Find existing application and connection
            var existingApp = await context.Applications
                .FirstOrDefaultAsync(a => a.Id == request.ApplicationId && a.UserId == userId);
            var existingConnection = await context.DatabaseConnections
                .FirstOrDefaultAsync(c => c.Id == request.ConnectionId && c.UserId == userId);

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

            await context.SaveChangesAsync();
            logger.LogInformation("Updated application {ApplicationName} with connection {ConnectionName} for user {UserId}",
                LoggingHelper.Sanitize(existingApp.Name), LoggingHelper.Sanitize(existingConnection.Name), userId);

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
                    logger.LogError(ex, "Error testing connection during application update");
                    testResult = false;
                    testMessage = $"Connection test failed: {ex.Message}";
                    existingConnection.Status = ConnectionStatus.Failed;
                    existingConnection.LastTestedAt = DateTime.UtcNow;
                    existingConnection.LastTestResult = testMessage;
                }
            }

            return MapToApplicationWithConnectionResponse(existingApp, existingConnection, testResult, testMessage, testDuration);
        }

        public async Task<ApplicationWithConnectionResponse?> GetApplicationWithPrimaryConnectionAsync(Guid applicationId, Guid userId)
        {
            // Find application
            var application = await context.Applications
                .FirstOrDefaultAsync(a => a.Id == applicationId && a.UserId == userId);
            if (application == null)
                return null;

            // Get the first (primary) connection for this application
            var primaryConnection = await context.DatabaseConnections
                .FirstOrDefaultAsync(c => c.ApplicationId == applicationId);
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
                ApplicationName = connection.Application?.Name ?? "Unknown",
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