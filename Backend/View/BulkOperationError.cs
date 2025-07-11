
namespace cams.Backend.View
{
    /// <summary>
    /// Error details for failed bulk operations
    /// </summary>
    public class BulkOperationError
    {
        public Guid Id { get; set; }
        public string Error { get; set; } = string.Empty;
    }
}