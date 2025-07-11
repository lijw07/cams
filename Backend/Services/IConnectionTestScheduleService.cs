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
        Task<IEnumerable<ConnectionTestScheduleResponse>> GetUserSchedulesAsync(int userId);
        
        /// <summary>
        /// Get schedule by application ID for a user
        /// </summary>
        Task<ConnectionTestScheduleResponse?> GetScheduleByApplicationIdAsync(int applicationId, int userId);
        
        /// <summary>
        /// Get schedule by ID for a user
        /// </summary>
        Task<ConnectionTestScheduleResponse?> GetScheduleByIdAsync(int scheduleId, int userId);
        
        /// <summary>
        /// Create or update a schedule (upsert operation)
        /// </summary>
        Task<ConnectionTestScheduleResponse> UpsertScheduleAsync(ConnectionTestScheduleRequest request, int userId);
        
        /// <summary>
        /// Update an existing schedule
        /// </summary>
        Task<ConnectionTestScheduleResponse?> UpdateScheduleAsync(ConnectionTestScheduleUpdateRequest request, int userId);
        
        /// <summary>
        /// Delete a schedule
        /// </summary>
        Task<bool> DeleteScheduleAsync(int scheduleId, int userId);
        
        /// <summary>
        /// Toggle schedule enabled status
        /// </summary>
        Task<ConnectionTestScheduleResponse?> ToggleScheduleAsync(int scheduleId, bool isEnabled, int userId);
        
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
        Task UpdateScheduleRunStatusAsync(int scheduleId, string status, string? message = null, TimeSpan? duration = null);
    }
}