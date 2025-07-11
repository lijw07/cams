namespace cams.Backend.View;

/// <summary>
/// Enhanced pagination metadata following REST API best practices
/// </summary>
public class PaginationMetadata
{
    public int CurrentPage { get; set; }
    public int PerPage { get; set; }
    public int TotalItems { get; set; }
    public int TotalPages { get; set; }
    public bool HasNext { get; set; }
    public bool HasPrevious { get; set; }
}