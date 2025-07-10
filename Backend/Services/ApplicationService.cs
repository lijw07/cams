using cams.Backend.Model;
using cams.Backend.View;

namespace cams.Backend.Services
{
    public class ApplicationService : IApplicationService
    {
        private readonly ILogger<ApplicationService> _logger;
        
        // In a real application, this would be replaced with a database context
        private static readonly List<Application> _applications = new();
        private static readonly List<DatabaseConnection> _connections = new();
        private static int _nextId = 1;

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
    }
}