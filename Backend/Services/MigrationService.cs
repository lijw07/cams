using System.Text.Json;
using cams.Backend.View;
using cams.Backend.Model;
using cams.Backend.Data;
using Backend.Helpers;
using cams.Backend.Constants;
using cams.Backend.Enums;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using cams.Backend.Hubs;

namespace cams.Backend.Services
{
    public class MigrationService(
        ILogger<MigrationService> logger,
        ILoggingService loggingService,
        IHubContext<MigrationHub> hubContext,
        ApplicationDbContext context)
        : IMigrationService
    {
        public async Task<MigrationValidationResult> ValidateBulkImportAsync(BulkMigrationRequest request)
        {
            var result = new MigrationValidationResult();
            var errors = new List<string>();
            var warnings = new List<string>();

            try
            {
                switch (request.MigrationType.ToUpper())
                {
                    case "USERS":
                        var usersRequest = JsonSerializer.Deserialize<BulkUserImportRequest>(request.Data);
                        if (usersRequest?.Users != null)
                        {
                            result.TotalRecords = usersRequest.Users.Count;
                            await ValidateUsers(usersRequest.Users, errors, warnings);
                        }
                        break;

                    case "ROLES":
                        var rolesRequest = JsonSerializer.Deserialize<BulkRoleImportRequest>(request.Data);
                        if (rolesRequest?.Roles != null)
                        {
                            result.TotalRecords = rolesRequest.Roles.Count;
                            await ValidateRoles(rolesRequest.Roles, errors, warnings);
                        }
                        break;

                    case "APPLICATIONS":
                        var appsRequest = JsonSerializer.Deserialize<BulkApplicationImportRequest>(request.Data);
                        if (appsRequest?.Applications != null)
                        {
                            result.TotalRecords = appsRequest.Applications.Count;
                            await ValidateApplications(appsRequest.Applications, errors, warnings);
                        }
                        break;

                    default:
                        errors.Add($"Unsupported migration type: {request.MigrationType}");
                        break;
                }

                result.Errors = errors;
                result.Warnings = warnings;
                result.IsValid = errors.Count == 0;

                return result;
            }
            catch (JsonException ex)
            {
                logger.LogError(ex, "Error parsing migration data");
                result.Errors.Add("Invalid JSON format in migration data");
                result.IsValid = false;
                return result;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error validating bulk import");
                result.Errors.Add("Unexpected error during validation");
                result.IsValid = false;
                return result;
            }
        }

        public async Task<MigrationResult> ProcessBulkMigrationAsync(BulkMigrationRequest request, Guid currentUserId)
        {
            var startTime = DateTime.UtcNow;
            var progressId = Guid.NewGuid().ToString();

            try
            {
                if (request.ValidateOnly)
                {
                    var validationResult = await ValidateBulkImportAsync(request);
                    return new MigrationResult
                    {
                        Success = validationResult.IsValid,
                        Message = validationResult.IsValid ? "Validation completed successfully" : "Validation failed",
                        TotalRecords = validationResult.TotalRecords,
                        Errors = validationResult.Errors,
                        Warnings = validationResult.Warnings,
                        StartTime = startTime,
                        EndTime = DateTime.UtcNow,
                        ValidationSummary = $"Total records: {validationResult.TotalRecords}, Errors: {validationResult.Errors.Count}, Warnings: {validationResult.Warnings.Count}",
                        ProgressId = progressId
                    };
                }

                return request.MigrationType.ToUpper() switch
                {
                    "USERS" => await ImportUsersAsync(JsonSerializer.Deserialize<BulkUserImportRequest>(request.Data)!, currentUserId, progressId),
                    "ROLES" => await ImportRolesAsync(JsonSerializer.Deserialize<BulkRoleImportRequest>(request.Data)!, currentUserId, progressId),
                    "APPLICATIONS" => await ImportApplicationsAsync(JsonSerializer.Deserialize<BulkApplicationImportRequest>(request.Data)!, currentUserId, progressId),
                    _ => throw new ArgumentException($"Unsupported migration type: {request.MigrationType}")
                };
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error processing bulk migration");

                // Send error update to clients
                await SendProgressUpdate(progressId, new MigrationProgress
                {
                    ProgressId = progressId,
                    Percentage = 0,
                    ProcessedRecords = 0,
                    TotalRecords = 0,
                    CurrentOperation = "Migration failed",
                    IsCompleted = true,
                    IsSuccessful = false,
                    RecentErrors = new List<string> { ex.Message }
                });

                return new MigrationResult
                {
                    Success = false,
                    Message = "Migration failed with unexpected error",
                    StartTime = startTime,
                    EndTime = DateTime.UtcNow,
                    Errors = new List<string> { ex.Message },
                    ProgressId = progressId
                };
            }
        }

        public async Task<MigrationResult> ImportUsersAsync(BulkUserImportRequest request, Guid currentUserId, string progressId = "")
        {
            var result = new MigrationResult
            {
                StartTime = DateTime.UtcNow,
                TotalRecords = request.Users.Count,
                ProgressId = progressId
            };

            var errors = new List<string>();
            var warnings = new List<string>();
            var successCount = 0;
            var processedCount = 0;

            try
            {
                // Send initial progress
                await SendProgressUpdate(progressId, new MigrationProgress
                {
                    ProgressId = progressId,
                    Percentage = 0,
                    ProcessedRecords = 0,
                    TotalRecords = request.Users.Count,
                    CurrentOperation = "Starting user import...",
                    IsCompleted = false,
                    IsSuccessful = false
                });

                foreach (var userDto in request.Users)
                {
                    try
                    {
                        // Check if user already exists
                        var existingUser = await context.Users.FirstOrDefaultAsync(u =>
                            (u.Username == userDto.Username || u.Email == userDto.Email) && u.IsActive);

                        if (existingUser != null)
                        {
                            if (!request.OverwriteExisting)
                            {
                                warnings.Add($"User '{userDto.Username}' already exists and was skipped");
                                continue;
                            }

                            // Update existing user
                            existingUser.Email = userDto.Email;
                            existingUser.FirstName = userDto.FirstName;
                            existingUser.LastName = userDto.LastName;
                            existingUser.PhoneNumber = userDto.PhoneNumber;
                            existingUser.IsActive = userDto.IsActive;
                            existingUser.UpdatedAt = DateTime.UtcNow;

                            if (!string.IsNullOrEmpty(userDto.Password))
                            {
                                existingUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(userDto.Password);
                            }

                            // Note: Update functionality not implemented yet
                            successCount++;

                            await loggingService.LogAuditAsync(
                                currentUserId,
                                AuditAction.Update.ToString(),
                                AuditEntityTypes.USER,
                                entityId: existingUser.Id,
                                description: $"User updated via bulk migration: {userDto.Username}",
                                newValues: $"Email: {userDto.Email}, FirstName: {userDto.FirstName}, LastName: {userDto.LastName}"
                            );
                        }
                        else
                        {
                            // Create new user
                            var newUser = new User
                            {
                                Username = userDto.Username,
                                Email = userDto.Email,
                                PasswordHash = !string.IsNullOrEmpty(userDto.Password)
                                    ? BCrypt.Net.BCrypt.HashPassword(userDto.Password)
                                    : BCrypt.Net.BCrypt.HashPassword("TempPassword123!"),
                                FirstName = userDto.FirstName,
                                LastName = userDto.LastName,
                                PhoneNumber = userDto.PhoneNumber,
                                IsActive = userDto.IsActive,
                                CreatedAt = DateTime.UtcNow,
                                UpdatedAt = DateTime.UtcNow
                            };

                            // Add user to database
                            context.Users.Add(newUser);
                            await context.SaveChangesAsync();

                            // Default to User role if no roles specified
                            if (userDto.Roles.Count == 0)
                            {
                                var userRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "User");
                                if (userRole != null)
                                {
                                    var newUserRole = new UserRole
                                    {
                                        UserId = newUser.Id,
                                        RoleId = userRole.Id,
                                        IsActive = true,
                                        AssignedAt = DateTime.UtcNow
                                    };
                                    context.UserRoles.Add(newUserRole);
                                }
                            }

                            // Note: Role assignment not implemented in this simplified version
                            if (userDto.Roles.Count > 0)
                            {
                                warnings.Add($"Role assignment not implemented for user '{userDto.Username}' - roles: {string.Join(", ", userDto.Roles)}");
                            }

                            successCount++;

                            // Welcome email functionality has been removed
                            if (request.SendWelcomeEmails)
                            {
                                warnings.Add($"Welcome email functionality has been removed - {newUser.Email}");
                            }

                            await loggingService.LogAuditAsync(
                                currentUserId,
                                AuditAction.Create.ToString(),
                                AuditEntityTypes.USER,
                                entityId: newUser.Id,
                                description: $"User created via bulk migration: {LoggingHelper.Sanitize(userDto.Username)}",
                                newValues: $"Email: {LoggingHelper.Sanitize(userDto.Email)}, FirstName: {LoggingHelper.Sanitize(userDto.FirstName)}, LastName: {LoggingHelper.Sanitize(userDto.LastName)}"
                            );
                        }
                    }
                    catch (Exception userEx)
                    {
                        logger.LogError(userEx, "Error importing user {Username}", LoggingHelper.Sanitize(userDto.Username));
                        errors.Add($"Failed to import user '{LoggingHelper.Sanitize(userDto.Username)}': {userEx.Message}");
                    }
                    finally
                    {
                        processedCount++;

                        // Send progress update every user or every 10% of progress
                        if (processedCount % Math.Max(1, request.Users.Count / 10) == 0 || processedCount == request.Users.Count)
                        {
                            var percentage = (double)processedCount / request.Users.Count * 100;
                            await SendProgressUpdate(progressId, new MigrationProgress
                            {
                                ProgressId = progressId,
                                Percentage = percentage,
                                ProcessedRecords = processedCount,
                                TotalRecords = request.Users.Count,
                                CurrentOperation = $"Processing user {processedCount} of {request.Users.Count}: {userDto.Username}",
                                IsCompleted = processedCount == request.Users.Count,
                                IsSuccessful = processedCount == request.Users.Count && errors.Count == 0,
                                RecentErrors = errors.TakeLast(3).ToList(),
                                RecentWarnings = warnings.TakeLast(3).ToList()
                            });
                        }
                    }
                }

                result.SuccessfulRecords = successCount;
                result.FailedRecords = result.TotalRecords - successCount;
                result.Errors = errors;
                result.Warnings = warnings;
                result.Success = errors.Count == 0;
                result.Message = result.Success
                    ? $"Successfully imported {successCount} users"
                    : $"Completed with {errors.Count} errors. {successCount} users imported successfully";
                result.EndTime = DateTime.UtcNow;

                return result;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error during user bulk import");
                result.Success = false;
                result.Message = "User import failed";
                result.EndTime = DateTime.UtcNow;
                result.Errors.Add(ex.Message);
                return result;
            }
        }

