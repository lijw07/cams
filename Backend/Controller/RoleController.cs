using cams.Backend.Attributes;
using cams.Backend.Constants;
using cams.Backend.Helpers;
using Backend.Helpers;
using cams.Backend.Services;
using cams.Backend.View;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace cams.Backend.Controller
{
    [ApiController]
    [Route("management/roles")]
    [Authorize]
    public class RoleController(
        IRoleService roleService,
        ILoggingService loggingService,
        ILogger<RoleController> logger)
        : ControllerBase
    {
        [HttpGet]
        [RequireRole(RoleConstants.PLATFORM_ADMIN)]
        public async Task<IActionResult> GetRoles([FromQuery] PaginationRequest request)
        {
            try
            {
                var currentUserId = UserHelper.GetCurrentUserId(User);
                var result = await roleService.GetRolesAsync(request);

                await loggingService.LogAuditAsync(
                    currentUserId,
                    "View",
                    "Role",
                    description: $"Retrieved roles list - Page: {request.PageNumber}, Size: {request.PageSize}, Total: {result.Pagination.TotalItems}"
                );

                logger.LogInformation("User {UserId} retrieved {RoleCount} roles (Page: {PageNumber}, Size: {PageSize})",
                    currentUserId, result.Data.Count(), request.PageNumber, request.PageSize);

                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving roles");
                return HttpResponseHelper.CreateErrorResponse("An error occurred while retrieving roles");
            }
        }

        [HttpGet("all")]
        [RequireRole(RoleConstants.PLATFORM_ADMIN)]
        public async Task<IActionResult> GetAllRoles()
        {
            try
            {
                var currentUserId = UserHelper.GetCurrentUserId(User);
                var roles = await roleService.GetAllRolesAsync();

                await loggingService.LogAuditAsync(
                    currentUserId,
                    "View",
                    "Role",
                    description: $"Retrieved all roles - {roles.Count()} roles found"
                );

                logger.LogInformation("User {UserId} retrieved {RoleCount} roles",
                    currentUserId, roles.Count());

                return Ok(roles);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving roles");
                return HttpResponseHelper.CreateErrorResponse("An error occurred while retrieving roles");
            }
        }

        [HttpGet("{id}")]
        [RequireRole(RoleConstants.PLATFORM_ADMIN)]
        public async Task<IActionResult> GetRoleById(Guid id)
        {
            try
            {
                var currentUserId = UserHelper.GetCurrentUserId(User);
                var role = await roleService.GetRoleByIdAsync(id);

                if (role == null)
                {
                    return NotFound($"Role with ID {id} not found");
                }

                await loggingService.LogAuditAsync(
                    currentUserId,
                    "View",
                    "Role",
                    entityId: id,
                    entityName: role.Name,
                    description: $"Retrieved role {role.Name}"
                );

                logger.LogInformation("User {UserId} retrieved role {RoleId} ({RoleName})",
                    currentUserId, id, LoggingHelper.Sanitize(role.Name));

                return Ok(role);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving role {RoleId}", id);
                return HttpResponseHelper.CreateErrorResponse("An error occurred while retrieving the role");
            }
        }

        [HttpPost]
        [RequireRole(RoleConstants.PLATFORM_ADMIN)]
        public async Task<IActionResult> CreateRole([FromBody] RoleRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var currentUserId = UserHelper.GetCurrentUserId(User);
                var role = await roleService.CreateRoleAsync(request);

                await loggingService.LogAuditAsync(
                    currentUserId,
                    "Create",
                    "Role",
                    entityId: role.Id,
                    entityName: role.Name,
                    description: $"Created new role: {LoggingHelper.Sanitize(role.Name)}",
                    newValues: $"Name: {LoggingHelper.Sanitize(role.Name)}, Description: {LoggingHelper.Sanitize(role.Description)}"
                );

                // Log system event for role creation
                await loggingService.LogSystemEventAsync(
                    "RoleCreated",
                    "Information",
                    "Authorization",
                    $"New role created: {LoggingHelper.Sanitize(role.Name)}",
                    details: $"RoleId: {role.Id}, RoleName: {LoggingHelper.Sanitize(role.Name)}, Description: {LoggingHelper.Sanitize(role.Description)}, CreatedBy: {currentUserId}",
                    userId: currentUserId,
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    httpMethod: HttpContext.Request.Method,
                    requestPath: HttpContext.Request.Path,
                    statusCode: 201
                );

                logger.LogInformation("User {UserId} created role {RoleId} ({RoleName})",
                    currentUserId, role.Id, LoggingHelper.Sanitize(role.Name));

                return CreatedAtAction(
                    nameof(GetRoleById),
                    new { id = role.Id },
                    role);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error creating role");
                return HttpResponseHelper.CreateErrorResponse("An error occurred while creating the role");
            }
        }

        [HttpPut("{id}")]
        [RequireRole(RoleConstants.PLATFORM_ADMIN)]
        public async Task<IActionResult> UpdateRole(Guid id, [FromBody] RoleRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var currentUserId = UserHelper.GetCurrentUserId(User);
                var role = await roleService.UpdateRoleAsync(id, request);

                if (role == null)
                {
                    return NotFound($"Role with ID {id} not found");
                }

                await loggingService.LogAuditAsync(
                    currentUserId,
                    "Update",
                    "Role",
                    entityId: id,
                    entityName: role.Name,
                    description: $"Updated role: {LoggingHelper.Sanitize(role.Name)}",
                    newValues: $"Name: {LoggingHelper.Sanitize(role.Name)}, Description: {LoggingHelper.Sanitize(role.Description)}"
                );

                logger.LogInformation("User {UserId} updated role {RoleId} ({RoleName})",
                    currentUserId, id, LoggingHelper.Sanitize(role.Name));

                return Ok(role);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error updating role {RoleId}", id);
                return HttpResponseHelper.CreateErrorResponse("An error occurred while updating the role");
            }
        }

        [HttpPatch("{id}/toggle-status")]
        [RequireRole(RoleConstants.PLATFORM_ADMIN)]
        public async Task<IActionResult> ToggleRoleStatus(Guid id)
        {
            try
            {
                var currentUserId = UserHelper.GetCurrentUserId(User);
                var success = await roleService.ToggleRoleStatusAsync(id);

                if (!success)
                {
                    return NotFound($"Role with ID {id} not found");
                }

                await loggingService.LogAuditAsync(
                    currentUserId,
                    "ToggleStatus",
                    "Role",
                    entityId: id,
                    description: $"Toggled status for role with ID {id}"
                );

                logger.LogInformation("User {UserId} toggled status for role {RoleId}",
                    currentUserId, id);

                return Ok(new { message = "Role status toggled successfully" });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error toggling role status {RoleId}", id);
                return HttpResponseHelper.CreateErrorResponse("An error occurred while toggling the role status");
            }
        }

        [HttpDelete("{id}")]
        [RequireRole(RoleConstants.PLATFORM_ADMIN)]
        public async Task<IActionResult> DeleteRole(Guid id)
        {
            try
            {
                var currentUserId = UserHelper.GetCurrentUserId(User);
                var success = await roleService.DeleteRoleAsync(id);

                if (!success)
                {
                    return NotFound($"Role with ID {id} not found");
                }

                await loggingService.LogAuditAsync(
                    currentUserId,
                    "Delete",
                    "Role",
                    entityId: id,
                    description: $"Permanently deleted role with ID {id}"
                );

                // Log system event for role deletion
                await loggingService.LogSystemEventAsync(
                    "RoleDeleted",
                    "Information",
                    "Authorization",
                    $"Role permanently deleted",
                    details: $"RoleId: {id}, DeletedBy: {currentUserId}",
                    userId: currentUserId,
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    httpMethod: HttpContext.Request.Method,
                    requestPath: HttpContext.Request.Path,
                    statusCode: 200
                );

                logger.LogInformation("User {UserId} permanently deleted role {RoleId}",
                    currentUserId, id);

                return Ok(new { message = "Role permanently deleted successfully" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error deleting role {RoleId}", id);
                return HttpResponseHelper.CreateErrorResponse("An error occurred while deleting the role");
            }
        }

        [HttpPost("{roleId}/assign/{userId}")]
        [RequireRole(RoleConstants.PLATFORM_ADMIN)]
        public async Task<IActionResult> AssignRoleToUser(Guid roleId, Guid userId)
        {
            try
            {
                var currentUserId = UserHelper.GetCurrentUserId(User);
                var success = await roleService.AssignRoleToUserAsync(userId, roleId, currentUserId);

                if (!success)
                {
                    return BadRequest("User already has this role or role assignment failed");
                }

                await loggingService.LogAuditAsync(
                    currentUserId,
                    "Assign",
                    "UserRole",
                    description: $"Assigned role {roleId} to user {userId}"
                );

                logger.LogInformation("User {UserId} assigned role {RoleId} to user {TargetUserId}",
                    currentUserId, roleId, userId);

                return Ok(new { message = "Role assigned successfully" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error assigning role {RoleId} to user {UserId}", roleId, userId);
                return HttpResponseHelper.CreateErrorResponse("An error occurred while assigning the role");
            }
        }

        [HttpDelete("{roleId}/remove/{userId}")]
        [RequireRole(RoleConstants.PLATFORM_ADMIN)]
        public async Task<IActionResult> RemoveRoleFromUser(Guid roleId, Guid userId)
        {
            try
            {
                var currentUserId = UserHelper.GetCurrentUserId(User);
                var success = await roleService.RemoveRoleFromUserAsync(userId, roleId);

                if (!success)
                {
                    return NotFound("User role assignment not found");
                }

                await loggingService.LogAuditAsync(
                    currentUserId,
                    "Remove",
                    "UserRole",
                    description: $"Removed role {roleId} from user {userId}"
                );

                logger.LogInformation("User {UserId} removed role {RoleId} from user {TargetUserId}",
                    currentUserId, roleId, userId);

                return Ok(new { message = "Role removed successfully" });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error removing role {RoleId} from user {UserId}", roleId, userId);
                return HttpResponseHelper.CreateErrorResponse("An error occurred while removing the role");
            }
        }

        [HttpGet("user/{userId}")]
        [RequireRole(RoleConstants.PLATFORM_ADMIN)]
        public async Task<IActionResult> GetUserRoles(Guid userId)
        {
            try
            {
                var currentUserId = UserHelper.GetCurrentUserId(User);
                var userRoles = await roleService.GetUserRolesAsync(userId);

                await loggingService.LogAuditAsync(
                    currentUserId,
                    "View",
                    "UserRole",
                    entityId: userId,
                    description: $"Retrieved user roles for user {userId} - {userRoles.Count()} roles found"
                );

                return Ok(userRoles);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving roles for user {UserId}", userId);
                return HttpResponseHelper.CreateErrorResponse("An error occurred while retrieving user roles");
            }
        }

        /// <summary>
        /// Check role name availability
        /// </summary>
        [HttpGet("check-name")]
        [RequireRole(RoleConstants.PLATFORM_ADMIN)]
        public async Task<IActionResult> CheckRoleNameAvailability([FromQuery] string name, [FromQuery] Guid? excludeId = null)
        {
            try
            {
                var isAvailable = await roleService.CheckRoleNameAvailabilityAsync(name, excludeId);
                return Ok(new
                {
                    IsAvailable = isAvailable,
                    Message = isAvailable ? "Role name is available" : "Role name is already taken"
                });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error checking role name availability");
                return HttpResponseHelper.CreateErrorResponse("Error checking role name availability");
            }
        }

        /// <summary>
        /// Get system roles
        /// </summary>
        [HttpGet("system")]
        [RequireRole(RoleConstants.PLATFORM_ADMIN)]
        public async Task<IActionResult> GetSystemRoles()
        {
            try
            {
                var currentUserId = UserHelper.GetCurrentUserId(User);
                var systemRoles = await roleService.GetSystemRolesAsync();

                await loggingService.LogAuditAsync(
                    currentUserId,
                    "View",
                    "Role",
                    description: $"Retrieved system roles - {systemRoles.Count()} roles found"
                );

                return Ok(systemRoles);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving system roles");
                return HttpResponseHelper.CreateErrorResponse("Error retrieving system roles");
            }
        }

        /// <summary>
        /// Bulk delete roles
        /// </summary>
        [HttpPost("bulk/delete")]
        [RequireRole(RoleConstants.PLATFORM_ADMIN)]
        public async Task<IActionResult> BulkDeleteRoles([FromBody] BulkDeleteRolesRequest request)
        {
            try
            {
                var currentUserId = UserHelper.GetCurrentUserId(User);
                var result = await roleService.BulkDeleteRolesAsync(request.RoleIds, currentUserId);

                await loggingService.LogAuditAsync(
                    currentUserId,
                    "Delete",
                    "Role",
                    description: $"Bulk deleted {result.SuccessfulCount} roles, {result.FailedCount} failed"
                );

                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error bulk deleting roles");
                return HttpResponseHelper.CreateErrorResponse("Error bulk deleting roles");
            }
        }

        /// <summary>
        /// Get role hierarchy
        /// </summary>
        [HttpGet("hierarchy")]
        [RequireRole(RoleConstants.PLATFORM_ADMIN)]
        public async Task<IActionResult> GetRoleHierarchy()
        {
            try
            {
                var hierarchy = await roleService.GetRoleHierarchyAsync();
                return Ok(hierarchy);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving role hierarchy");
                return HttpResponseHelper.CreateErrorResponse("Error retrieving role hierarchy");
            }
        }

        /// <summary>
        /// Get role statistics
        /// </summary>
        [HttpGet("{id}/stats")]
        [RequireRole(RoleConstants.PLATFORM_ADMIN)]
        public async Task<IActionResult> GetRoleStats(Guid id)
        {
            try
            {
                var stats = await roleService.GetRoleStatsAsync(id);
                return Ok(stats);
            }
            catch (ArgumentException)
            {
                return HttpResponseHelper.CreateNotFoundResponse("Role");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving role stats for {RoleId}", id);
                return HttpResponseHelper.CreateErrorResponse("Error retrieving role statistics");
            }
        }

        /// <summary>
        /// Assign users to role
        /// </summary>
        [HttpPost("{roleId}/assign-users")]
        [RequireRole(RoleConstants.PLATFORM_ADMIN)]
        public async Task<IActionResult> AssignUsersToRole(Guid roleId, [FromBody] AssignUsersToRoleRequest request)
        {
            try
            {
                var currentUserId = UserHelper.GetCurrentUserId(User);
                var success = await roleService.AssignUsersToRoleAsync(roleId, request.UserIds, currentUserId);

                if (!success)
                {
                    return HttpResponseHelper.CreateBadRequestResponse("Failed to assign users to role");
                }

                await loggingService.LogAuditAsync(
                    currentUserId,
                    "Assign",
                    "UserRole",
                    description: $"Assigned {request.UserIds.Count} users to role {roleId}"
                );

                return Ok(new { Message = "Users assigned to role successfully" });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error assigning users to role {RoleId}", roleId);
                return HttpResponseHelper.CreateErrorResponse("Error assigning users to role");
            }
        }

        /// <summary>
        /// Remove users from role
        /// </summary>
        [HttpPost("{roleId}/remove-users")]
        [RequireRole(RoleConstants.PLATFORM_ADMIN)]
        public async Task<IActionResult> RemoveUsersFromRole(Guid roleId, [FromBody] RemoveUsersFromRoleRequest request)
        {
            try
            {
                var currentUserId = UserHelper.GetCurrentUserId(User);
                var success = await roleService.RemoveUsersFromRoleAsync(roleId, request.UserIds);

                if (!success)
                {
                    return HttpResponseHelper.CreateBadRequestResponse("Failed to remove users from role");
                }

                await loggingService.LogAuditAsync(
                    currentUserId,
                    "Remove",
                    "UserRole",
                    description: $"Removed {request.UserIds.Count} users from role {roleId}"
                );

                return Ok(new { Message = "Users removed from role successfully" });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error removing users from role {RoleId}", roleId);
                return HttpResponseHelper.CreateErrorResponse("Error removing users from role");
            }
        }

        /// <summary>
        /// Get users assigned to role
        /// </summary>
        [HttpGet("{id}/users")]
        [RequireRole(RoleConstants.PLATFORM_ADMIN)]
        public async Task<IActionResult> GetRoleUsers(Guid id)
        {
            try
            {
                var users = await roleService.GetRoleUsersAsync(id);
                return Ok(users);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving users for role {RoleId}", id);
                return HttpResponseHelper.CreateErrorResponse("Error retrieving role users");
            }
        }
    }
}