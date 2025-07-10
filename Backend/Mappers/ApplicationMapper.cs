using cams.Backend.Model;
using cams.Backend.View;

namespace cams.Backend.Mappers
{
    public interface IApplicationMapper
    {
        Application MapToEntity(ApplicationRequest request, int userId);
        ApplicationResponse MapToResponse(Application entity);
        ApplicationSummaryResponse MapToSummaryResponse(Application entity);
        void MapUpdateToEntity(ApplicationUpdateRequest request, Application entity);
        IEnumerable<ApplicationResponse> MapToResponseList(IEnumerable<Application> entities);
        IEnumerable<ApplicationSummaryResponse> MapToSummaryResponseList(IEnumerable<Application> entities);
    }

    public class ApplicationMapper : IApplicationMapper
    {
        public Application MapToEntity(ApplicationRequest request, int userId)
        {
            return new Application
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
        }

        public ApplicationResponse MapToResponse(Application entity)
        {
            return new ApplicationResponse
            {
                Id = entity.Id,
                Name = entity.Name,
                Description = entity.Description,
                Version = entity.Version,
                Environment = entity.Environment,
                Tags = entity.Tags,
                IsActive = entity.IsActive,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt,
                LastAccessedAt = entity.LastAccessedAt,
                DatabaseConnectionCount = entity.DatabaseConnections?.Count ?? 0,
                DatabaseConnections = entity.DatabaseConnections?.Select(dc => new DatabaseConnectionSummary
                {
                    Id = dc.Id,
                    Name = dc.Name,
                    TypeName = dc.Type.ToString(),
                    IsActive = dc.IsActive,
                    StatusName = dc.Status.ToString(),
                    LastTestedAt = dc.LastTestedAt
                }).ToList()
            };
        }

        public ApplicationSummaryResponse MapToSummaryResponse(Application entity)
        {
            return new ApplicationSummaryResponse
            {
                Id = entity.Id,
                Name = entity.Name,
                Description = entity.Description,
                Version = entity.Version,
                Environment = entity.Environment,
                IsActive = entity.IsActive,
                CreatedAt = entity.CreatedAt,
                UpdatedAt = entity.UpdatedAt,
                LastAccessedAt = entity.LastAccessedAt,
                DatabaseConnectionCount = entity.DatabaseConnections?.Count ?? 0,
                ActiveConnectionCount = entity.DatabaseConnections?.Count(dc => dc.IsActive) ?? 0
            };
        }

        public void MapUpdateToEntity(ApplicationUpdateRequest request, Application entity)
        {
            entity.Name = request.Name;
            entity.Description = request.Description;
            entity.Version = request.Version;
            entity.Environment = request.Environment;
            entity.Tags = request.Tags;
            entity.IsActive = request.IsActive;
            entity.UpdatedAt = DateTime.UtcNow;
        }

        public IEnumerable<ApplicationResponse> MapToResponseList(IEnumerable<Application> entities)
        {
            return entities.Select(MapToResponse);
        }

        public IEnumerable<ApplicationSummaryResponse> MapToSummaryResponseList(IEnumerable<Application> entities)
        {
            return entities.Select(MapToSummaryResponse);
        }
    }
}