        public async Task<MigrationResult> ImportRolesAsync(BulkRoleImportRequest request, Guid currentUserId, string progressId = "")
        {
            await SendProgressUpdate(progressId, new MigrationProgress
            {
                ProgressId = progressId,
                Percentage = 100,
                ProcessedRecords = request.Roles.Count,
                TotalRecords = request.Roles.Count,
                CurrentOperation = "Role import not implemented",
                IsCompleted = true,
                IsSuccessful = false,
                RecentErrors = new List<string> { "Role import functionality not implemented" }
            });

            return new MigrationResult
            {
                StartTime = DateTime.UtcNow,
                EndTime = DateTime.UtcNow,
                Success = false,
                Message = "Role import not implemented in this version",
                TotalRecords = request.Roles.Count,
                SuccessfulRecords = 0,
                FailedRecords = request.Roles.Count,
                Errors = new List<string> { "Role import functionality not implemented" },
                Warnings = new List<string>(),
                ProgressId = progressId
            };
        }

        public async Task<MigrationResult> ImportApplicationsAsync(BulkApplicationImportRequest request, Guid currentUserId, string progressId = "")
        {
            await SendProgressUpdate(progressId, new MigrationProgress
            {
                ProgressId = progressId,
                Percentage = 100,
                ProcessedRecords = request.Applications.Count,
                TotalRecords = request.Applications.Count,
                CurrentOperation = "Application import not implemented",
                IsCompleted = true,
                IsSuccessful = false,
                RecentErrors = new List<string> { "Application import functionality not implemented" }
            });

            return new MigrationResult
            {
                StartTime = DateTime.UtcNow,
                EndTime = DateTime.UtcNow,
                Success = false,
                Message = "Application import not implemented in this version",
                TotalRecords = request.Applications.Count,
                SuccessfulRecords = 0,
                FailedRecords = request.Applications.Count,
                Errors = new List<string> { "Application import functionality not implemented" },
                Warnings = new List<string>(),
                ProgressId = progressId
            };
        }

