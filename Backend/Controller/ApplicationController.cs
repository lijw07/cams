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
    [Route("applications")]
    [Authorize]
    public class ApplicationController(
        IApplicationService applicationService,
        ILogger<ApplicationController> logger,
        ILoggingService loggingService)
        : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetApplications([FromQuery] PaginationRequest? pagination)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                logger.LogInformation("User {UserId} requested applications list", userId);
                
                if (pagination != null)
                {
                    // Return paginated results
                    var paginatedApplications = await applicationService.GetUserApplicationsPaginatedAsync(userId, pagination);
                    
                    logger.LogInformation("Retrieved {ApplicationCount} of {TotalCount} applications for user {UserId} (page {PageNumber})", 
                        paginatedApplications.Items.Count(), paginatedApplications.TotalCount, userId, pagination.PageNumber);
                    
                    // Log audit event for application list retrieval
                    await loggingService.LogAuditAsync(
                        userId,
                        AuditAction.Read.ToString(),
                        AuditEntityTypes.APPLICATION,
                        description: $"Retrieved {paginatedApplications.Items.Count()} of {paginatedApplications.TotalCount} applications (page {pagination.PageNumber})",
                        ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                        userAgent: Request.Headers.UserAgent.ToString()
                    );
                    
                    return Ok(paginatedApplications);
                }
                else
                {
                    // Return all applications (backward compatibility)
                    var applications = await applicationService.GetUserApplicationsAsync(userId);
                    
                    logger.LogInformation("Retrieved {ApplicationCount} applications for user {UserId}", applications.Count(), userId);
                    
                    // Log audit event for application list retrieval
                    await loggingService.LogAuditAsync(
                        userId,
                        AuditAction.Read.ToString(),
                        AuditEntityTypes.APPLICATION,
                        description: $"Retrieved {applications.Count()} applications",
                        ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                        userAgent: Request.Headers.UserAgent.ToString()
                    );
                    
                    return Ok(applications);
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving applications for user {UserId}", UserHelper.GetCurrentUserId(User));
                return HttpResponseHelper.CreateErrorResponse("Error retrieving applications");
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetApplication(int id)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                logger.LogInformation("User {UserId} requested application {ApplicationId}", userId, id);
                
                var application = await applicationService.GetApplicationByIdAsync(id, userId);
                
                if (application == null)
                {
                    logger.LogWarning("Application {ApplicationId} not found for user {UserId}", id, userId);
                    return HttpResponseHelper.CreateNotFoundResponse("Application");
                }

                // Update last accessed time
                await applicationService.UpdateLastAccessedAsync(id, userId);

                logger.LogInformation("Successfully retrieved application {ApplicationId} for user {UserId}", id, userId);
                
                // Log audit event for application retrieval
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.Read.ToString(),
                    AuditEntityTypes.APPLICATION,
                    entityId: id,
                    entityName: application.Name,
                    description: "Retrieved application details",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );
                
                return Ok(application);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving application {ApplicationId} for user {UserId}", id, UserHelper.GetCurrentUserId(User));
                return HttpResponseHelper.CreateErrorResponse( "Error retrieving application");
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateApplication([FromBody] ApplicationRequest request)
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
                logger.LogInformation("User {UserId} creating new application: {ApplicationName}", userId, request.Name);
                
                var application = await applicationService.CreateApplicationAsync(request, userId);
                
                logger.LogInformation("Successfully created application {ApplicationId} ({ApplicationName}) for user {UserId}", 
                    application.Id, application.Name, userId);
                
                // Log audit event for application creation
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.Create.ToString(),
                    AuditEntityTypes.APPLICATION,
                    entityId: application.Id,
                    entityName: application.Name,
                    newValues: $"Name: {application.Name}, Description: {request.Description}",
                    description: "Created new application",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                // Log system event for application creation
                await loggingService.LogSystemEventAsync(
                    "ApplicationCreated",
                    "Information",
                    "Application",
                    $"New application created: {application.Name}",
                    details: $"ApplicationId: {application.Id}, Name: {application.Name}, Environment: {request.Environment}, IsActive: {request.IsActive}, CreatedBy: {userId}",
                    userId: userId,
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    httpMethod: HttpContext.Request.Method,
                    requestPath: HttpContext.Request.Path,
                    statusCode: 201
                );
                
                return CreatedAtAction(nameof(GetApplication), new { id = application.Id }, application);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error creating application {ApplicationName} for user {UserId}", request.Name, UserHelper.GetCurrentUserId(User));
                return HttpResponseHelper.CreateErrorResponse( "Error creating application");
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateApplication(int id, [FromBody] ApplicationUpdateRequest request)
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

                if (id != request.Id)
                {
                    return HttpResponseHelper.CreateBadRequestResponse(ApplicationConstants.ErrorMessages.APPLICATION_ID_MISMATCH);
                }

                var userId = UserHelper.GetCurrentUserId(User);
                logger.LogInformation("User {UserId} updating application {ApplicationId}: {ApplicationName}", userId, id, request.Name);
                
                var application = await applicationService.UpdateApplicationAsync(request, userId);
                
                if (application == null)
                {
                    logger.LogWarning("Application {ApplicationId} not found for update by user {UserId}", id, userId);
                    return HttpResponseHelper.CreateNotFoundResponse("Application");
                }

                logger.LogInformation("Successfully updated application {ApplicationId} ({ApplicationName}) for user {UserId}", 
                    application.Id, application.Name, userId);

                // Log audit event for application update
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.Update.ToString(),
                    AuditEntityTypes.APPLICATION,
                    entityId: application.Id,
                    entityName: application.Name,
                    newValues: $"Name: {application.Name}, Description: {request.Description}",
                    description: "Updated application",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                return Ok(application);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error updating application {ApplicationId} for user {UserId}", id, UserHelper.GetCurrentUserId(User));
                return HttpResponseHelper.CreateErrorResponse( "Error updating application");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteApplication(int id)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                logger.LogInformation("User {UserId} deleting application {ApplicationId}", userId, id);
                
                var deleted = await applicationService.DeleteApplicationAsync(id, userId);
                
                if (!deleted)
                {
                    logger.LogWarning("Application {ApplicationId} not found for deletion by user {UserId}", id, userId);
                    return HttpResponseHelper.CreateNotFoundResponse("Application");
                }

                logger.LogInformation("Successfully deleted application {ApplicationId} for user {UserId}", id, userId);
                
                // Log audit event for application deletion
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.Delete.ToString(),
                    AuditEntityTypes.APPLICATION,
                    entityId: id,
                    description: "Deleted application",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                // Log system event for application deletion
                await loggingService.LogSystemEventAsync(
                    "ApplicationDeleted",
                    "Information",
                    "Application",
                    $"Application deleted",
                    details: $"ApplicationId: {id}, DeletedBy: {userId}",
                    userId: userId,
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    httpMethod: HttpContext.Request.Method,
                    requestPath: HttpContext.Request.Path,
                    statusCode: 204
                );
                
                return NoContent();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error deleting application {ApplicationId} for user {UserId}", id, UserHelper.GetCurrentUserId(User));
                return HttpResponseHelper.CreateErrorResponse( "Error deleting application");
            }
        }

        [HttpPatch("{id}/toggle")]
        public async Task<IActionResult> ToggleApplicationStatus(int id, [FromBody] ToggleApplicationStatusRequest request)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                logger.LogInformation("User {UserId} toggling application {ApplicationId} status to {Status}", 
                    userId, id, request.IsActive ? "active" : "inactive");
                
                var updated = await applicationService.ToggleApplicationStatusAsync(id, userId, request.IsActive);
                
                if (!updated)
                {
                    logger.LogWarning("Application {ApplicationId} not found for status toggle by user {UserId}", id, userId);
                    return HttpResponseHelper.CreateNotFoundResponse("Application");
                }

                logger.LogInformation("Successfully toggled application {ApplicationId} status to {Status} for user {UserId}", 
                    id, request.IsActive ? "active" : "inactive", userId);

                // Log audit event for application status toggle
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.StatusChange.ToString(),
                    AuditEntityTypes.APPLICATION,
                    entityId: id,
                    description: $"Application status changed to {(request.IsActive ? "active" : "inactive")}",
                    newValues: $"IsActive: {request.IsActive}",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                return Ok(new { message = $"Application {(request.IsActive ? "activated" : "deactivated")} successfully" });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error toggling application status for {ApplicationId} for user {UserId}", id, UserHelper.GetCurrentUserId(User));
                return HttpResponseHelper.CreateErrorResponse( "Error toggling application status");
            }
        }

        [HttpGet("{id}/connections")]
        public async Task<IActionResult> GetApplicationConnections(int id)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                logger.LogInformation("User {UserId} requested connections for application {ApplicationId}", userId, id);
                
                var connections = await applicationService.GetApplicationConnectionsAsync(id, userId);
                
                if (!connections.Any())
                {
                    // Check if application exists
                    var application = await applicationService.GetApplicationByIdAsync(id, userId);
                    if (application == null)
                    {
                        logger.LogWarning("Application {ApplicationId} not found when retrieving connections for user {UserId}", id, userId);
                        return HttpResponseHelper.CreateNotFoundResponse("Application");
                    }
                }

                logger.LogInformation("Retrieved {ConnectionCount} connections for application {ApplicationId} for user {UserId}", 
                    connections.Count(), id, userId);

                // Log audit event for application connections retrieval
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.Read.ToString(),
                    AuditEntityTypes.APPLICATION,
                    entityId: id,
                    description: $"Retrieved {connections.Count()} connections for application",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                return Ok(connections);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving connections for application {ApplicationId} for user {UserId}", id, UserHelper.GetCurrentUserId(User));
                return HttpResponseHelper.CreateErrorResponse( "Error retrieving application connections");
            }
        }

        [HttpPost("{id}/access")]
        public async Task<IActionResult> UpdateLastAccessed(int id)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                logger.LogInformation("User {UserId} updating last accessed time for application {ApplicationId}", userId, id);
                
                var updated = await applicationService.UpdateLastAccessedAsync(id, userId);
                
                if (!updated)
                {
                    logger.LogWarning("Application {ApplicationId} not found for last access update by user {UserId}", id, userId);
                    return HttpResponseHelper.CreateNotFoundResponse("Application");
                }

                logger.LogInformation("Successfully updated last accessed time for application {ApplicationId} for user {UserId}", id, userId);
                
                // Log audit event for last accessed update
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.Update.ToString(),
                    AuditEntityTypes.APPLICATION,
                    entityId: id,
                    description: "Updated last accessed time",
                    newValues: $"LastAccessedAt: {DateTime.UtcNow}",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );
                
                return Ok(new { message = "Last accessed time updated" });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error updating last accessed time for application {ApplicationId} for user {UserId}", 
                    id, UserHelper.GetCurrentUserId(User));
                return HttpResponseHelper.CreateErrorResponse("Error updating last accessed time");
            }
        }

        [HttpPost("with-connection")]
        public async Task<IActionResult> CreateApplicationWithConnection([FromBody] ApplicationWithConnectionRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Where(x => x.Value?.Errors.Count > 0)
                        .ToDictionary(
                            kvp => kvp.Key,
                            kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? []
                        );
                    
                    logger.LogWarning("Invalid model state for CreateApplicationWithConnection. Errors: {Errors}", 
                        System.Text.Json.JsonSerializer.Serialize(errors));
                    
                    return HttpResponseHelper.CreateValidationErrorResponse(errors);
                }

                var userId = UserHelper.GetCurrentUserId(User);
                logger.LogInformation("User {UserId} creating new application with connection: {ApplicationName}", userId, request.ApplicationName);
                logger.LogInformation("Request data: ApplicationName={ApplicationName}, ConnectionName={ConnectionName}, DatabaseType={DatabaseType}, Server={Server}", 
                    request.ApplicationName, request.ConnectionName, request.DatabaseType, request.Server);
                
                var response = await applicationService.CreateApplicationWithConnectionAsync(request, userId);
                
                logger.LogInformation("Successfully created application {ApplicationId} ({ApplicationName}) with connection {ConnectionId} ({ConnectionName}) for user {UserId}", 
                    response.Application.Id, response.Application.Name, response.DatabaseConnection.Id, response.DatabaseConnection.Name, userId);
                
                // Log audit event for combined creation
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.Create.ToString(),
                    AuditEntityTypes.APPLICATION,
                    entityId: response.Application.Id,
                    entityName: response.Application.Name,
                    newValues: $"Application: {response.Application.Name}, Connection: {response.DatabaseConnection.Name}",
                    description: "Created application with database connection",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );
                
                return CreatedAtAction(nameof(GetApplication), new { id = response.Application.Id }, response);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error creating application with connection {ApplicationName} for user {UserId}", request.ApplicationName, UserHelper.GetCurrentUserId(User));
                return HttpResponseHelper.CreateErrorResponse( "Error creating application with connection");
            }
        }

        [HttpPut("{id}/with-connection")]
        public async Task<IActionResult> UpdateApplicationWithConnection(int id, [FromBody] ApplicationWithConnectionUpdateRequest request)
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

                if (id != request.ApplicationId)
                {
                    return HttpResponseHelper.CreateBadRequestResponse("Application ID mismatch");
                }

                var userId = UserHelper.GetCurrentUserId(User);
                logger.LogInformation("User {UserId} updating application {ApplicationId} with connection {ConnectionId}", 
                    userId, request.ApplicationId, request.ConnectionId);
                
                var response = await applicationService.UpdateApplicationWithConnectionAsync(request, userId);
                
                if (response == null)
                {
                    logger.LogWarning("Application {ApplicationId} or connection {ConnectionId} not found for update by user {UserId}", 
                        request.ApplicationId, request.ConnectionId, userId);
                    return HttpResponseHelper.CreateNotFoundResponse("Application or connection");
                }

                logger.LogInformation("Successfully updated application {ApplicationId} ({ApplicationName}) with connection {ConnectionId} ({ConnectionName}) for user {UserId}", 
                    response.Application.Id, response.Application.Name, response.DatabaseConnection.Id, response.DatabaseConnection.Name, userId);

                // Log audit event for combined update
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.Update.ToString(),
                    AuditEntityTypes.APPLICATION,
                    entityId: response.Application.Id,
                    entityName: response.Application.Name,
                    newValues: $"Application: {response.Application.Name}, Connection: {response.DatabaseConnection.Name}",
                    description: "Updated application with database connection",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );

                return Ok(response);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error updating application {ApplicationId} with connection for user {UserId}", id, UserHelper.GetCurrentUserId(User));
                return HttpResponseHelper.CreateErrorResponse( "Error updating application with connection");
            }
        }

        [HttpGet("{id}/with-primary-connection")]
        public async Task<IActionResult> GetApplicationWithPrimaryConnection(int id)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                logger.LogInformation("User {UserId} requested application {ApplicationId} with primary connection", userId, id);
                
                var response = await applicationService.GetApplicationWithPrimaryConnectionAsync(id, userId);
                
                if (response == null)
                {
                    logger.LogWarning("Application {ApplicationId} with primary connection not found for user {UserId}", id, userId);
                    return HttpResponseHelper.CreateNotFoundResponse("Application or primary connection");
                }

                logger.LogInformation("Successfully retrieved application {ApplicationId} with primary connection for user {UserId}", id, userId);
                
                // Log audit event for retrieval
                await loggingService.LogAuditAsync(
                    userId,
                    AuditAction.Read.ToString(),
                    AuditEntityTypes.APPLICATION,
                    entityId: id,
                    entityName: response.Application.Name,
                    description: "Retrieved application with primary connection",
                    ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                    userAgent: Request.Headers.UserAgent.ToString()
                );
                
                return Ok(response);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving application {ApplicationId} with primary connection for user {UserId}", id, UserHelper.GetCurrentUserId(User));
                return HttpResponseHelper.CreateErrorResponse( "Error retrieving application with connection");
            }
        }

    }
}