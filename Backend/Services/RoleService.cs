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

        public async Task<PaginatedResponse<RoleResponse>> GetRolesAsync(PaginationRequest request)
        {
            var query = _context.Roles.AsQueryable();

            // Apply search filter if provided
            if (!string.IsNullOrWhiteSpace(request.SearchTerm))
            {
                var searchTerm = request.SearchTerm.ToLower();
                query = query.Where(r =>
                    r.Name.ToLower().Contains(searchTerm) ||
                    (r.Description != null && r.Description.ToLower().Contains(searchTerm)));
            }

            // Get total count for pagination (before applying Skip/Take)
            var totalCount = await query.CountAsync();

            // Calculate pagination metadata
            var totalPages = (int)Math.Ceiling((double)totalCount / request.PageSize);
            var offset = (request.PageNumber - 1) * request.PageSize;

            // Apply sorting and pagination
            var sortBy = request.SortBy?.ToLower() ?? "name";
            var sortDirection = request.SortDirection?.ToLower() ?? "asc";

            query = sortBy switch
            {
                "name" => sortDirection == "desc" ? query.OrderByDescending(r => r.Name) : query.OrderBy(r => r.Name),
                "description" => sortDirection == "desc" ? query.OrderByDescending(r => r.Description) : query.OrderBy(r => r.Description),
                "createdat" or "created" => sortDirection == "desc" ? query.OrderByDescending(r => r.CreatedAt) : query.OrderBy(r => r.CreatedAt),
                "updatedat" or "updated" => sortDirection == "desc" ? query.OrderByDescending(r => r.UpdatedAt) : query.OrderBy(r => r.UpdatedAt),
                "issystem" or "system" => sortDirection == "desc" ? query.OrderByDescending(r => r.IsSystem) : query.OrderBy(r => r.IsSystem),
                "isactive" or "active" => sortDirection == "desc" ? query.OrderByDescending(r => r.IsActive) : query.OrderBy(r => r.IsActive),
                _ => query.OrderBy(r => r.Name) // Default to name ascending
            };

            var roles = await query
                .Skip(offset)
                .Take(request.PageSize)
                .Include(r => r.UserRoles)
                .ToListAsync();

            var roleResponses = roles.Select(r => MapToResponse(r)).ToList();

            return new PaginatedResponse<RoleResponse>
            {
                Data = roleResponses,
                Pagination = new PaginationMetadata
                {
                    CurrentPage = request.PageNumber,
                    PerPage = request.PageSize,
                    TotalItems = totalCount,
                    TotalPages = totalPages,
                    HasNext = request.PageNumber < totalPages,
                    HasPrevious = request.PageNumber > 1
                }
            };
        }

        public async Task<IEnumerable<RoleResponse>> GetAllRolesAsync()
        {
            var roles = await _context.Roles
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
            var role = await _context.Roles
                .Include(r => r.UserRoles)
                .FirstOrDefaultAsync(r => r.Id == id);
                
            if (role == null)
            {
                return false;
            }

            // System roles can never be deleted
            if (role.IsSystem)
            {
                throw new InvalidOperationException($"Cannot delete system role '{role.Name}'. System roles are protected and cannot be removed.");
            }

            // Check if role has any active users
            var activeUserRoles = role.UserRoles.Where(ur => ur.IsActive).ToList();
            if (activeUserRoles.Any())
            {
                throw new InvalidOperationException($"Cannot delete role '{role.Name}' because it has {activeUserRoles.Count} active user assignment(s). Please remove all users from this role first.");
            }

            // Hard delete - remove from database
            // Also manually remove any inactive UserRole records to clean up soft-deleted associations
            var inactiveUserRoles = role.UserRoles.Where(ur => !ur.IsActive).ToList();
            if (inactiveUserRoles.Any())
            {
                _context.UserRoles.RemoveRange(inactiveUserRoles);
            }
            
            // The cascade delete will automatically remove any remaining active UserRole records
            _context.Roles.Remove(role);

            await _context.SaveChangesAsync();

            _logger.LogInformation("Permanently deleted role: {RoleName} (cleaned up {InactiveCount} inactive user assignments)", 
                role.Name, inactiveUserRoles.Count);

            return true;
        }

        public async Task<bool> ToggleRoleStatusAsync(int id)
        {
            var role = await _context.Roles.FindAsync(id);
            if (role == null)
            {
                return false;
            }

            // Toggle the active status
            role.IsActive = !role.IsActive;
            role.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Toggled role status: {RoleName} is now {Status}", 
                role.Name, role.IsActive ? "active" : "inactive");

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

            // Hard delete - completely remove the UserRole record from database
            _context.UserRoles.Remove(userRole);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Permanently removed role {RoleId} from user {UserId}", roleId, userId);

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
            _logger.LogInformation("RoleService.UserHasRoleAsync: Checking if user {UserId} has role '{RoleName}'", userId, roleName);
            
            var userRoles = await _context.UserRoles
                .Include(ur => ur.Role)
                .Where(ur => ur.UserId == userId)
                .ToListAsync();
                
            _logger.LogInformation("RoleService.UserHasRoleAsync: User {UserId} has {RoleCount} role assignments", userId, userRoles.Count);
            
            foreach (var ur in userRoles)
            {
                _logger.LogInformation("RoleService.UserHasRoleAsync: User {UserId} role assignment - Role: '{RoleName}', IsActive: {IsActive}, RoleIsActive: {RoleIsActive}",
                    userId, ur.Role?.Name ?? "NULL", ur.IsActive, ur.Role?.IsActive ?? false);
            }
            
            var hasRole = await _context.UserRoles
                .Include(ur => ur.Role)
                .AnyAsync(ur => ur.UserId == userId && 
                              ur.Role.Name == roleName && 
                              ur.IsActive && 
                              ur.Role.IsActive);
                              
            _logger.LogInformation("RoleService.UserHasRoleAsync: Final result for user {UserId} and role '{RoleName}': {HasRole}", userId, roleName, hasRole);
            
            return hasRole;
        }

        private RoleResponse MapToResponse(Role role)
        {
            // Get user count for this role
            var userCount = _context.UserRoles
                .Count(ur => ur.RoleId == role.Id && ur.IsActive);

            return new RoleResponse
            {
                Id = role.Id,
                Name = role.Name,
                Description = role.Description,
                IsActive = role.IsActive,
                IsSystem = role.IsSystem,
                UserCount = userCount,
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

        public async Task<bool> CheckRoleNameAvailabilityAsync(string name, int? excludeId = null)
        {
            var query = _context.Roles.Where(r => r.Name == name);
            
            if (excludeId.HasValue)
            {
                query = query.Where(r => r.Id != excludeId.Value);
            }

            return !await query.AnyAsync();
        }

        public async Task<IEnumerable<RoleResponse>> GetSystemRolesAsync()
        {
            var roles = await _context.Roles
                .Where(r => r.IsSystem && r.IsActive)
                .OrderBy(r => r.Name)
                .ToListAsync();

            return roles.Select(MapToResponse);
        }

        public async Task<BulkDeleteRoleResult> BulkDeleteRolesAsync(List<int> roleIds, int deletedBy)
        {
            var result = new BulkDeleteRoleResult
            {
                TotalRequested = roleIds.Count
            };

            foreach (var roleId in roleIds)
            {
                try
                {
                    var role = await _context.Roles.FindAsync(roleId);
                    if (role == null)
                    {
                        result.Failed.Add(new BulkDeleteRoleError
                        {
                            Id = roleId,
                            Error = "Role not found"
                        });
                        continue;
                    }

                    if (role.IsSystem)
                    {
                        result.Failed.Add(new BulkDeleteRoleError
                        {
                            Id = roleId,
                            Error = "Cannot delete system role"
                        });
                        continue;
                    }

                    // Check if role has users assigned
                    var hasUsers = await _context.UserRoles
                        .AnyAsync(ur => ur.RoleId == roleId && ur.IsActive);

                    if (hasUsers)
                    {
                        result.Failed.Add(new BulkDeleteRoleError
                        {
                            Id = roleId,
                            Error = "Cannot delete role with active users"
                        });
                        continue;
                    }

                    // Hard delete - remove from database
                    _context.Roles.Remove(role);
                    
                    // Also remove any inactive user-role assignments
                    var userRoleAssignments = await _context.UserRoles
                        .Where(ur => ur.RoleId == roleId)
                        .ToListAsync();
                    
                    _context.UserRoles.RemoveRange(userRoleAssignments);
                    
                    result.Successful.Add(roleId);

                    _logger.LogInformation("Role {RoleId} deleted by user {UserId}", roleId, deletedBy);
                }
                catch (Exception ex)
                {
                    result.Failed.Add(new BulkDeleteRoleError
                    {
                        Id = roleId,
                        Error = ex.Message
                    });
                    _logger.LogError(ex, "Error deleting role {RoleId}", roleId);
                }
            }

            await _context.SaveChangesAsync();

            result.SuccessfulCount = result.Successful.Count;
            result.FailedCount = result.Failed.Count;
            result.Message = $"Successfully deleted {result.SuccessfulCount} roles, {result.FailedCount} failed";

            return result;
        }

        public async Task<RoleStatsResponse> GetRoleStatsAsync(int roleId)
        {
            var role = await _context.Roles.FindAsync(roleId);
            if (role == null)
                throw new ArgumentException("Role not found");

            var totalUsers = await _context.UserRoles
                .CountAsync(ur => ur.RoleId == roleId && ur.IsActive);

            var activeUsers = await _context.UserRoles
                .Include(ur => ur.User)
                .CountAsync(ur => ur.RoleId == roleId && ur.IsActive && ur.User.IsActive);

            var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
            var recentAssignments = await _context.UserRoles
                .CountAsync(ur => ur.RoleId == roleId && ur.AssignedAt >= thirtyDaysAgo);

            var lastAssigned = await _context.UserRoles
                .Where(ur => ur.RoleId == roleId)
                .OrderByDescending(ur => ur.AssignedAt)
                .Select(ur => (DateTime?)ur.AssignedAt)
                .FirstOrDefaultAsync();

            // Get assignment history for the last 30 days
            var assignmentHistory = await _context.UserRoles
                .Where(ur => ur.RoleId == roleId && ur.AssignedAt >= thirtyDaysAgo)
                .GroupBy(ur => ur.AssignedAt.Date)
                .Select(g => new UserRoleAssignmentStat
                {
                    AssignedDate = g.Key,
                    AssignedCount = g.Count(),
                    RemovedCount = 0 // TODO: Track removals separately if needed
                })
                .OrderBy(h => h.AssignedDate)
                .ToListAsync();

            return new RoleStatsResponse
            {
                Id = roleId,
                Name = role.Name,
                TotalUsers = totalUsers,
                ActiveUsers = activeUsers,
                RecentAssignments = recentAssignments,
                LastAssigned = lastAssigned,
                RecentAssignmentHistory = assignmentHistory,
                TopPermissions = new List<string>() // TODO: Implement permissions system
            };
        }

        public async Task<RoleHierarchyResponse> GetRoleHierarchyAsync()
        {
            // Simple flat structure for now - hierarchy can be implemented later if needed
            var roles = await _context.Roles
                .Where(r => r.IsActive)
                .OrderBy(r => r.Name)
                .ToListAsync();

            var hierarchyNodes = roles.Select(role => new RoleHierarchyNode
            {
                Id = role.Id,
                Name = role.Name,
                Description = role.Description,
                IsSystem = role.IsSystem,
                IsActive = role.IsActive,
                UserCount = _context.UserRoles.Count(ur => ur.RoleId == role.Id && ur.IsActive),
                ParentRoleId = null, // Flat structure for now
                Level = 0,
                Children = new List<RoleHierarchyNode>()
            }).ToList();

            return new RoleHierarchyResponse
            {
                Roles = hierarchyNodes,
                TotalRoles = roles.Count,
                MaxDepth = 1 // Flat structure
            };
        }

        public async Task<IEnumerable<UserRoleInfo>> GetRoleUsersAsync(int roleId)
        {
            var userRoles = await _context.UserRoles
                .Include(ur => ur.User)
                .Include(ur => ur.AssignedByUser)
                .Where(ur => ur.RoleId == roleId && ur.IsActive)
                .OrderBy(ur => ur.User.Username)
                .ToListAsync();

            return userRoles.Select(ur => new UserRoleInfo
            {
                UserId = ur.UserId,
                Username = ur.User.Username,
                FirstName = ur.User.FirstName ?? string.Empty,
                LastName = ur.User.LastName ?? string.Empty,
                Email = ur.User.Email,
                IsActive = ur.User.IsActive,
                AssignedAt = ur.AssignedAt,
                AssignedBy = ur.AssignedBy,
                AssignedByName = ur.AssignedByUser != null ? 
                    $"{ur.AssignedByUser.FirstName} {ur.AssignedByUser.LastName}".Trim() : null
            });
        }

        public async Task<bool> AssignUsersToRoleAsync(int roleId, List<int> userIds, int assignedBy)
        {
            var role = await _context.Roles.FindAsync(roleId);
            if (role == null || !role.IsActive)
                return false;

            var successCount = 0;
            foreach (var userId in userIds)
            {
                try
                {
                    var success = await AssignRoleToUserAsync(userId, roleId, assignedBy);
                    if (success) successCount++;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error assigning role {RoleId} to user {UserId}", roleId, userId);
                }
            }

            _logger.LogInformation("Assigned role {RoleId} to {SuccessCount}/{TotalCount} users", 
                roleId, successCount, userIds.Count);

            return successCount > 0;
        }

        public async Task<bool> RemoveUsersFromRoleAsync(int roleId, List<int> userIds)
        {
            var successCount = 0;
            foreach (var userId in userIds)
            {
                try
                {
                    var success = await RemoveRoleFromUserAsync(userId, roleId);
                    if (success) successCount++;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error removing role {RoleId} from user {UserId}", roleId, userId);
                }
            }

            _logger.LogInformation("Removed role {RoleId} from {SuccessCount}/{TotalCount} users", 
                roleId, successCount, userIds.Count);

            return successCount > 0;
        }
    }
}