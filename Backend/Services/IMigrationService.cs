using cams.Backend.View;

namespace cams.Backend.Services
{
    public interface IMigrationService
    {
        Task<MigrationValidationResult> ValidateBulkImportAsync(BulkMigrationRequest request);
        Task<MigrationResult> ImportUsersAsync(BulkUserImportRequest request, Guid currentUserId, string progressId = "");
        Task<MigrationResult> ImportRolesAsync(BulkRoleImportRequest request, Guid currentUserId, string progressId = "");
        Task<MigrationResult> ImportApplicationsAsync(BulkApplicationImportRequest request, Guid currentUserId, string progressId = "");
        Task<MigrationResult> ProcessBulkMigrationAsync(BulkMigrationRequest request, Guid currentUserId);
    }
}