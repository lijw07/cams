using cams.Backend.View;

namespace cams.Backend.Services
{
    public interface IRoleService
    {
        Task<PaginatedResponse<RoleResponse>> GetRolesAsync(PaginationRequest request);
        Task<IEnumerable<RoleResponse>> GetAllRolesAsync();
        Task<RoleResponse?> GetRoleByIdAsync(Guid id);
        Task<RoleResponse?> GetRoleByNameAsync(string name);
        Task<RoleResponse> CreateRoleAsync(RoleRequest request);
        Task<RoleResponse?> UpdateRoleAsync(Guid id, RoleRequest request);
        Task<bool> DeleteRoleAsync(Guid id);
        Task<bool> ToggleRoleStatusAsync(Guid id);
        Task<bool> AssignRoleToUserAsync(Guid userId, Guid roleId, Guid? assignedBy = null);
        Task<bool> RemoveRoleFromUserAsync(Guid userId, Guid roleId);
        Task<IEnumerable<UserRoleResponse>> GetUserRolesAsync(Guid userId);
        Task<IEnumerable<UserRoleResponse>> GetUsersWithRoleAsync(Guid roleId);
        Task<bool> UserHasRoleAsync(Guid userId, string roleName);

        // Advanced role management methods
        Task<bool> CheckRoleNameAvailabilityAsync(string name, Guid? excludeId = null);
        Task<IEnumerable<RoleResponse>> GetSystemRolesAsync();
        Task<BulkDeleteRoleResult> BulkDeleteRolesAsync(List<Guid> roleIds, Guid deletedBy);
        Task<RoleStatsResponse> GetRoleStatsAsync(Guid roleId);
        Task<RoleHierarchyResponse> GetRoleHierarchyAsync();
        Task<IEnumerable<UserRoleInfo>> GetRoleUsersAsync(Guid roleId);
        Task<bool> AssignUsersToRoleAsync(Guid roleId, List<Guid> userIds, Guid assignedBy);
        Task<bool> RemoveUsersFromRoleAsync(Guid roleId, List<Guid> userIds);
    }
}