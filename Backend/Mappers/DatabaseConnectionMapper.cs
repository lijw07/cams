using cams.Backend.Enums;
using cams.Backend.Model;
using cams.Backend.View;
using cams.Backend.Helpers;

namespace cams.Backend.Mappers
{
    public interface IDatabaseConnectionMapper
    {
        DatabaseConnection MapToEntity(DatabaseConnectionRequest request, int userId);
        DatabaseConnectionResponse MapToResponse(DatabaseConnection entity);
        void MapUpdateToEntity(DatabaseConnectionUpdateRequest request, DatabaseConnection entity);
        IEnumerable<DatabaseConnectionResponse> MapToResponseList(IEnumerable<DatabaseConnection> entities);
    }

    public class DatabaseConnectionMapper : IDatabaseConnectionMapper
    {
        public DatabaseConnection MapToEntity(DatabaseConnectionRequest request, int userId)
        {
            return new DatabaseConnection
            {
                Name = request.Name,
                Description = request.Description,
                Type = request.Type,
                Server = request.Server,
                Port = request.Port,
                Database = request.Database,
                Username = request.Username,
                PasswordHash = request.Password, // Note: Should be encrypted in production
                ConnectionString = request.ConnectionString,
                ApiBaseUrl = request.ApiBaseUrl,
                ApiKey = request.ApiKey,
                AdditionalSettings = request.AdditionalSettings,
                ApplicationId = request.ApplicationId,
                UserId = userId,
                IsActive = request.IsActive,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
        }

        public DatabaseConnectionResponse MapToResponse(DatabaseConnection entity)
        {
            return new DatabaseConnectionResponse
            {
                Id = entity.Id,
                Name = entity.Name,
                Description = entity.Description,
                Type = entity.Type,
                Server = entity.Server,
                Port = entity.Port,
                Database = entity.Database,
                Username = entity.Username,
                // Note: Never return password in response
                ConnectionString = MaskSensitiveInformation(entity.ConnectionString),
                ApiBaseUrl = entity.ApiBaseUrl,
                ApplicationId = entity.ApplicationId,
                IsActive = entity.IsActive,
                Status = entity.Status,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt,
                LastTestedAt = entity.LastTestedAt,
                LastTestResult = entity.LastTestResult
            };
        }

        public void MapUpdateToEntity(DatabaseConnectionUpdateRequest request, DatabaseConnection entity)
        {
            entity.Name = request.Name;
            entity.Description = request.Description;
            entity.Type = request.Type;
            entity.Server = request.Server;
            entity.Port = request.Port;
            entity.Database = request.Database;
            entity.Username = request.Username;
            
            // Only update password if provided
            if (!string.IsNullOrWhiteSpace(request.Password))
            {
                entity.PasswordHash = request.Password; // Note: Should be encrypted in production
            }
            
            entity.ConnectionString = request.ConnectionString;
            entity.ApiBaseUrl = request.ApiBaseUrl;
            entity.ApiKey = request.ApiKey;
            entity.AdditionalSettings = request.AdditionalSettings;
            entity.ApplicationId = request.ApplicationId;
            entity.IsActive = request.IsActive;
            entity.UpdatedAt = DateTime.UtcNow;
        }

        public IEnumerable<DatabaseConnectionResponse> MapToResponseList(IEnumerable<DatabaseConnection> entities)
        {
            return entities.Select(MapToResponse);
        }

        /// <summary>
        /// Masks sensitive information in connection strings
        /// </summary>
        /// <param name="connectionString">The original connection string</param>
        /// <returns>Masked connection string</returns>
        private static string? MaskSensitiveInformation(string? connectionString)
        {
            if (string.IsNullOrWhiteSpace(connectionString))
                return connectionString;

            // Simple masking - in production, you might want more sophisticated masking
            var masked = connectionString;
            
            // Mask password in connection string
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