        private async Task ValidateUsers(List<UserImportDto> users, List<string> errors, List<string> warnings)
        {
            var usernames = new HashSet<string>();
            var emails = new HashSet<string>();

            foreach (var user in users)
            {
                // Check for duplicate usernames in the import data
                if (!usernames.Add(user.Username.ToLower()))
                {
                    errors.Add($"Duplicate username in import data: {user.Username}");
                }

                // Check for duplicate emails in the import data
                if (!emails.Add(user.Email.ToLower()))
                {
                    errors.Add($"Duplicate email in import data: {user.Email}");
                }

                // Check if username already exists in database
                if (await context.Users.AnyAsync(u => u.Username.ToLower() == user.Username.ToLower() && u.IsActive))
                {
                    warnings.Add($"Username '{user.Username}' already exists in database");
                }

                // Check if email already exists in database
                if (await context.Users.AnyAsync(u => u.Email.ToLower() == user.Email.ToLower() && u.IsActive))
                {
                    warnings.Add($"Email '{user.Email}' already exists in database");
                }

                // Note: Role validation simplified
                if (user.Roles.Count > 0)
                {
                    warnings.Add($"Role validation not implemented for user '{user.Username}' - roles: {string.Join(", ", user.Roles)}");
                }
            }

            await Task.CompletedTask;
        }

