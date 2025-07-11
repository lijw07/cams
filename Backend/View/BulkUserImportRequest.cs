namespace cams.Backend.View;

public class BulkUserImportRequest
{
    public List<UserImportDto> Users { get; set; } = new List<UserImportDto>();
    public bool OverwriteExisting { get; set; } = false;
    public bool SendWelcomeEmails { get; set; } = true;
}