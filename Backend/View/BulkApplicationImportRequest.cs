namespace cams.Backend.View;

public class BulkApplicationImportRequest
{
    public List<ApplicationImportDto> Applications { get; set; } = new List<ApplicationImportDto>();
    public bool OverwriteExisting { get; set; } = false;
}