using cams.Backend.Attributes;
using cams.Backend.Constants;
using cams.Backend.Data;
using cams.Backend.Helpers;
using cams.Backend.Model;
using cams.Backend.Services;
using cams.Backend.View;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace cams.Backend.Controller
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    [RequireRole(RoleConstants.PLATFORM_ADMIN)]
    public class CreateUserController(
        ApplicationDbContext context,
        IRoleService roleService,
        ILoggingService loggingService,
        ILogger<CreateUserController> logger)
        : ControllerBase
    {
        [HttpPost]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var currentUserId = UserHelper.GetCurrentUserId(User);

                // Check if a username already exists
                var existingUser = await context.Users
                    .FirstOrDefaultAsync(u => u.Username == request.Username);
                if (existingUser != null)
                {
                    return BadRequest($"Username '{request.Username}' already exists");
                }

                // Check if email already exists
                var existingEmail = await context.Users
                    .FirstOrDefaultAsync(u => u.Email == request.Email);
                if (existingEmail != null)
                {
                    return BadRequest($"Email '{request.Email}' already exists");
                }

                // Validate that all role IDs exist
                var validRoles = await context.Roles
                    .Where(r => request.RoleIds.Contains(r.Id) && r.IsActive)
                    .ToListAsync();

                if (validRoles.Count != request.RoleIds.Count)
                {
                    var invalidRoleIds = request.RoleIds.Except(validRoles.Select(r => r.Id));
                    return BadRequest($"Invalid role IDs: {string.Join(", ", invalidRoleIds)}");
                }

                // Create the user
                var user = new User
                {
                    Username = request.Username,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                    Email = request.Email,
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    PhoneNumber = request.PhoneNumber,
                    IsActive = request.IsActive,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                context.Users.Add(user);
                await context.SaveChangesAsync();

                // Assign roles to the user
                foreach (var roleId in request.RoleIds)
                {
                    await roleService.AssignRoleToUserAsync(user.Id, roleId, currentUserId);
                }

                // Retrieve the created user with roles
                var createdUser = await context.Users
                    .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                    .Where(u => u.Id == user.Id)
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

                await loggingService.LogAuditAsync(
                    currentUserId,
                    "Create",
                    "User",
                    entityId: user.Id,
                    entityName: user.Username,
                    description: $"Created new user: {user.Username}",
                    newValues: $"Email: {user.Email}, Roles: {string.Join(", ", validRoles.Select(r => r.Name))}"
                );

                await loggingService.LogSecurityEventAsync(
                    "UserCreated",
                    "Success",
                    userId: currentUserId,
                    username: UserHelper.GetCurrentUsername(User),
                    description: $"Platform admin created new user: {user.Username}",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                return CreatedAtAction(
                    "GetUserById",
                    "Users",
                    new { id = user.Id },
                    createdUser);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error creating user");
                
                await loggingService.LogSecurityEventAsync(
                    "UserCreationFailed",
                    "Failed",
                    userId: UserHelper.GetCurrentUserId(User),
                    username: UserHelper.GetCurrentUsername(User),
                    description: $"Failed to create user: {request.Username}",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                return HttpResponseHelper.CreateErrorResponse("An error occurred while creating the user");
            }
        }

        [HttpGet("roles")]
        public async Task<IActionResult> GetAvailableRoles()
        {
            try
            {
                var currentUserId = UserHelper.GetCurrentUserId(User);
                var roles = await roleService.GetAllRolesAsync();

                await loggingService.LogAuditAsync(
                    currentUserId,
                    "View",
                    "Role",
                    description: $"Retrieved available roles for user creation - {roles.Count()} roles found"
                );

                return Ok(roles);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving available roles");
                return HttpResponseHelper.CreateErrorResponse("An error occurred while retrieving available roles");
            }
        }

        [HttpPost("validate-username")]
        public async Task<IActionResult> ValidateUsername([FromBody] ValidateUsernameRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Username))
                {
                    return BadRequest("Username is required");
                }

                var exists = await context.Users
                    .AnyAsync(u => u.Username == request.Username);

                return Ok(new { isAvailable = !exists });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error validating username");
                return HttpResponseHelper.CreateErrorResponse("An error occurred while validating the username");
            }
        }

        [HttpPost("validate-email")]
        public async Task<IActionResult> ValidateEmail([FromBody] ValidateEmailRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Email))
                {
                    return BadRequest("Email is required");
                }

                var exists = await context.Users
                    .AnyAsync(u => u.Email == request.Email);

                return Ok(new { isAvailable = !exists });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error validating email");
                return HttpResponseHelper.CreateErrorResponse("An error occurred while validating the email");
            }
        }
    }
}