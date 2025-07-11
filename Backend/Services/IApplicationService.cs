using cams.Backend.View;

namespace cams.Backend.Services
{
    public interface IApplicationService
    {
        Task<IEnumerable<ApplicationSummaryResponse>> GetUserApplicationsAsync(Guid userId);
        Task<PagedResult<ApplicationSummaryResponse>> GetUserApplicationsPaginatedAsync(Guid userId, PaginationRequest request);
        Task<ApplicationResponse?> GetApplicationByIdAsync(Guid id, Guid userId);
        Task<ApplicationResponse> CreateApplicationAsync(ApplicationRequest request, Guid userId);
        Task<ApplicationResponse?> UpdateApplicationAsync(ApplicationUpdateRequest request, Guid userId);
        Task<bool> DeleteApplicationAsync(Guid id, Guid userId);
        Task<bool> ToggleApplicationStatusAsync(Guid id, Guid userId, bool isActive);
        Task<bool> UpdateLastAccessedAsync(Guid id, Guid userId);
        Task<IEnumerable<DatabaseConnectionSummary>> GetApplicationConnectionsAsync(Guid applicationId, Guid userId);
        Task<bool> ValidateApplicationAccessAsync(Guid applicationId, Guid userId);
        
        // Combined application and database connection operations
        Task<ApplicationWithConnectionResponse> CreateApplicationWithConnectionAsync(ApplicationWithConnectionRequest request, Guid userId);
        Task<ApplicationWithConnectionResponse?> UpdateApplicationWithConnectionAsync(ApplicationWithConnectionUpdateRequest request, Guid userId);
        Task<ApplicationWithConnectionResponse?> GetApplicationWithPrimaryConnectionAsync(Guid applicationId, Guid userId);
    }
}