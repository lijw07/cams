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
    [Route("user")]
    [Authorize]
    public class UserController(
        IUserService userService,
        ILogger<UserController> logger,
        ILoggingService loggingService)
        : ControllerBase
    {
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                var profile = await userService.GetUserProfileAsync(userId);

                if (profile == null)
                {
                    return HttpResponseHelper.CreateNotFoundResponse("User profile");
                }

                // Log audit event for profile retrieval
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.Read.ToString(),
                    AuditEntityTypes.USER,
                    entityId: userId,
                    description: "Retrieved user profile",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                return Ok(profile);
            }
            catch (UnauthorizedAccessException)
            {
                return HttpResponseHelper.CreateUnauthorizedResponse();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving user profile");
                return HttpResponseHelper.CreateErrorResponse("Error retrieving user profile");
            }
        }

        [HttpGet("profile/summary")]
        public async Task<IActionResult> GetProfileSummary()
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                var profile = await userService.GetUserProfileSummaryAsync(userId);

                if (profile == null)
                {
                    return HttpResponseHelper.CreateNotFoundResponse("User profile");
                }

                // Log audit event for profile summary retrieval
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.Read.ToString(),
                    AuditEntityTypes.USER,
                    entityId: userId,
                    description: "Retrieved user profile summary",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                return Ok(profile);
            }
            catch (UnauthorizedAccessException)
            {
                return HttpResponseHelper.CreateUnauthorizedResponse();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving user profile summary");
                return HttpResponseHelper.CreateErrorResponse("Error retrieving user profile summary");
            }
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UserProfileRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return HttpResponseHelper.CreateValidationErrorResponse(
                        ModelState.Where(x => x.Value?.Errors.Count > 0)
                            .ToDictionary(
                                kvp => kvp.Key,
                                kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? Array.Empty<string>()
                            ));
                }

                var userId = UserHelper.GetCurrentUserId(User);
                var user = await userService.GetUserAsync(userId);

                if (user == null)
                {
                    return HttpResponseHelper.CreateNotFoundResponse("User profile");
                }

                // Track changes for email notification
                var changedFields = new List<string>();
                if (user.FirstName != request.FirstName)
                    changedFields.Add($"First Name: {user.FirstName} → {request.FirstName}");
                if (user.LastName != request.LastName)
                    changedFields.Add($"Last Name: {user.LastName} → {request.LastName}");
                if (user.PhoneNumber != request.PhoneNumber)
                    changedFields.Add($"Phone Number: {user.PhoneNumber ?? "(not set)"} → {request.PhoneNumber ?? "(not set)"}");

                var updatedProfile = await userService.UpdateUserProfileAsync(userId, request);

                if (updatedProfile == null)
                {
                    return HttpResponseHelper.CreateNotFoundResponse("User profile");
                }

                // Email notifications have been removed

                // Log audit event for profile update
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.Update.ToString(),
                    AuditEntityTypes.USER,
                    entityId: userId,
                    newValues: $"FirstName: {request.FirstName}, LastName: {request.LastName}, PhoneNumber: {request.PhoneNumber}",
                    description: "Updated user profile",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                return Ok(updatedProfile);
            }
            catch (UnauthorizedAccessException)
            {
                return HttpResponseHelper.CreateUnauthorizedResponse();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error updating user profile");
                return HttpResponseHelper.CreateErrorResponse("Error updating user profile");
            }
        }

        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            try
            {
                logger.LogInformation("Password change request received. ModelState.IsValid: {IsValid}", ModelState.IsValid);
                if (!ModelState.IsValid)
                {
                    logger.LogWarning("Password change validation failed. Errors: {Errors}",
                        string.Join("; ", ModelState.Where(x => x.Value?.Errors.Count > 0)
                            .SelectMany(x => x.Value!.Errors.Select(e => $"{x.Key}: {e.ErrorMessage}"))));
                }

                if (!ModelState.IsValid)
                {
                    return HttpResponseHelper.CreateValidationErrorResponse(
                        ModelState.Where(x => x.Value?.Errors.Count > 0)
                            .ToDictionary(
                                kvp => kvp.Key,
                                kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? Array.Empty<string>()
                            ));
                }

                var userId = UserHelper.GetCurrentUserId(User);
                var result = await userService.ChangePasswordAsync(userId, request);

                if (!result.Success)
                {
                    // Log failed password change attempt
                    await loggingService.LogSecurityEventAsync(
                        SecurityEventType.PasswordChange.ToString(),
                        SecurityStatus.Failure.ToString(),
                        userId: userId,
                        description: "Password change failed",
                        ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                        userAgent: Request.Headers.UserAgent.ToString(),
                        failureReason: result.Message,
                        severity: SecuritySeverity.Warning.ToString()
                    );

                    return HttpResponseHelper.CreateBadRequestResponse(result.Message);
                }

                // Log successful password change
                await loggingService.LogSecurityEventAsync(
                    SecurityEventType.PasswordChange.ToString(),
                    SecurityStatus.Success.ToString(),
                    userId: userId,
                    description: "Password changed successfully",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString(),
                    severity: SecuritySeverity.Information.ToString()
                );

                // Email notifications have been removed

                // Log audit event for password change
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.PasswordChange.ToString(),
                    AuditEntityTypes.USER,
                    entityId: userId,
                    description: "User changed password",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                return Ok(result);
            }
            catch (UnauthorizedAccessException)
            {
                return HttpResponseHelper.CreateUnauthorizedResponse();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error changing password");
                return HttpResponseHelper.CreateErrorResponse("Error changing password");
            }
        }

        [HttpPost("change-email")]
        public async Task<IActionResult> ChangeEmail([FromBody] ChangeEmailRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return HttpResponseHelper.CreateValidationErrorResponse(
                        ModelState.Where(x => x.Value?.Errors.Count > 0)
                            .ToDictionary(
                                kvp => kvp.Key,
                                kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? Array.Empty<string>()
                            ));
                }

                var userId = UserHelper.GetCurrentUserId(User);
                var user = await userService.GetUserAsync(userId);
                var oldEmail = user?.Email;

                var result = await userService.ChangeEmailAsync(userId, request);

                if (!result.Success)
                {
                    // Log failed email change attempt
                    await loggingService.LogSecurityEventAsync(
                        SecurityEventType.EmailChange.ToString(),
                        SecurityStatus.Failure.ToString(),
                        userId: userId,
                        description: "Email change failed",
                        ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                        userAgent: Request.Headers.UserAgent.ToString(),
                        failureReason: result.Message,
                        severity: SecuritySeverity.Warning.ToString()
                    );

                    return HttpResponseHelper.CreateBadRequestResponse(result.Message);
                }

                // Log successful email change
                await loggingService.LogSecurityEventAsync(
                    SecurityEventType.EmailChange.ToString(),
                    SecurityStatus.Success.ToString(),
                    userId: userId,
                    description: "Email changed successfully",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString(),
                    severity: SecuritySeverity.Information.ToString()
                );

                // Email notifications have been removed

                // Log audit event for email change
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.EmailChange.ToString(),
                    AuditEntityTypes.USER,
                    entityId: userId,
                    newValues: $"NewEmail: {request.NewEmail}",
                    description: "User changed email address",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                return Ok(result);
            }
            catch (UnauthorizedAccessException)
            {
                return HttpResponseHelper.CreateUnauthorizedResponse();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error changing email");
                return HttpResponseHelper.CreateErrorResponse("Error changing email");
            }
        }

        [HttpPost("validate-password")]
        public async Task<IActionResult> ValidateCurrentPassword([FromBody] ValidatePasswordRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return HttpResponseHelper.CreateValidationErrorResponse(
                        ModelState.Where(x => x.Value?.Errors.Count > 0)
                            .ToDictionary(
                                kvp => kvp.Key,
                                kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? Array.Empty<string>()
                            ));
                }

                var userId = UserHelper.GetCurrentUserId(User);
                var isValid = await userService.ValidateCurrentPasswordAsync(userId, request.Password);

                // Log audit event for password validation
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.Read.ToString(),
                    AuditEntityTypes.USER,
                    entityId: userId,
                    description: $"Password validation - Result: {(isValid ? "Valid" : "Invalid")}",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                return Ok(new { isValid, message = isValid ? "Password is valid" : "Password is invalid" });
            }
            catch (UnauthorizedAccessException)
            {
                return HttpResponseHelper.CreateUnauthorizedResponse();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error validating password");
                return HttpResponseHelper.CreateErrorResponse("Error validating password");
            }
        }

        [HttpPost("deactivate")]
        public async Task<IActionResult> DeactivateAccount([FromBody] DeactivateAccountRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return HttpResponseHelper.CreateValidationErrorResponse(
                        ModelState.Where(x => x.Value?.Errors.Count > 0)
                            .ToDictionary(
                                kvp => kvp.Key,
                                kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? Array.Empty<string>()
                            ));
                }

                var userId = UserHelper.GetCurrentUserId(User);

                // Validate password before deactivation
                var isValidPassword = await userService.ValidateCurrentPasswordAsync(userId, request.CurrentPassword);
                if (!isValidPassword)
                {
                    // Log failed deactivation attempt
                    await loggingService.LogSecurityEventAsync(
                        SecurityEventType.AccountDeactivation.ToString(),
                        SecurityStatus.Failure.ToString(),
                        userId: userId,
                        description: "Account deactivation failed - invalid password",
                        ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                        userAgent: Request.Headers.UserAgent.ToString(),
                        failureReason: "Invalid password provided",
                        severity: SecuritySeverity.Warning.ToString()
                    );

                    return HttpResponseHelper.CreateBadRequestResponse("Current password is incorrect");
                }

                var success = await userService.DeactivateUserAsync(userId);

                if (!success)
                {
                    return HttpResponseHelper.CreateErrorResponse("Failed to deactivate account");
                }

                // Log successful account deactivation
                await loggingService.LogSecurityEventAsync(
                    SecurityEventType.AccountDeactivation.ToString(),
                    SecurityStatus.Success.ToString(),
                    userId: userId,
                    description: "Account deactivated successfully",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString(),
                    severity: SecuritySeverity.Information.ToString()
                );

                // Email notifications have been removed

                // Log audit event for account deactivation
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.StatusChange.ToString(),
                    AuditEntityTypes.USER,
                    entityId: userId,
                    description: "User account deactivated",
                    newValues: "IsActive: false",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                return Ok(new { message = "Account deactivated successfully" });
            }
            catch (UnauthorizedAccessException)
            {
                return HttpResponseHelper.CreateUnauthorizedResponse();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error deactivating user account");
                return HttpResponseHelper.CreateErrorResponse("Error deactivating user account");
            }
        }

        [HttpGet("check-email/{email}")]
        public async Task<IActionResult> CheckEmailAvailability(string email)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                var isTaken = await userService.IsEmailTakenAsync(email, userId);

                // Log audit event for email availability check
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.Read.ToString(),
                    AuditEntityTypes.USER,
                    description: $"Checked email availability for: {email} - Available: {!isTaken}",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                return Ok(new
                {
                    email,
                    isAvailable = !isTaken,
                    message = isTaken ? "Email is already in use" : "Email is available"
                });
            }
            catch (UnauthorizedAccessException)
            {
                return HttpResponseHelper.CreateUnauthorizedResponse();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error checking email availability");
                return HttpResponseHelper.CreateErrorResponse("Error checking email availability");
            }
        }
    }
}