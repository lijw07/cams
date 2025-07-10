using cams.Backend.Attributes;
using cams.Backend.Constants;
using cams.Backend.Data;
using cams.Backend.Helpers;
using cams.Backend.Services;
using cams.Backend.View;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace cams.Backend.Controller
{
    [ApiController]
    [Route("management/users")]
    [Authorize]
    public class UsersController(
        ApplicationDbContext context,
        IRoleService roleService,
        ILoggingService loggingService,
        ILogger<UsersController> logger)
        : ControllerBase
    {
        [HttpGet]
        [RequireRole(RoleConstants.PLATFORM_ADMIN, RoleConstants.ADMIN)]
        public async Task<IActionResult> GetUsers([FromQuery] PaginationRequest request)
        {
            try
            {
                var currentUserId = UserHelper.GetCurrentUserId(User);
                
                // Check user's role to determine what users they can see
                var isPlatformAdmin = await roleService.UserHasRoleAsync(currentUserId, RoleConstants.PLATFORM_ADMIN);
                var isAdmin = await roleService.UserHasRoleAsync(currentUserId, RoleConstants.ADMIN);

                if (!isPlatformAdmin && !isAdmin)
                {
                    return Forbid("You don't have permission to view users");
                }

                var query = context.Users
                    .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                    .Where(u => u.IsActive)
                    .AsQueryable();

                // Platform_Admins can see all users
                // Admins can only see users with "User" role
                if (!isPlatformAdmin && isAdmin)
                {
                    query = query.Where(u => u.UserRoles.Any(ur => 
                        ur.Role.Name == RoleConstants.USER && ur.IsActive));
                }

                // Apply search filter if provided
                if (!string.IsNullOrWhiteSpace(request.SearchTerm))
                {
                    var searchTerm = request.SearchTerm.ToLower();
                    query = query.Where(u => 
                        u.Username.ToLower().Contains(searchTerm) ||
                        u.Email.ToLower().Contains(searchTerm) ||
                        (u.FirstName != null && u.FirstName.ToLower().Contains(searchTerm)) ||
                        (u.LastName != null && u.LastName.ToLower().Contains(searchTerm)));
                }

                // Get total count for pagination
                var totalCount = await query.CountAsync();

                // Apply pagination
                var users = await query
                    .OrderBy(u => u.Username)
                    .Skip((request.PageNumber - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .Select(u => new UserWithRolesResponse
                    {
                        Id = u.Id,
                        Username = u.Username,
                        Email = u.Email,
                        FirstName = u.FirstName,
                        LastName = u.LastName,
                        PhoneNumber = u.PhoneNumber,
                        IsActive = u.IsActive,
                        CreatedAt = u.CreatedAt,
                        UpdatedAt = u.UpdatedAt,
                        LastLoginAt = u.LastLoginAt,
                        Roles = u.UserRoles
                            .Where(ur => ur.IsActive)
                            .Select(ur => new RoleResponse
                            {
                                Id = ur.Role.Id,
                                Name = ur.Role.Name,
                                Description = ur.Role.Description,
                                IsActive = ur.Role.IsActive,
                                CreatedAt = ur.Role.CreatedAt,
                                UpdatedAt = ur.Role.UpdatedAt
                            }).ToList()
                    })
                    .ToListAsync();

                var result = new PagedResult<UserWithRolesResponse>
                {
                    Items = users,
                    TotalCount = totalCount,
                    PageNumber = request.PageNumber,
                    PageSize = request.PageSize
                };

                await loggingService.LogAuditAsync(
                    currentUserId,
                    "View",
                    "User",
                    description: $"Retrieved users list - Page: {request.PageNumber}, Size: {request.PageSize}, Total: {totalCount}, Role: {(isPlatformAdmin ? "Platform_Admin" : "Admin")}"
                );

                logger.LogInformation("User {UserId} ({Role}) retrieved {UserCount} users (Page: {PageNumber}, Size: {PageSize})",
                    currentUserId, isPlatformAdmin ? "Platform_Admin" : "Admin", users.Count, request.PageNumber, request.PageSize);

                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving users");
                return HttpResponseHelper.CreateErrorResponse("An error occurred while retrieving users");
            }
        }

        [HttpGet("{id}")]
        [RequireRole(RoleConstants.PLATFORM_ADMIN, RoleConstants.ADMIN)]
        public async Task<IActionResult> GetUserById(int id)
        {
            try
            {
                var currentUserId = UserHelper.GetCurrentUserId(User);
                
                // Check user's role to determine what users they can see
                var isPlatformAdmin = await roleService.UserHasRoleAsync(currentUserId, RoleConstants.PLATFORM_ADMIN);
                var isAdmin = await roleService.UserHasRoleAsync(currentUserId, RoleConstants.ADMIN);

                if (!isPlatformAdmin && !isAdmin)
                {
                    return Forbid("You don't have permission to view users");
                }

                var query = context.Users
                    .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                    .Where(u => u.Id == id && u.IsActive);

                // Platform_Admins can see all users
                // Admins can only see users with "User" role
                if (!isPlatformAdmin && isAdmin)
                {
                    query = query.Where(u => u.UserRoles.Any(ur => 
                        ur.Role.Name == RoleConstants.USER && ur.IsActive));
                }

                var user = await query
                    .Select(u => new UserWithRolesResponse
                    {
                        Id = u.Id,
                        Username = u.Username,
                        Email = u.Email,
                        FirstName = u.FirstName,
                        LastName = u.LastName,
                        PhoneNumber = u.PhoneNumber,
                        IsActive = u.IsActive,
                        CreatedAt = u.CreatedAt,
                        UpdatedAt = u.UpdatedAt,
                        LastLoginAt = u.LastLoginAt,
                        Roles = u.UserRoles
                            .Where(ur => ur.IsActive)
                            .Select(ur => new RoleResponse
                            {
                                Id = ur.Role.Id,
                                Name = ur.Role.Name,
                                Description = ur.Role.Description,
                                IsActive = ur.Role.IsActive,
                                CreatedAt = ur.Role.CreatedAt,
                                UpdatedAt = ur.Role.UpdatedAt
                            }).ToList()
                    })
                    .FirstOrDefaultAsync();

                if (user == null)
                {
                    return NotFound($"User with ID {id} not found or you don't have permission to view this user");
                }

                await loggingService.LogAuditAsync(
                    currentUserId,
                    "View",
                    "User",
                    entityId: id,
                    entityName: user.Username,
                    description: $"Retrieved user details: {user.Username}"
                );

                logger.LogInformation("User {UserId} retrieved details for user {TargetUserId} ({TargetUsername})",
                    currentUserId, id, user.Username);

                return Ok(user);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving user {UserId}", id);
                return HttpResponseHelper.CreateErrorResponse("An error occurred while retrieving the user");
            }
        }
    }
}