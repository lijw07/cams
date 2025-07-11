using cams.Backend.Attributes;
using cams.Backend.Constants;
using cams.Backend.Data;
using cams.Backend.Helpers;
using Backend.Helpers;
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

                // Get total count for pagination (before applying Skip/Take)
                var totalCount = await query.CountAsync();
                
                // Calculate pagination metadata
                var totalPages = (int)Math.Ceiling((double)totalCount / request.PageSize);
                var offset = (request.PageNumber - 1) * request.PageSize;

                // Apply sorting and pagination (SKIP/TAKE = OFFSET/LIMIT)
                var users = await query
                    .OrderByDescending(u => u.CreatedAt) // Most recent first, matching logs pattern
                    .Skip(offset)                        // OFFSET
                    .Take(request.PageSize)              // LIMIT
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
                            }).ToList(),
                        ApplicationCount = context.Applications.Count(a => a.UserId == u.Id),
                        DatabaseConnectionCount = context.DatabaseConnections.Count(dc => dc.UserId == u.Id)
                    })
                    .ToListAsync();

                var result = new PaginatedResponse<UserWithRolesResponse>
                {
                    Data = users,
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
        public async Task<IActionResult> GetUserById(Guid id)
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
                    .Where(u => u.Id == id);

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
                            }).ToList(),
                        ApplicationCount = context.Applications.Count(a => a.UserId == u.Id),
                        DatabaseConnectionCount = context.DatabaseConnections.Count(dc => dc.UserId == u.Id)
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
                    currentUserId, id, LoggingHelper.Sanitize(user.Username));

                return Ok(user);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving user {UserId}", id);
                return HttpResponseHelper.CreateErrorResponse("An error occurred while retrieving the user");
            }
        }

        /// <summary>
        /// Create a new user
        /// </summary>
        [HttpPost]
        [RequireRole(RoleConstants.PLATFORM_ADMIN, RoleConstants.ADMIN)]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
        {
            try
            {
                var currentUserId = UserHelper.GetCurrentUserId(User);
                
                // Check if username or email already exists
                var existingUser = await context.Users
                    .FirstOrDefaultAsync(u => u.Username == request.Username || u.Email == request.Email);
                
                if (existingUser != null)
                {
                    return HttpResponseHelper.CreateBadRequestResponse("Username or email already exists");
                }

                var user = new Model.User
                {
                    Username = request.Username,
                    Email = request.Email,
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    PhoneNumber = request.PhoneNumber,
                    IsActive = request.IsActive,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                context.Users.Add(user);
                await context.SaveChangesAsync();

                await loggingService.LogAuditAsync(
                    currentUserId,
                    "Create",
                    "User",
                    entityId: user.Id,
                    entityName: user.Username,
                    description: $"Created user: {LoggingHelper.Sanitize(user.Username)}"
                );

                // Log system event for user creation
                await loggingService.LogSystemEventAsync(
                    "UserCreated",
                    "Information",
                    "Authentication",
                    $"New user account created: {LoggingHelper.Sanitize(user.Username)}",
                    details: $"UserId: {user.Id}, Username: {LoggingHelper.Sanitize(user.Username)}, Email: {LoggingHelper.Sanitize(user.Email)}, IsActive: {user.IsActive}, CreatedBy: {currentUserId}",
                    userId: currentUserId,
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    httpMethod: HttpContext.Request.Method,
                    requestPath: HttpContext.Request.Path,
                    statusCode: 200
                );

                return Ok(new { Id = user.Id, Username = user.Username, Email = user.Email });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error creating user");
                return HttpResponseHelper.CreateErrorResponse("Error creating user");
            }
        }

        /// <summary>
        /// Update a user
        /// </summary>
        [HttpPut("{id}")]
        [RequireRole(RoleConstants.PLATFORM_ADMIN, RoleConstants.ADMIN)]
        public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserRequest request)
        {
            try
            {
                logger.LogInformation("UpdateUser request received for ID {UserId}. Request data: {RequestData}", 
                    id, System.Text.Json.JsonSerializer.Serialize(request));
                
                if (!ModelState.IsValid)
                {
                    logger.LogWarning("User update validation failed. Errors: {Errors}", 
                        string.Join("; ", ModelState.Where(x => x.Value?.Errors.Count > 0)
                            .SelectMany(x => x.Value!.Errors.Select(e => $"{x.Key}: {e.ErrorMessage}"))));
                    
                    return HttpResponseHelper.CreateValidationErrorResponse(
                        ModelState.Where(x => x.Value?.Errors.Count > 0)
                            .ToDictionary(
                                kvp => kvp.Key,
                                kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? Array.Empty<string>()
                            ));
                }
                
                var currentUserId = UserHelper.GetCurrentUserId(User);
                var user = await context.Users.FindAsync(id);
                
                if (user == null)
                {
                    return HttpResponseHelper.CreateNotFoundResponse("User");
                }

                // Check for duplicate username/email (excluding current user)
                var existingUser = await context.Users
                    .Where(u => u.Id != id && (u.Username == request.Username || u.Email == request.Email))
                    .FirstOrDefaultAsync();
                
                if (existingUser != null)
                {
                    string duplicateField = existingUser.Username == request.Username ? "Username" : "Email";
                    logger.LogWarning("User update failed - duplicate {Field}: {Value}", duplicateField, 
                        LoggingHelper.Sanitize(duplicateField == "Username" ? request.Username : request.Email));
                    return HttpResponseHelper.CreateBadRequestResponse($"{duplicateField} already exists");
                }

                user.Username = request.Username;
                user.Email = request.Email;
                user.FirstName = request.FirstName;
                user.LastName = request.LastName;
                user.PhoneNumber = request.PhoneNumber;
                user.IsActive = request.IsActive;
                user.UpdatedAt = DateTime.UtcNow;

                await context.SaveChangesAsync();

                await loggingService.LogAuditAsync(
                    currentUserId,
                    "Update",
                    "User",
                    entityId: id,
                    entityName: user.Username,
                    description: $"Updated user: {LoggingHelper.Sanitize(user.Username)}"
                );

                return Ok(new { message = "User updated successfully" });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error updating user {UserId}", id);
                return HttpResponseHelper.CreateErrorResponse("Error updating user");
            }
        }

        /// <summary>
        /// Delete a user
        /// </summary>
        [HttpDelete("{id}")]
        [RequireRole(RoleConstants.PLATFORM_ADMIN)]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            try
            {
                var currentUserId = UserHelper.GetCurrentUserId(User);
                var user = await context.Users.FindAsync(id);
                
                if (user == null)
                {
                    return HttpResponseHelper.CreateNotFoundResponse("User");
                }

                if (user.Id == currentUserId)
                {
                    return HttpResponseHelper.CreateBadRequestResponse("Cannot delete your own account");
                }

                // Store username for logging before deletion
                var username = user.Username;
                
                // Remove user roles first to avoid foreign key constraint issues
                var userRoles = await context.UserRoles.Where(ur => ur.UserId == id).ToListAsync();
                context.UserRoles.RemoveRange(userRoles);
                
                // Hard delete the user
                context.Users.Remove(user);
                await context.SaveChangesAsync();

                await loggingService.LogAuditAsync(
                    currentUserId,
                    "Delete",
                    "User",
                    entityId: id,
                    entityName: username,
                    description: $"Permanently deleted user: {LoggingHelper.Sanitize(username)}"
                );

                // Log system event for user deletion
                await loggingService.LogSystemEventAsync(
                    "UserDeleted",
                    "Information",
                    "Authentication",
                    $"User account permanently deleted: {LoggingHelper.Sanitize(username)}",
                    details: $"DeletedUserId: {id}, DeletedUsername: {LoggingHelper.Sanitize(username)}, PerformedBy: {currentUserId}, RolesRemoved: {userRoles.Count}",
                    userId: currentUserId,
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    httpMethod: HttpContext.Request.Method,
                    requestPath: HttpContext.Request.Path,
                    statusCode: 200
                );

                return Ok(new { message = "User deleted successfully" });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error deleting user {UserId}", id);
                return HttpResponseHelper.CreateErrorResponse("Error deleting user");
            }
        }

        /// <summary>
        /// Toggle user status
        /// </summary>
        [HttpPatch("{id}/toggle")]
        [RequireRole(RoleConstants.PLATFORM_ADMIN, RoleConstants.ADMIN)]
        public async Task<IActionResult> ToggleUserStatus(Guid id, [FromBody] ToggleUserStatusRequest request)
        {
            try
            {
                var currentUserId = UserHelper.GetCurrentUserId(User);
                var user = await context.Users.FindAsync(id);
                
                if (user == null)
                {
                    return HttpResponseHelper.CreateNotFoundResponse("User");
                }

                user.IsActive = request.IsActive;
                user.UpdatedAt = DateTime.UtcNow;
                await context.SaveChangesAsync();

                await loggingService.LogAuditAsync(
                    currentUserId,
                    "Update",
                    "User",
                    entityId: id,
                    entityName: user.Username,
                    description: $"Toggled user status: {LoggingHelper.Sanitize(user.Username)} - {(request.IsActive ? "Activated" : "Deactivated")}"
                );

                return Ok(new { message = $"User {(request.IsActive ? "activated" : "deactivated")} successfully" });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error toggling user status for {UserId}", id);
                return HttpResponseHelper.CreateErrorResponse("Error updating user status");
            }
        }

        /// <summary>
        /// Assign roles to user
        /// </summary>
        [HttpPost("assign-roles")]
        [RequireRole(RoleConstants.PLATFORM_ADMIN)]
        public async Task<IActionResult> AssignRoles([FromBody] UserRoleAssignmentRequest request)
        {
            try
            {
                var currentUserId = UserHelper.GetCurrentUserId(User);
                var user = await context.Users.FindAsync(request.UserId);
                
                if (user == null)
                {
                    return HttpResponseHelper.CreateNotFoundResponse("User");
                }

                // Remove existing role assignments - hard delete
                var existingRoles = await context.UserRoles
                    .Where(ur => ur.UserId == request.UserId)
                    .ToListAsync();
                
                context.UserRoles.RemoveRange(existingRoles);

                // Add new role assignments
                foreach (var roleId in request.RoleIds)
                {
                    var userRole = new Model.UserRole
                    {
                        UserId = request.UserId,
                        RoleId = roleId,
                        IsActive = true,
                        // CreatedAt = DateTime.UtcNow, // TODO: Add timestamp fields to UserRole model
                        // UpdatedAt = DateTime.UtcNow
                    };
                    context.UserRoles.Add(userRole);
                }

                await context.SaveChangesAsync();

                await loggingService.LogAuditAsync(
                    currentUserId,
                    "Update",
                    "User",
                    entityId: request.UserId,
                    entityName: user.Username,
                    description: $"Assigned roles to user: {LoggingHelper.Sanitize(user.Username)}"
                );

                return Ok(new { message = "Roles assigned successfully" });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error assigning roles to user");
                return HttpResponseHelper.CreateErrorResponse("Error assigning roles");
            }
        }

        /// <summary>
        /// Remove roles from user
        /// </summary>
        [HttpPost("remove-roles")]
        [RequireRole(RoleConstants.PLATFORM_ADMIN)]
        public async Task<IActionResult> RemoveRoles([FromBody] UserRoleAssignmentRequest request)
        {
            try
            {
                var currentUserId = UserHelper.GetCurrentUserId(User);
                var user = await context.Users.FindAsync(request.UserId);
                
                if (user == null)
                {
                    return HttpResponseHelper.CreateNotFoundResponse("User");
                }

                var userRoles = await context.UserRoles
                    .Where(ur => ur.UserId == request.UserId && request.RoleIds.Contains(ur.RoleId))
                    .ToListAsync();

                // Hard delete - completely remove UserRole records from database
                context.UserRoles.RemoveRange(userRoles);

                await context.SaveChangesAsync();

                await loggingService.LogAuditAsync(
                    currentUserId,
                    "Update",
                    "User",
                    entityId: request.UserId,
                    entityName: user.Username,
                    description: $"Removed roles from user: {LoggingHelper.Sanitize(user.Username)}"
                );

                return Ok(new { message = "Roles removed successfully" });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error removing roles from user");
                return HttpResponseHelper.CreateErrorResponse("Error removing roles");
            }
        }

        /// <summary>
        /// Get user statistics
        /// </summary>
        [HttpGet("{id}/stats")]
        [RequireRole(RoleConstants.PLATFORM_ADMIN, RoleConstants.ADMIN)]
        public async Task<IActionResult> GetUserStats(Guid id)
        {
            try
            {
                var user = await context.Users.FindAsync(id);
                if (user == null)
                {
                    return HttpResponseHelper.CreateNotFoundResponse("User");
                }

                var applicationCount = await context.Applications
                    .Where(a => a.IsActive) // TODO: Add CreatedBy field to Application model
                    .CountAsync();

                var connectionCount = await context.DatabaseConnections
                    .Where(dc => dc.IsActive) // TODO: Add CreatedBy field to DatabaseConnection model
                    .CountAsync();

                var accountCreatedDays = (DateTime.UtcNow - user.CreatedAt).Days;

                var stats = new
                {
                    ApplicationCount = applicationCount,
                    DatabaseConnectionCount = connectionCount,
                    LastLoginAt = user.LastLoginAt,
                    AccountCreatedDays = accountCreatedDays
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting user stats for {UserId}", id);
                return HttpResponseHelper.CreateErrorResponse("Error retrieving user statistics");
            }
        }

        /// <summary>
        /// Reset user password
        /// </summary>
        [HttpPost("{id}/reset-password")]
        [RequireRole(RoleConstants.PLATFORM_ADMIN)]
        public async Task<IActionResult> ResetUserPassword(Guid id, [FromBody] ResetPasswordRequest request)
        {
            try
            {
                var currentUserId = UserHelper.GetCurrentUserId(User);
                var user = await context.Users.FindAsync(id);
                
                if (user == null)
                {
                    return HttpResponseHelper.CreateNotFoundResponse("User");
                }

                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
                user.UpdatedAt = DateTime.UtcNow;
                await context.SaveChangesAsync();

                await loggingService.LogAuditAsync(
                    currentUserId,
                    "Update",
                    "User",
                    entityId: id,
                    entityName: user.Username,
                    description: $"Reset password for user: {LoggingHelper.Sanitize(user.Username)}"
                );

                return Ok(new { message = "Password reset successfully" });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error resetting password for user {UserId}", id);
                return HttpResponseHelper.CreateErrorResponse("Error resetting password");
            }
        }

        /// <summary>
        /// Force password change on next login
        /// </summary>
        [HttpPost("{id}/force-password-change")]
        [RequireRole(RoleConstants.PLATFORM_ADMIN)]
        public async Task<IActionResult> ForcePasswordChange(Guid id)
        {
            try
            {
                var currentUserId = UserHelper.GetCurrentUserId(User);
                var user = await context.Users.FindAsync(id);
                
                if (user == null)
                {
                    return HttpResponseHelper.CreateNotFoundResponse("User");
                }

                // Set flag to force password change (would need to add this field to User model)
                user.UpdatedAt = DateTime.UtcNow;
                await context.SaveChangesAsync();

                await loggingService.LogAuditAsync(
                    currentUserId,
                    "Update",
                    "User",
                    entityId: id,
                    entityName: user.Username,
                    description: $"Forced password change for user: {LoggingHelper.Sanitize(user.Username)}"
                );

                return Ok(new { message = "User will be required to change password on next login" });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error forcing password change for user {UserId}", id);
                return HttpResponseHelper.CreateErrorResponse("Error forcing password change");
            }
        }

        /// <summary>
        /// Bulk toggle user status
        /// </summary>
        [HttpPost("bulk/toggle")]
        [RequireRole(RoleConstants.PLATFORM_ADMIN)]
        public async Task<IActionResult> BulkToggleStatus([FromBody] BulkToggleUserStatusRequest request)
        {
            try
            {
                var currentUserId = UserHelper.GetCurrentUserId(User);
                var users = await context.Users
                    .Where(u => request.UserIds.Contains(u.Id))
                    .ToListAsync();

                var successful = new List<Guid>();
                var failed = new List<object>();

                foreach (var user in users)
                {
                    try
                    {
                        if (user.Id == currentUserId && !request.IsActive)
                        {
                            failed.Add(new { id = user.Id, error = "Cannot deactivate your own account" });
                            continue;
                        }

                        user.IsActive = request.IsActive;
                        user.UpdatedAt = DateTime.UtcNow;
                        successful.Add(user.Id);
                    }
                    catch (Exception ex)
                    {
                        failed.Add(new { id = user.Id, error = ex.Message });
                    }
                }

                await context.SaveChangesAsync();

                await loggingService.LogAuditAsync(
                    currentUserId,
                    "Update",
                    "User",
                    description: $"Bulk toggled status for {successful.Count} users"
                );

                return Ok(new
                {
                    Successful = successful,
                    Failed = failed,
                    Message = $"Successfully updated {successful.Count} users"
                });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error bulk toggling user status");
                return HttpResponseHelper.CreateErrorResponse("Error bulk updating user status");
            }
        }

        /// <summary>
        /// Bulk delete users
        /// </summary>
        [HttpPost("bulk/delete")]
        [RequireRole(RoleConstants.PLATFORM_ADMIN)]
        public async Task<IActionResult> BulkDelete([FromBody] BulkDeleteUsersRequest request)
        {
            try
            {
                var currentUserId = UserHelper.GetCurrentUserId(User);
                var users = await context.Users
                    .Where(u => request.UserIds.Contains(u.Id))
                    .ToListAsync();

                var successful = new List<Guid>();
                var failed = new List<object>();

                foreach (var user in users)
                {
                    try
                    {
                        if (user.Id == currentUserId)
                        {
                            failed.Add(new { id = user.Id, error = "Cannot delete your own account" });
                            continue;
                        }

                        user.IsActive = false;
                        user.UpdatedAt = DateTime.UtcNow;
                        successful.Add(user.Id);
                    }
                    catch (Exception ex)
                    {
                        failed.Add(new { id = user.Id, error = ex.Message });
                    }
                }

                await context.SaveChangesAsync();

                await loggingService.LogAuditAsync(
                    currentUserId,
                    "Delete",
                    "User",
                    description: $"Bulk deleted {successful.Count} users"
                );

                // Log system event for bulk user deletion
                await loggingService.LogSystemEventAsync(
                    "BulkUserDeletion",
                    failed.Count > 0 ? "Warning" : "Information",
                    "Authentication",
                    $"Bulk user deletion completed: {successful.Count} successful, {failed.Count} failed",
                    details: $"RequestedUsers: {request.UserIds.Count}, SuccessfulDeletions: {successful.Count}, FailedDeletions: {failed.Count}, PerformedBy: {currentUserId}",
                    userId: currentUserId,
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    httpMethod: HttpContext.Request.Method,
                    requestPath: HttpContext.Request.Path,
                    statusCode: 200
                );

                // Log system event for failed deletions if any
                if (failed.Count > 0)
                {
                    await loggingService.LogSystemEventAsync(
                        "BulkUserDeletionPartialFailure",
                        "Warning",
                        "Authentication",
                        $"Bulk user deletion had {failed.Count} failures",
                        details: $"FailedUsers: [{string.Join(", ", failed.Select(f => f.ToString()))}], PerformedBy: {currentUserId}",
                        userId: currentUserId,
                        ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                        httpMethod: HttpContext.Request.Method,
                        requestPath: HttpContext.Request.Path,
                        statusCode: 200
                    );
                }

                return Ok(new
                {
                    Successful = successful,
                    Failed = failed,
                    Message = $"Successfully deleted {successful.Count} users"
                });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error bulk deleting users");
                return HttpResponseHelper.CreateErrorResponse("Error bulk deleting users");
            }
        }

        /// <summary>
        /// Search users
        /// </summary>
        [HttpGet("search")]
        [RequireRole(RoleConstants.PLATFORM_ADMIN, RoleConstants.ADMIN)]
        public async Task<IActionResult> SearchUsers(
            [FromQuery] string searchTerm,
            [FromQuery] bool? isActive = null,
            [FromQuery] string[]? roles = null,
            [FromQuery] string? createdAfter = null,
            [FromQuery] string? createdBefore = null)
        {
            try
            {
                var query = context.Users
                    .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                    .AsQueryable();

                if (!string.IsNullOrWhiteSpace(searchTerm))
                {
                    var search = searchTerm.ToLower();
                    query = query.Where(u => 
                        u.Username.ToLower().Contains(search) ||
                        u.Email.ToLower().Contains(search) ||
                        (u.FirstName != null && u.FirstName.ToLower().Contains(search)) ||
                        (u.LastName != null && u.LastName.ToLower().Contains(search)));
                }

                if (isActive.HasValue)
                {
                    query = query.Where(u => u.IsActive == isActive.Value);
                }

                if (roles != null && roles.Length > 0)
                {
                    query = query.Where(u => u.UserRoles.Any(ur => 
                        roles.Contains(ur.Role.Name) && ur.IsActive));
                }

                if (!string.IsNullOrWhiteSpace(createdAfter) && DateTime.TryParse(createdAfter, out var afterDate))
                {
                    query = query.Where(u => u.CreatedAt >= afterDate);
                }

                if (!string.IsNullOrWhiteSpace(createdBefore) && DateTime.TryParse(createdBefore, out var beforeDate))
                {
                    query = query.Where(u => u.CreatedAt <= beforeDate);
                }

                var users = await query
                    .Take(100) // Limit results
                    .Select(u => new
                    {
                        u.Id,
                        u.Username,
                        u.Email,
                        u.FirstName,
                        u.LastName,
                        u.IsActive,
                        u.CreatedAt,
                        Roles = u.UserRoles
                            .Where(ur => ur.IsActive)
                            .Select(ur => ur.Role.Name)
                            .ToList()
                    })
                    .ToListAsync();

                return Ok(users);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error searching users");
                return HttpResponseHelper.CreateErrorResponse("Error searching users");
            }
        }

        /// <summary>
        /// Get roles for a specific user - PlatformAdmin/Admin only
        /// </summary>
        [HttpGet("{id}/roles")]
        [RequireRole(RoleConstants.PLATFORM_ADMIN, RoleConstants.ADMIN)]
        public async Task<IActionResult> GetUserRoles(Guid id)
        {
            try
            {
                var currentUserId = UserHelper.GetCurrentUserId(User);
                var userRoles = await roleService.GetUserRolesAsync(id);

                await loggingService.LogAuditAsync(
                    currentUserId,
                    "View",
                    "UserRole",
                    entityId: id,
                    description: $"Retrieved roles for user {id} - {userRoles.Count()} roles found"
                );

                logger.LogInformation("User {UserId} retrieved roles for user {TargetUserId} - {RoleCount} roles found",
                    currentUserId, id, userRoles.Count());

                return Ok(userRoles);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving roles for user {UserId}", id);
                return HttpResponseHelper.CreateErrorResponse("Error retrieving user roles");
            }
        }
    }
}