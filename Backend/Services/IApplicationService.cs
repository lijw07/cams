using cams.Backend.View;

namespace cams.Backend.Services
{
    public interface IApplicationService
    {
        Task<IEnumerable<ApplicationSummaryResponse>> GetUserApplicationsAsync(int userId);
        Task<PagedResult<ApplicationSummaryResponse>> GetUserApplicationsPaginatedAsync(int userId, PaginationRequest request);
        Task<ApplicationResponse?> GetApplicationByIdAsync(int id, int userId);
        Task<ApplicationResponse> CreateApplicationAsync(ApplicationRequest request, int userId);
        Task<ApplicationResponse?> UpdateApplicationAsync(ApplicationUpdateRequest request, int userId);
        Task<bool> DeleteApplicationAsync(int id, int userId);
        Task<bool> ToggleApplicationStatusAsync(int id, int userId, bool isActive);
        Task<bool> UpdateLastAccessedAsync(int id, int userId);
        Task<IEnumerable<DatabaseConnectionSummary>> GetApplicationConnectionsAsync(int applicationId, int userId);
        Task<bool> ValidateApplicationAccessAsync(int applicationId, int userId);
        
        // Combined application and database connection operations
        Task<ApplicationWithConnectionResponse> CreateApplicationWithConnectionAsync(ApplicationWithConnectionRequest request, int userId);
        Task<ApplicationWithConnectionResponse?> UpdateApplicationWithConnectionAsync(ApplicationWithConnectionUpdateRequest request, int userId);
        Task<ApplicationWithConnectionResponse?> GetApplicationWithPrimaryConnectionAsync(int applicationId, int userId);
    }
}