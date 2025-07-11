using Microsoft.EntityFrameworkCore;
using cams.Backend.Data;
using cams.Backend.Model;
using cams.Backend.View;
using cams.Backend.Constants;
using NCrontab;

namespace cams.Backend.Services
{
    /// <summary>
    /// Service for managing connection test schedules
    /// </summary>
    public class ConnectionTestScheduleService(
        ApplicationDbContext context,
        ILogger<ConnectionTestScheduleService> logger)
        : IConnectionTestScheduleService
    {
        public async Task<IEnumerable<ConnectionTestScheduleResponse>> GetUserSchedulesAsync(Guid userId)
        {
            try
            {
                var schedules = await context.ConnectionTestSchedules
                    .Include(s => s.Application)
                    .Where(s => s.Application.UserId == userId)
                    .Select(s => new ConnectionTestScheduleResponse
                    {
                        Id = s.Id,
                        ApplicationId = s.ApplicationId,
                        ApplicationName = s.Application.Name,
                        CronExpression = s.CronExpression,
                        IsEnabled = s.IsEnabled,
                        LastRunTime = s.LastRunTime,
                        NextRunTime = s.NextRunTime,
                        LastRunStatus = s.LastRunStatus,
                        LastRunMessage = s.LastRunMessage,
                        LastRunDuration = s.LastRunDuration,
                        CreatedAt = s.CreatedAt,
                        UpdatedAt = s.UpdatedAt
                    })
                    .ToListAsync();

                return schedules;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving connection test schedules for user {UserId}", userId);
                throw;
            }
        }

        public async Task<ConnectionTestScheduleResponse?> GetScheduleByApplicationIdAsync(Guid applicationId, Guid userId)
        {
            try
            {
                var schedule = await context.ConnectionTestSchedules
                    .Include(s => s.Application)
                    .Where(s => s.ApplicationId == applicationId && s.Application.UserId == userId)
                    .Select(s => new ConnectionTestScheduleResponse
                    {
                        Id = s.Id,
                        ApplicationId = s.ApplicationId,
                        ApplicationName = s.Application.Name,
                        CronExpression = s.CronExpression,
                        IsEnabled = s.IsEnabled,
                        LastRunTime = s.LastRunTime,
                        NextRunTime = s.NextRunTime,
                        LastRunStatus = s.LastRunStatus,
                        LastRunMessage = s.LastRunMessage,
                        LastRunDuration = s.LastRunDuration,
                        CreatedAt = s.CreatedAt,
                        UpdatedAt = s.UpdatedAt
                    })
                    .FirstOrDefaultAsync();

                return schedule;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving connection test schedule for application {ApplicationId} and user {UserId}", applicationId, userId);
                throw;
            }
        }

        public async Task<ConnectionTestScheduleResponse?> GetScheduleByIdAsync(Guid scheduleId, Guid userId)
        {
            try
            {
                var schedule = await context.ConnectionTestSchedules
                    .Include(s => s.Application)
                    .Where(s => s.Id == scheduleId && s.Application.UserId == userId)
                    .Select(s => new ConnectionTestScheduleResponse
                    {
                        Id = s.Id,
                        ApplicationId = s.ApplicationId,
                        ApplicationName = s.Application.Name,
                        CronExpression = s.CronExpression,
                        IsEnabled = s.IsEnabled,
                        LastRunTime = s.LastRunTime,
                        NextRunTime = s.NextRunTime,
                        LastRunStatus = s.LastRunStatus,
                        LastRunMessage = s.LastRunMessage,
                        LastRunDuration = s.LastRunDuration,
                        CreatedAt = s.CreatedAt,
                        UpdatedAt = s.UpdatedAt
                    })
                    .FirstOrDefaultAsync();

                return schedule;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error retrieving connection test schedule {ScheduleId} for user {UserId}", scheduleId, userId);
                throw;
            }
        }

        public async Task<ConnectionTestScheduleResponse> UpsertScheduleAsync(ConnectionTestScheduleRequest request, Guid userId)
        {
            try
            {
                // Verify user owns the application
                var application = await context.Applications
                    .Where(a => a.Id == request.ApplicationId && a.UserId == userId)
                    .FirstOrDefaultAsync();

                if (application == null)
                {
                    throw new UnauthorizedAccessException("Application not found or access denied");
                }

                // Validate cron expression
                var cronValidation = await ValidateCronExpressionAsync(request.CronExpression);
                if (!cronValidation.IsValid)
                {
                    throw new ArgumentException($"Invalid cron expression: {cronValidation.ErrorMessage}");
                }

                // Check if schedule already exists for this application
                var existingSchedule = await context.ConnectionTestSchedules
                    .FirstOrDefaultAsync(s => s.ApplicationId == request.ApplicationId);

                ConnectionTestSchedule schedule;
                
                if (existingSchedule != null)
                {
                    // Update existing schedule
                    existingSchedule.CronExpression = request.CronExpression;
                    existingSchedule.IsEnabled = request.IsEnabled;
                    existingSchedule.NextRunTime = CalculateNextRunTime(request.CronExpression);
                    existingSchedule.UpdatedAt = DateTime.UtcNow;
                    schedule = existingSchedule;
                }
                else
                {
                    // Create new schedule
                    schedule = new ConnectionTestSchedule
                    {
                        ApplicationId = request.ApplicationId,
                        CronExpression = request.CronExpression,
                        IsEnabled = request.IsEnabled,
                        NextRunTime = CalculateNextRunTime(request.CronExpression),
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    context.ConnectionTestSchedules.Add(schedule);
                }

                await context.SaveChangesAsync();

                return new ConnectionTestScheduleResponse
                {
                    Id = schedule.Id,
                    ApplicationId = schedule.ApplicationId,
                    ApplicationName = application.Name,
                    CronExpression = schedule.CronExpression,
                    IsEnabled = schedule.IsEnabled,
                    LastRunTime = schedule.LastRunTime,
                    NextRunTime = schedule.NextRunTime,
                    LastRunStatus = schedule.LastRunStatus,
                    LastRunMessage = schedule.LastRunMessage,
                    LastRunDuration = schedule.LastRunDuration,
                    CreatedAt = schedule.CreatedAt,
                    UpdatedAt = schedule.UpdatedAt
                };
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error upserting connection test schedule for application {ApplicationId} and user {UserId}", request.ApplicationId, userId);
                throw;
            }
        }

        public async Task<ConnectionTestScheduleResponse?> UpdateScheduleAsync(ConnectionTestScheduleUpdateRequest request, Guid userId)
        {
            try
            {
                var schedule = await context.ConnectionTestSchedules
                    .Include(s => s.Application)
                    .Where(s => s.Id == request.Id && s.Application.UserId == userId)
                    .FirstOrDefaultAsync();

                if (schedule == null)
                {
                    return null;
                }

                // Validate cron expression
                var cronValidation = await ValidateCronExpressionAsync(request.CronExpression);
                if (!cronValidation.IsValid)
                {
                    throw new ArgumentException($"Invalid cron expression: {cronValidation.ErrorMessage}");
                }

                schedule.CronExpression = request.CronExpression;
                schedule.IsEnabled = request.IsEnabled;
                schedule.NextRunTime = CalculateNextRunTime(request.CronExpression);
                schedule.UpdatedAt = DateTime.UtcNow;

                await context.SaveChangesAsync();

                return new ConnectionTestScheduleResponse
                {
                    Id = schedule.Id,
                    ApplicationId = schedule.ApplicationId,
                    ApplicationName = schedule.Application.Name,
                    CronExpression = schedule.CronExpression,
                    IsEnabled = schedule.IsEnabled,
                    LastRunTime = schedule.LastRunTime,
                    NextRunTime = schedule.NextRunTime,
                    LastRunStatus = schedule.LastRunStatus,
                    LastRunMessage = schedule.LastRunMessage,
                    LastRunDuration = schedule.LastRunDuration,
                    CreatedAt = schedule.CreatedAt,
                    UpdatedAt = schedule.UpdatedAt
                };
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error updating connection test schedule {ScheduleId} for user {UserId}", request.Id, userId);
                throw;
            }
        }

        public async Task<bool> DeleteScheduleAsync(Guid scheduleId, Guid userId)
        {
            try
            {
                var schedule = await context.ConnectionTestSchedules
                    .Include(s => s.Application)
                    .Where(s => s.Id == scheduleId && s.Application.UserId == userId)
                    .FirstOrDefaultAsync();

                if (schedule == null)
                {
                    return false;
                }

                context.ConnectionTestSchedules.Remove(schedule);
                await context.SaveChangesAsync();

                return true;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error deleting connection test schedule {ScheduleId} for user {UserId}", scheduleId, userId);
                throw;
            }
        }

        public async Task<ConnectionTestScheduleResponse?> ToggleScheduleAsync(Guid scheduleId, bool isEnabled, Guid userId)
        {
            try
            {
                var schedule = await context.ConnectionTestSchedules
                    .Include(s => s.Application)
                    .Where(s => s.Id == scheduleId && s.Application.UserId == userId)
                    .FirstOrDefaultAsync();

                if (schedule == null)
                {
                    return null;
                }

                schedule.IsEnabled = isEnabled;
                schedule.UpdatedAt = DateTime.UtcNow;

                await context.SaveChangesAsync();

                return new ConnectionTestScheduleResponse
                {
                    Id = schedule.Id,
                    ApplicationId = schedule.ApplicationId,
                    ApplicationName = schedule.Application.Name,
                    CronExpression = schedule.CronExpression,
                    IsEnabled = schedule.IsEnabled,
                    LastRunTime = schedule.LastRunTime,
                    NextRunTime = schedule.NextRunTime,
                    LastRunStatus = schedule.LastRunStatus,
                    LastRunMessage = schedule.LastRunMessage,
                    LastRunDuration = schedule.LastRunDuration,
                    CreatedAt = schedule.CreatedAt,
                    UpdatedAt = schedule.UpdatedAt
                };
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error toggling connection test schedule {ScheduleId} for user {UserId}", scheduleId, userId);
                throw;
            }
        }

        public Task<CronValidationResponse> ValidateCronExpressionAsync(string expression)
        {
            try
            {
                // Use NCrontab library for cron validation
                var crontabSchedule = CrontabSchedule.Parse(expression);
                var nextOccurrence = crontabSchedule.GetNextOccurrence(DateTime.UtcNow);

                var result = new CronValidationResponse
                {
                    IsValid = true,
                    Description = GetCronDescription(expression),
                    NextRunTime = nextOccurrence
                };
                return Task.FromResult(result);
            }
            catch (Exception ex)
            {
                var result = new CronValidationResponse
                {
                    IsValid = false,
                    ErrorMessage = ex.Message
                };
                return Task.FromResult(result);
            }
        }

        public DateTime? CalculateNextRunTime(string cronExpression)
        {
            try
            {
                var crontabSchedule = CrontabSchedule.Parse(cronExpression);
                return crontabSchedule.GetNextOccurrence(DateTime.UtcNow);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to calculate next run time for cron expression: {CronExpression}", cronExpression);
                return null;
            }
        }

        public async Task UpdateScheduleRunStatusAsync(Guid scheduleId, string status, string? message = null, TimeSpan? duration = null)
        {
            try
            {
                var schedule = await context.ConnectionTestSchedules
                    .FirstOrDefaultAsync(s => s.Id == scheduleId);

                if (schedule != null)
                {
                    schedule.LastRunTime = DateTime.UtcNow;
                    schedule.LastRunStatus = status;
                    schedule.LastRunMessage = message;
                    schedule.LastRunDuration = duration;
                    schedule.NextRunTime = CalculateNextRunTime(schedule.CronExpression);
                    schedule.UpdatedAt = DateTime.UtcNow;

                    await context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error updating schedule run status for schedule {ScheduleId}", scheduleId);
                throw;
            }
        }

        private string GetCronDescription(string cronExpression)
        {
            // Simple cron description logic - could be enhanced with a proper cron description library
            var parts = cronExpression.Split(' ');
            if (parts.Length < 5) return "Invalid cron expression";

            var minute = parts[0];
            var hour = parts[1];
            var day = parts[2];
            var month = parts[3];
            var dayOfWeek = parts[4];

            if (minute == "*" && hour == "*" && day == "*" && month == "*" && dayOfWeek == "*")
            {
                return "Every minute";
            }
            else if (minute != "*" && hour == "*" && day == "*" && month == "*" && dayOfWeek == "*")
            {
                return $"Every hour at minute {minute}";
            }
            else if (minute != "*" && hour != "*" && day == "*" && month == "*" && dayOfWeek == "*")
            {
                return $"Daily at {hour}:{minute.PadLeft(2, '0')}";
            }
            else if (minute != "*" && hour != "*" && day == "*" && month == "*" && dayOfWeek != "*")
            {
                return $"Weekly on day {dayOfWeek} at {hour}:{minute.PadLeft(2, '0')}";
            }
            else if (minute != "*" && hour != "*" && day != "*" && month == "*" && dayOfWeek == "*")
            {
                return $"Monthly on day {day} at {hour}:{minute.PadLeft(2, '0')}";
            }

            return "Custom schedule";
        }
    }
}