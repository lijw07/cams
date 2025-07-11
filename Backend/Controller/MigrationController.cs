using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using cams.Backend.Services;
using cams.Backend.View;
using cams.Backend.Helpers;
using cams.Backend.Constants;
using cams.Backend.Enums;

namespace cams.Backend.Controller
{
    [ApiController]
    [Route("migration")]
    [Authorize]
    public class MigrationController(
        IMigrationService migrationService,
        ILogger<MigrationController> logger,
        ILoggingService loggingService)
        : ControllerBase
    {
        [HttpPost("validate")]
        public async Task<IActionResult> ValidateMigration([FromBody] BulkMigrationRequest request)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);

                // Check if user has admin privileges
                if (!User.IsInRole("Admin") && !User.IsInRole("PlatformAdmin"))
                {
                    return Forbid("Only administrators can perform bulk migrations");
                }

                var result = await migrationService.ValidateBulkImportAsync(request);

                // Log audit event for migration validation
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.Read.ToString(),
                    AuditEntityTypes.SYSTEM_CONFIG,
                    description: $"Validated bulk migration for {request.MigrationType} ({result.TotalRecords} records)",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error validating migration");
                return HttpResponseHelper.CreateErrorResponse("Error validating migration data");
            }
        }

        [HttpPost("import")]
        public async Task<IActionResult> ImportData([FromBody] BulkMigrationRequest request)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);

                // Check if user has admin privileges
                if (!User.IsInRole("Admin") && !User.IsInRole("PlatformAdmin"))
                {
                    return Forbid("Only administrators can perform bulk migrations");
                }

                var result = await migrationService.ProcessBulkMigrationAsync(request, userId);

                // Log audit event for migration
                await loggingService.LogAuditAsync(
                    userId,
                    request.ValidateOnly ? AuditAction.Read.ToString() : AuditAction.Create.ToString(),
                    AuditEntityTypes.SYSTEM_CONFIG,
                    description: $"Bulk migration for {request.MigrationType}: {result.SuccessfulRecords}/{result.TotalRecords} successful",
                    newValues: $"Type: {request.MigrationType}, Records: {result.TotalRecords}, Success: {result.SuccessfulRecords}, Failed: {result.FailedRecords}",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                // Log security event for bulk operations
                if (!request.ValidateOnly && result.TotalRecords > 0)
                {
                    await loggingService.LogSecurityEventAsync(
                        SecurityEventType.Login.ToString(),
                        result.Success ? SecurityStatus.Success.ToString() : SecurityStatus.Failure.ToString(),
                        userId: userId,
                        description: $"Bulk {request.MigrationType} import: {result.SuccessfulRecords} successful, {result.FailedRecords} failed",
                        ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                        userAgent: Request.Headers.UserAgent.ToString(),
                        severity: result.TotalRecords > 100 ? SecuritySeverity.Critical.ToString() : SecuritySeverity.Warning.ToString(),
                        metadata: $"Type: {request.MigrationType}, TotalRecords: {result.TotalRecords}"
                    );
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error importing migration data");
                return HttpResponseHelper.CreateErrorResponse("Error importing migration data");
            }
        }

        [HttpPost("users")]
        public async Task<IActionResult> ImportUsers([FromBody] BulkUserImportRequest request)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);

                // Check if user has admin privileges
                if (!User.IsInRole("Admin") && !User.IsInRole("PlatformAdmin"))
                {
                    return Forbid("Only administrators can perform bulk user imports");
                }

                var result = await migrationService.ImportUsersAsync(request, userId);

                // Log audit event for user import
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.Create.ToString(),
                    AuditEntityTypes.USER,
                    description: $"Bulk user import: {result.SuccessfulRecords}/{result.TotalRecords} successful",
                    newValues: $"Users: {result.TotalRecords}, Success: {result.SuccessfulRecords}, Failed: {result.FailedRecords}, SendEmails: {request.SendWelcomeEmails}",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error importing users");
                return HttpResponseHelper.CreateErrorResponse("Error importing users");
            }
        }

        [HttpPost("roles")]
        public async Task<IActionResult> ImportRoles([FromBody] BulkRoleImportRequest request)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);

                // Check if user has admin privileges
                if (!User.IsInRole("Admin") && !User.IsInRole("PlatformAdmin"))
                {
                    return Forbid("Only administrators can perform bulk role imports");
                }

                var result = await migrationService.ImportRolesAsync(request, userId);

                // Log audit event for role import
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.Create.ToString(),
                    AuditEntityTypes.SYSTEM_CONFIG,
                    description: $"Bulk role import: {result.SuccessfulRecords}/{result.TotalRecords} successful",
                    newValues: $"Roles: {result.TotalRecords}, Success: {result.SuccessfulRecords}, Failed: {result.FailedRecords}",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error importing roles");
                return HttpResponseHelper.CreateErrorResponse("Error importing roles");
            }
        }

        [HttpPost("applications")]
        public async Task<IActionResult> ImportApplications([FromBody] BulkApplicationImportRequest request)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);

                // Check if user has admin privileges
                if (!User.IsInRole("Admin") && !User.IsInRole("PlatformAdmin"))
                {
                    return Forbid("Only administrators can perform bulk application imports");
                }

                var result = await migrationService.ImportApplicationsAsync(request, userId);

                // Log audit event for application import
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.Create.ToString(),
                    AuditEntityTypes.APPLICATION,
                    description: $"Bulk application import: {result.SuccessfulRecords}/{result.TotalRecords} successful",
                    newValues: $"Applications: {result.TotalRecords}, Success: {result.SuccessfulRecords}, Failed: {result.FailedRecords}",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error importing applications");
                return HttpResponseHelper.CreateErrorResponse("Error importing applications");
            }
        }

        [HttpGet("template/{type}")]
        public async Task<IActionResult> GetTemplate(string type)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);

                // Check if user has admin privileges
                if (!User.IsInRole("Admin") && !User.IsInRole("PlatformAdmin"))
                {
                    return Forbid("Only administrators can access migration templates");
                }

                var template = type.ToUpper() switch
                {
                    "USERS" => GetUserTemplate(),
                    "ROLES" => GetRoleTemplate(),
                    "APPLICATIONS" => GetApplicationTemplate(),
                    _ => null
                };

                if (template == null)
                {
                    return HttpResponseHelper.CreateBadRequestResponse($"Unknown template type: {type}");
                }

                // Log audit event for template download
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.Read.ToString(),
                    AuditEntityTypes.SYSTEM_CONFIG,
                    description: $"Downloaded migration template for {type}",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                return Ok(template);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error getting migration template");
                return HttpResponseHelper.CreateErrorResponse("Error getting migration template");
            }
        }

        private object GetUserTemplate()
        {
            return new
            {
                users = new[]
                {
                    new
                    {
                        username = "example_user",
                        email = "user@example.com",
                        password = "TempPassword123!",
                        firstName = "John",
                        lastName = "Doe",
                        phoneNumber = "123-456-7890",
                        isActive = true,
                        roles = new[] { "User" }
                    }
                },
                overwriteExisting = false,
                sendWelcomeEmails = true
            };
        }

        private object GetRoleTemplate()
        {
            return new
            {
                roles = new[]
                {
                    new
                    {
                        name = "ExampleRole",
                        description = "This is an example role",
                        isActive = true,
                        permissions = new[] { "Read", "Write" }
                    }
                },
                overwriteExisting = false
            };
        }

        private object GetApplicationTemplate()
        {
            return new
            {
                applications = new[]
                {
                    new
                    {
                        name = "Example Application",
                        description = "This is an example application",
                        version = "1.0.0",
                        environment = "Development",
                        tags = "api, web, backend",
                        isActive = true
                    }
                },
                overwriteExisting = false
            };
        }
    }
}