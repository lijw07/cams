using cams.Backend.View;

namespace cams.Backend.Services
{
    public interface IRoleService
    {
        Task<PaginatedResponse<RoleResponse>> GetRolesAsync(PaginationRequest request);
        Task<IEnumerable<RoleResponse>> GetAllRolesAsync();
        Task<RoleResponse?> GetRoleByIdAsync(int id);
        Task<RoleResponse?> GetRoleByNameAsync(string name);
        Task<RoleResponse> CreateRoleAsync(RoleRequest request);
        Task<RoleResponse?> UpdateRoleAsync(int id, RoleRequest request);
        Task<bool> DeleteRoleAsync(int id);
        Task<bool> ToggleRoleStatusAsync(int id);
        Task<bool> AssignRoleToUserAsync(int userId, int roleId, int? assignedBy = null);
        Task<bool> RemoveRoleFromUserAsync(int userId, int roleId);
        Task<IEnumerable<UserRoleResponse>> GetUserRolesAsync(int userId);
        Task<IEnumerable<UserRoleResponse>> GetUsersWithRoleAsync(int roleId);
        Task<bool> UserHasRoleAsync(int userId, string roleName);
        
        // Advanced role management methods
        Task<bool> CheckRoleNameAvailabilityAsync(string name, int? excludeId = null);
        Task<IEnumerable<RoleResponse>> GetSystemRolesAsync();
        Task<BulkDeleteRoleResult> BulkDeleteRolesAsync(List<int> roleIds, int deletedBy);
        Task<RoleStatsResponse> GetRoleStatsAsync(int roleId);
        Task<RoleHierarchyResponse> GetRoleHierarchyAsync();
        Task<IEnumerable<UserRoleInfo>> GetRoleUsersAsync(int roleId);
        Task<bool> AssignUsersToRoleAsync(int roleId, List<int> userIds, int assignedBy);
        Task<bool> RemoveUsersFromRoleAsync(int roleId, List<int> userIds);
    }
}