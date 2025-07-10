using cams.Backend.Attributes;
using cams.Backend.Constants;
using cams.Backend.Helpers;
using cams.Backend.Services;
using cams.Backend.View;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace cams.Backend.Controller
{
    [ApiController]
    [Route("management/roles")]
    [Authorize]
    public class RoleController : ControllerBase
    {
        private readonly IRoleService _roleService;
        private readonly ILoggingService _loggingService;
        private readonly ILogger<RoleController> _logger;

        public RoleController(
            IRoleService roleService,
            ILoggingService loggingService,
            ILogger<RoleController> logger)
        {
            _roleService = roleService;
            _loggingService = loggingService;
            _logger = logger;
        }

        [HttpGet]
        [RequireRole(RoleConstants.PLATFORM_ADMIN)]
        public async Task<IActionResult> GetAllRoles()
        {
            try
            {
                var currentUserId = UserHelper.GetCurrentUserId(User);
                var roles = await _roleService.GetAllRolesAsync();

                await _loggingService.LogAuditAsync(
                    currentUserId,
                    "View",
                    "Role",
                    description: $"Retrieved all roles - {roles.Count()} roles found"
                );

                _logger.LogInformation("User {UserId} retrieved {RoleCount} roles",
                    currentUserId, roles.Count());

                return Ok(roles);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving roles");
                return HttpResponseHelper.CreateErrorResponse("An error occurred while retrieving roles");
            }
        }

        [HttpGet("{id}")]
        [RequireRole(RoleConstants.PLATFORM_ADMIN)]
        public async Task<IActionResult> GetRoleById(int id)
        {
            try
            {
                var currentUserId = UserHelper.GetCurrentUserId(User);
                var role = await _roleService.GetRoleByIdAsync(id);

                if (role == null)
                {
                    return NotFound($"Role with ID {id} not found");
                }

                await _loggingService.LogAuditAsync(
                    currentUserId,
                    "View",
                    "Role",
                    entityId: id,
                    entityName: role.Name,
                    description: $"Retrieved role {role.Name}"
                );

                _logger.LogInformation("User {UserId} retrieved role {RoleId} ({RoleName})",
                    currentUserId, id, role.Name);

                return Ok(role);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving role {RoleId}", id);
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
                var role = await _roleService.CreateRoleAsync(request);

                await _loggingService.LogAuditAsync(
                    currentUserId,
                    "Create",
                    "Role",
                    entityId: role.Id,
                    entityName: role.Name,
                    description: $"Created new role: {role.Name}",
                    newValues: $"Name: {role.Name}, Description: {role.Description}"
                );

                _logger.LogInformation("User {UserId} created role {RoleId} ({RoleName})",
                    currentUserId, role.Id, role.Name);

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
                _logger.LogError(ex, "Error creating role");
                return HttpResponseHelper.CreateErrorResponse("An error occurred while creating the role");
            }
        }

        [HttpPut("{id}")]
        [RequireRole(RoleConstants.PLATFORM_ADMIN)]
        public async Task<IActionResult> UpdateRole(int id, [FromBody] RoleRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var currentUserId = UserHelper.GetCurrentUserId(User);
                var role = await _roleService.UpdateRoleAsync(id, request);

                if (role == null)
                {
                    return NotFound($"Role with ID {id} not found");
                }

                await _loggingService.LogAuditAsync(
                    currentUserId,
                    "Update",
                    "Role",
                    entityId: id,
                    entityName: role.Name,
                    description: $"Updated role: {role.Name}",
                    newValues: $"Name: {role.Name}, Description: {role.Description}"
                );

                _logger.LogInformation("User {UserId} updated role {RoleId} ({RoleName})",
                    currentUserId, id, role.Name);

                return Ok(role);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating role {RoleId}", id);
                return HttpResponseHelper.CreateErrorResponse("An error occurred while updating the role");
            }
        }

        [HttpDelete("{id}")]
        [RequireRole(RoleConstants.PLATFORM_ADMIN)]
        public async Task<IActionResult> DeleteRole(int id)
        {
            try
            {
                var currentUserId = UserHelper.GetCurrentUserId(User);
                var success = await _roleService.DeleteRoleAsync(id);

                if (!success)
                {
                    return NotFound($"Role with ID {id} not found");
                }

                await _loggingService.LogAuditAsync(
                    currentUserId,
                    "Delete",
                    "Role",
                    entityId: id,
                    description: $"Deleted role with ID {id}"
                );

                _logger.LogInformation("User {UserId} deleted role {RoleId}",
                    currentUserId, id);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting role {RoleId}", id);
                return HttpResponseHelper.CreateErrorResponse("An error occurred while deleting the role");
            }
        }

        [HttpPost("{roleId}/assign/{userId}")]
        [RequireRole(RoleConstants.PLATFORM_ADMIN)]
        public async Task<IActionResult> AssignRoleToUser(int roleId, int userId)
        {
            try
            {
                var currentUserId = UserHelper.GetCurrentUserId(User);
                var success = await _roleService.AssignRoleToUserAsync(userId, roleId, currentUserId);

                if (!success)
                {
                    return BadRequest("User already has this role or role assignment failed");
                }

                await _loggingService.LogAuditAsync(
                    currentUserId,
                    "Assign",
                    "UserRole",
                    description: $"Assigned role {roleId} to user {userId}"
                );

                _logger.LogInformation("User {UserId} assigned role {RoleId} to user {TargetUserId}",
                    currentUserId, roleId, userId);

                return Ok(new { message = "Role assigned successfully" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error assigning role {RoleId} to user {UserId}", roleId, userId);
                return HttpResponseHelper.CreateErrorResponse("An error occurred while assigning the role");
            }
        }

        [HttpDelete("{roleId}/remove/{userId}")]
        [RequireRole(RoleConstants.PLATFORM_ADMIN)]
        public async Task<IActionResult> RemoveRoleFromUser(int roleId, int userId)
        {
            try
            {
                var currentUserId = UserHelper.GetCurrentUserId(User);
                var success = await _roleService.RemoveRoleFromUserAsync(userId, roleId);

                if (!success)
                {
                    return NotFound("User role assignment not found");
                }

                await _loggingService.LogAuditAsync(
                    currentUserId,
                    "Remove",
                    "UserRole",
                    description: $"Removed role {roleId} from user {userId}"
                );

                _logger.LogInformation("User {UserId} removed role {RoleId} from user {TargetUserId}",
                    currentUserId, roleId, userId);

                return Ok(new { message = "Role removed successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing role {RoleId} from user {UserId}", roleId, userId);
                return HttpResponseHelper.CreateErrorResponse("An error occurred while removing the role");
            }
        }

        [HttpGet("user/{userId}")]
        [RequireRole(RoleConstants.PLATFORM_ADMIN)]
        public async Task<IActionResult> GetUserRoles(int userId)
        {
            try
            {
                var currentUserId = UserHelper.GetCurrentUserId(User);
                var userRoles = await _roleService.GetUserRolesAsync(userId);

                await _loggingService.LogAuditAsync(
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
                _logger.LogError(ex, "Error retrieving roles for user {UserId}", userId);
                return HttpResponseHelper.CreateErrorResponse("An error occurred while retrieving user roles");
            }
        }
    }
}