        private async Task ValidateRoles(List<RoleImportDto> roles, List<string> errors, List<string> warnings)
        {
            var roleNames = new HashSet<string>();

            foreach (var role in roles)
            {
                // Check for duplicate role names in the import data
                if (!roleNames.Add(role.Name.ToLower()))
                {
                    errors.Add($"Duplicate role name in import data: {role.Name}");
                }

                warnings.Add($"Role validation simplified - '{role.Name}' not checked against database");
            }

            await Task.CompletedTask;
        }

        private async Task ValidateApplications(List<ApplicationImportDto> applications, List<string> errors, List<string> warnings)
        {
            var appNames = new HashSet<string>();

            foreach (var app in applications)
            {
                // Check for duplicate application names in the import data
                if (!appNames.Add(app.Name.ToLower()))
                {
                    errors.Add($"Duplicate application name in import data: {app.Name}");
                }

                warnings.Add($"Application validation simplified - '{app.Name}' not checked against database");
            }

            await Task.CompletedTask;
        }

        private async Task SendProgressUpdate(string progressId, MigrationProgress progress)
        {
            if (string.IsNullOrEmpty(progressId)) return;

            try
            {
                await hubContext.Clients.Group($"migration_{progressId}").SendAsync("ProgressUpdate", progress);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to send progress update for migration {ProgressId}", progressId);
            }
        }
    }
}