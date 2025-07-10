using cams.Backend.Data;
using cams.Backend.Model;
using cams.Backend.View;
using Microsoft.EntityFrameworkCore;

namespace cams.Backend.Services
{
    public class RoleService : IRoleService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<RoleService> _logger;

        public RoleService(ApplicationDbContext context, ILogger<RoleService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<IEnumerable<RoleResponse>> GetAllRolesAsync()
        {
            var roles = await _context.Roles
                .Where(r => r.IsActive)
                .OrderBy(r => r.Name)
                .ToListAsync();

            return roles.Select(MapToResponse);
        }

        public async Task<RoleResponse?> GetRoleByIdAsync(int id)
        {
            var role = await _context.Roles
                .FirstOrDefaultAsync(r => r.Id == id && r.IsActive);

            return role != null ? MapToResponse(role) : null;
        }

        public async Task<RoleResponse?> GetRoleByNameAsync(string name)
        {
            var role = await _context.Roles
                .FirstOrDefaultAsync(r => r.Name == name && r.IsActive);

            return role != null ? MapToResponse(role) : null;
        }

        public async Task<RoleResponse> CreateRoleAsync(RoleRequest request)
        {
            // Check if role with same name already exists
            var existingRole = await _context.Roles
                .FirstOrDefaultAsync(r => r.Name == request.Name);

            if (existingRole != null)
            {
                throw new InvalidOperationException($"Role with name '{request.Name}' already exists");
            }

            var role = new Role
            {
                Name = request.Name,
                Description = request.Description,
                IsActive = request.IsActive,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Roles.Add(role);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created new role: {RoleName}", request.Name);

            return MapToResponse(role);
        }

        public async Task<RoleResponse?> UpdateRoleAsync(int id, RoleRequest request)
        {
            var role = await _context.Roles.FindAsync(id);
            if (role == null)
            {
                return null;
            }

            // Check if another role with same name exists
            var existingRole = await _context.Roles
                .FirstOrDefaultAsync(r => r.Name == request.Name && r.Id != id);

            if (existingRole != null)
            {
                throw new InvalidOperationException($"Role with name '{request.Name}' already exists");
            }

            role.Name = request.Name;
            role.Description = request.Description;
            role.IsActive = request.IsActive;
            role.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated role: {RoleName}", request.Name);

            return MapToResponse(role);
        }

        public async Task<bool> DeleteRoleAsync(int id)
        {
            var role = await _context.Roles.FindAsync(id);
            if (role == null)
            {
                return false;
            }

            // Soft delete - mark as inactive
            role.IsActive = false;
            role.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted role: {RoleName}", role.Name);

            return true;
        }

        public async Task<bool> AssignRoleToUserAsync(int userId, int roleId, int? assignedBy = null)
        {
            // Check if user exists
            var userExists = await _context.Users.AnyAsync(u => u.Id == userId);
            if (!userExists)
            {
                throw new InvalidOperationException($"User with ID {userId} not found");
            }

            // Check if role exists
            var roleExists = await _context.Roles.AnyAsync(r => r.Id == roleId && r.IsActive);
            if (!roleExists)
            {
                throw new InvalidOperationException($"Role with ID {roleId} not found");
            }

            // Check if user already has this role
            var existingUserRole = await _context.UserRoles
                .FirstOrDefaultAsync(ur => ur.UserId == userId && ur.RoleId == roleId);

            if (existingUserRole != null)
            {
                if (existingUserRole.IsActive)
                {
                    return false; // User already has this role
                }
                else
                {
                    // Reactivate the role assignment
                    existingUserRole.IsActive = true;
                    existingUserRole.AssignedAt = DateTime.UtcNow;
                    existingUserRole.AssignedBy = assignedBy;
                }
            }
            else
            {
                // Create new role assignment
                var userRole = new UserRole
                {
                    UserId = userId,
                    RoleId = roleId,
                    AssignedAt = DateTime.UtcNow,
                    AssignedBy = assignedBy,
                    IsActive = true
                };

                _context.UserRoles.Add(userRole);
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Assigned role {RoleId} to user {UserId}", roleId, userId);

            return true;
        }

        public async Task<bool> RemoveRoleFromUserAsync(int userId, int roleId)
        {
            var userRole = await _context.UserRoles
                .FirstOrDefaultAsync(ur => ur.UserId == userId && ur.RoleId == roleId);

            if (userRole == null)
            {
                return false;
            }

            // Soft delete - mark as inactive
            userRole.IsActive = false;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Removed role {RoleId} from user {UserId}", roleId, userId);

            return true;
        }

        public async Task<IEnumerable<UserRoleResponse>> GetUserRolesAsync(int userId)
        {
            var userRoles = await _context.UserRoles
                .Include(ur => ur.Role)
                .Include(ur => ur.User)
                .Include(ur => ur.AssignedByUser)
                .Where(ur => ur.UserId == userId && ur.IsActive)
                .OrderBy(ur => ur.Role.Name)
                .ToListAsync();

            return userRoles.Select(MapToUserRoleResponse);
        }

        public async Task<IEnumerable<UserRoleResponse>> GetUsersWithRoleAsync(int roleId)
        {
            var userRoles = await _context.UserRoles
                .Include(ur => ur.Role)
                .Include(ur => ur.User)
                .Include(ur => ur.AssignedByUser)
                .Where(ur => ur.RoleId == roleId && ur.IsActive)
                .OrderBy(ur => ur.User.Username)
                .ToListAsync();

            return userRoles.Select(MapToUserRoleResponse);
        }

        public async Task<bool> UserHasRoleAsync(int userId, string roleName)
        {
            return await _context.UserRoles
                .Include(ur => ur.Role)
                .AnyAsync(ur => ur.UserId == userId && 
                              ur.Role.Name == roleName && 
                              ur.IsActive && 
                              ur.Role.IsActive);
        }

        private static RoleResponse MapToResponse(Role role)
        {
            return new RoleResponse
            {
                Id = role.Id,
                Name = role.Name,
                Description = role.Description,
                IsActive = role.IsActive,
                CreatedAt = role.CreatedAt,
                UpdatedAt = role.UpdatedAt
            };
        }

        private static UserRoleResponse MapToUserRoleResponse(UserRole userRole)
        {
            return new UserRoleResponse
            {
                Id = userRole.Id,
                UserId = userRole.UserId,
                Username = userRole.User.Username,
                RoleId = userRole.RoleId,
                RoleName = userRole.Role.Name,
                AssignedAt = userRole.AssignedAt,
                AssignedBy = userRole.AssignedBy,
                AssignedByUsername = userRole.AssignedByUser?.Username,
                IsActive = userRole.IsActive
            };
        }
    }
}