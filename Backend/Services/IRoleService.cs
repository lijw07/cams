using cams.Backend.View;

namespace cams.Backend.Services
{
    public interface IRoleService
    {
        Task<IEnumerable<RoleResponse>> GetAllRolesAsync();
        Task<RoleResponse?> GetRoleByIdAsync(int id);
        Task<RoleResponse?> GetRoleByNameAsync(string name);
        Task<RoleResponse> CreateRoleAsync(RoleRequest request);
        Task<RoleResponse?> UpdateRoleAsync(int id, RoleRequest request);
        Task<bool> DeleteRoleAsync(int id);
        Task<bool> AssignRoleToUserAsync(int userId, int roleId, int? assignedBy = null);
        Task<bool> RemoveRoleFromUserAsync(int userId, int roleId);
        Task<IEnumerable<UserRoleResponse>> GetUserRolesAsync(int userId);
        Task<IEnumerable<UserRoleResponse>> GetUsersWithRoleAsync(int roleId);
        Task<bool> UserHasRoleAsync(int userId, string roleName);
    }
}