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
    [Route("auth")]
    public class LoginController(IAuthenticationService authenticationService, ILogger<LoginController> logger, ILoggingService loggingService)
        : ControllerBase
    {
        [HttpPost("authenticate")]
        [AllowAnonymous]
        public async Task<IActionResult> Authenticate([FromBody] LoginRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var response = await authenticationService.AuthenticateAsync(request);
                
                if (response == null)
                {
                    logger.LogWarning(ApplicationConstants.LogMessages.USER_LOGIN_FAILED, request.Username);
                    
                    // Log security event for failed login
                    await loggingService.LogSecurityEventAsync(
                        SecurityEventType.LoginFailure.ToString(),
                        SecurityStatus.Failure.ToString(),
                        username: request.Username,
                        description: "Login attempt failed - invalid credentials",
                        ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                        userAgent: Request.Headers.UserAgent.ToString(),
                        failureReason: "Invalid username or password",
                        severity: SecuritySeverity.Warning.ToString()
                    );
                    
                    return HttpResponseHelper.CreateUnauthorizedResponse(ApplicationConstants.ErrorMessages.INVALID_CREDENTIALS);
                }

                logger.LogInformation(ApplicationConstants.LogMessages.USER_LOGIN_SUCCESS, response.Username);
                
                // Log successful login security event
                await loggingService.LogSecurityEventAsync(
                    SecurityEventType.Login.ToString(),
                    SecurityStatus.Success.ToString(),
                    userId: response.UserId,
                    username: response.Username,
                    description: "User logged in successfully",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString(),
                    severity: SecuritySeverity.Information.ToString()
                );
                
                // Log audit event for login
                await loggingService.LogAuditAsync(
                    response.UserId,
                    AuditAction.Login.ToString(),
                    AuditEntityTypes.AUTH_SESSION,
                    description: "User authentication successful",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );
                
                // Set refresh token in HTTP-only cookie for better security
                Response.Cookies.Append(ApplicationConstants.CookieNames.REFRESH_TOKEN, response.RefreshToken, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Strict,
                    Expires = DateTime.UtcNow.AddDays(7)
                });

                return Ok(response);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error during authentication for username: {Username}", request.Username);
                return HttpResponseHelper.CreateErrorResponse("An error occurred during authentication");
            }
        }

        [HttpPost("refresh-token")]
        [AllowAnonymous]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
        {
            try
            {
                var refreshToken = Request.Cookies[ApplicationConstants.CookieNames.REFRESH_TOKEN] ?? request.RefreshToken;
                
                if (string.IsNullOrEmpty(refreshToken))
                {
                    return HttpResponseHelper.CreateBadRequestResponse(ApplicationConstants.ErrorMessages.REFRESH_TOKEN_REQUIRED);
                }

                var isValid = await authenticationService.ValidateRefreshTokenAsync(request.Username, refreshToken);
                
                if (!isValid)
                {
                    return HttpResponseHelper.CreateUnauthorizedResponse(ApplicationConstants.ErrorMessages.INVALID_REFRESH_TOKEN);
                }

                // Generate new tokens through service
                var refreshResult = await authenticationService.RefreshTokenAsync(request.Username, refreshToken);
                if (refreshResult == null)
                {
                    // Log failed token refresh
                    await loggingService.LogSecurityEventAsync(
                        SecurityEventType.TokenExpiration.ToString(),
                        SecurityStatus.Failure.ToString(),
                        username: request.Username,
                        description: "Token refresh failed - user not found",
                        ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                        userAgent: Request.Headers.UserAgent.ToString(),
                        failureReason: "User not found during token refresh",
                        severity: SecuritySeverity.Warning.ToString()
                    );
                    
                    return HttpResponseHelper.CreateUnauthorizedResponse(ApplicationConstants.ErrorMessages.USER_NOT_FOUND);
                }

                // Log successful token refresh
                await loggingService.LogSecurityEventAsync(
                    SecurityEventType.TokenGeneration.ToString(),
                    SecurityStatus.Success.ToString(),
                    userId: refreshResult.UserId,
                    username: refreshResult.Username,
                    description: "Token refreshed successfully",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString(),
                    severity: SecuritySeverity.Information.ToString()
                );

                Response.Cookies.Append(ApplicationConstants.CookieNames.REFRESH_TOKEN, refreshResult.RefreshToken, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Strict,
                    Expires = DateTime.UtcNow.AddDays(7)
                });

                return Ok(refreshResult);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error during token refresh");
                return HttpResponseHelper.CreateErrorResponse("An error occurred during token refresh");
            }
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            try
            {
                // Clear the refresh token cookie
                Response.Cookies.Delete(ApplicationConstants.CookieNames.REFRESH_TOKEN);
                
                var userId = UserHelper.GetCurrentUserId(User);
                var username = UserHelper.GetCurrentUsername(User);
                
                logger.LogInformation(ApplicationConstants.LogMessages.USER_LOGOUT_SUCCESS);
                
                // Log security event for logout
                await loggingService.LogSecurityEventAsync(
                    SecurityEventType.Logout.ToString(),
                    SecurityStatus.Success.ToString(),
                    userId: userId,
                    username: username,
                    description: "User logged out successfully",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString(),
                    severity: SecuritySeverity.Information.ToString()
                );
                
                // Log audit event for logout
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.Logout.ToString(),
                    AuditEntityTypes.AUTH_SESSION,
                    description: "User logged out",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );
                
                return HttpResponseHelper.CreateSuccessResponse(new { }, ApplicationConstants.SuccessMessages.LOGOUT_SUCCESSFUL);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error during logout");
                return HttpResponseHelper.CreateErrorResponse("An error occurred during logout");
            }
        }

        [HttpGet("validate")]
        [Authorize]
        public async Task<IActionResult> ValidateToken()
        {
            var userId = UserHelper.GetCurrentUserId(User);
            var username = UserHelper.GetCurrentUsername(User);
            
            // Log audit event for token validation
            await loggingService.LogAuditAsync(
                userId,
                AuditAction.Read.ToString(),
                AuditEntityTypes.AUTH_SESSION,
                description: "Token validation request",
                ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                userAgent: Request.Headers.UserAgent.ToString()
            );
            
            return Ok(new { 
                isValid = true, 
                username = username,
                message = ApplicationConstants.SuccessMessages.TOKEN_VALID
            });
        }
    }

}