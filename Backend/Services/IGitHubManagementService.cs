using cams.Backend.Model;
using cams.Backend.View;

namespace cams.Backend.Services
{
    public interface IGitHubManagementService
    {
        // User Management
        Task<GitHubUserResponse> CreateGitHubUserAsync(CreateGitHubUserRequest request, Guid requestingUserId);
        Task<GitHubUserResponse> GetGitHubUserAsync(string username, Guid requestingUserId);
        Task<List<GitHubUserResponse>> GetOrganizationMembersAsync(string organization, Guid requestingUserId);
        Task<bool> InviteUserToOrganizationAsync(string organization, string usernameOrEmail, Guid requestingUserId);
        Task<bool> RemoveUserFromOrganizationAsync(string organization, string username, Guid requestingUserId);
        
        // Repository Access Management
        Task<bool> GrantRepositoryAccessAsync(GrantRepositoryAccessRequest request, Guid requestingUserId);
        Task<bool> RevokeRepositoryAccessAsync(RevokeRepositoryAccessRequest request, Guid requestingUserId);
        Task<List<RepositoryAccessResponse>> GetUserRepositoryAccessAsync(string username, string organization, Guid requestingUserId);
        Task<List<GitHubRepositoryResponse>> GetOrganizationRepositoriesAsync(string organization, Guid requestingUserId);
        
        // Team Management
        Task<GitHubTeamResponse> CreateTeamAsync(CreateGitHubTeamRequest request, Guid requestingUserId);
        Task<bool> AddUserToTeamAsync(string organization, string teamSlug, string username, Guid requestingUserId);
        Task<bool> RemoveUserFromTeamAsync(string organization, string teamSlug, string username, Guid requestingUserId);
        Task<List<GitHubTeamResponse>> GetOrganizationTeamsAsync(string organization, Guid requestingUserId);
        
        // Repository Team Permissions
        Task<bool> GrantTeamRepositoryAccessAsync(string organization, string teamSlug, string repository, string permission, Guid requestingUserId);
        Task<bool> RevokeTeamRepositoryAccessAsync(string organization, string teamSlug, string repository, Guid requestingUserId);
        
        // Audit and Monitoring
        Task<List<GitHubAuditLogEntry>> GetRepositoryAccessAuditLogAsync(string organization, string repository, Guid requestingUserId);
        Task<GitHubAccessSummary> GetUserAccessSummaryAsync(string username, string organization, Guid requestingUserId);
    }
}