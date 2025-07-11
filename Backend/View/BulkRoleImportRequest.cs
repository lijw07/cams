namespace cams.Backend.View;

public class BulkRoleImportRequest
{
    public List<RoleImportDto> Roles { get; set; } = new List<RoleImportDto>();
    public bool OverwriteExisting { get; set; } = false;
}