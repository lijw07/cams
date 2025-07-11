using cams.Backend.Model;
using cams.Backend.View;

namespace cams.Backend.Services
{
    /// <summary>
    /// Interface for managing connection test schedules
    /// </summary>
    public interface IConnectionTestScheduleService
    {
        /// <summary>
        /// Get all schedules for a user
        /// </summary>
        Task<IEnumerable<ConnectionTestScheduleResponse>> GetUserSchedulesAsync(Guid userId);
        
        /// <summary>
        /// Get schedule by application ID for a user
        /// </summary>
        Task<ConnectionTestScheduleResponse?> GetScheduleByApplicationIdAsync(Guid applicationId, Guid userId);
        
        /// <summary>
        /// Get schedule by ID for a user
        /// </summary>
        Task<ConnectionTestScheduleResponse?> GetScheduleByIdAsync(Guid scheduleId, Guid userId);
        
        /// <summary>
        /// Create or update a schedule (upsert operation)
        /// </summary>
        Task<ConnectionTestScheduleResponse> UpsertScheduleAsync(ConnectionTestScheduleRequest request, Guid userId);
        
        /// <summary>
        /// Update an existing schedule
        /// </summary>
        Task<ConnectionTestScheduleResponse?> UpdateScheduleAsync(ConnectionTestScheduleUpdateRequest request, Guid userId);
        
        /// <summary>
        /// Delete a schedule
        /// </summary>
        Task<bool> DeleteScheduleAsync(Guid scheduleId, Guid userId);
        
        /// <summary>
        /// Toggle schedule enabled status
        /// </summary>
        Task<ConnectionTestScheduleResponse?> ToggleScheduleAsync(Guid scheduleId, bool isEnabled, Guid userId);
        
        /// <summary>
        /// Validate a cron expression
        /// </summary>
        Task<CronValidationResponse> ValidateCronExpressionAsync(string expression);
        
        /// <summary>
        /// Calculate next run time for a cron expression
        /// </summary>
        DateTime? CalculateNextRunTime(string cronExpression);
        
        /// <summary>
        /// Update schedule run status
        /// </summary>
        Task UpdateScheduleRunStatusAsync(Guid scheduleId, string status, string? message = null, TimeSpan? duration = null);
    }
}