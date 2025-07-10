using cams.Backend.Model;
using cams.Backend.View;

namespace cams.Backend.Services
{
    public interface IApplicationService
    {
        Task<IEnumerable<ApplicationSummaryResponse>> GetUserApplicationsAsync(int userId);
        Task<ApplicationResponse?> GetApplicationByIdAsync(int id, int userId);
        Task<ApplicationResponse> CreateApplicationAsync(ApplicationRequest request, int userId);
        Task<ApplicationResponse?> UpdateApplicationAsync(ApplicationUpdateRequest request, int userId);
        Task<bool> DeleteApplicationAsync(int id, int userId);
        Task<bool> ToggleApplicationStatusAsync(int id, int userId, bool isActive);
        Task<bool> UpdateLastAccessedAsync(int id, int userId);
        Task<IEnumerable<DatabaseConnectionSummary>> GetApplicationConnectionsAsync(int applicationId, int userId);
        Task<bool> ValidateApplicationAccessAsync(int applicationId, int userId);
    }
}