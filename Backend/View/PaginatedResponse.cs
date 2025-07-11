namespace cams.Backend.View
{
    /// <summary>
    /// Generic paginated response wrapper for API endpoints
    /// </summary>
    /// <typeparam name="T">Type of data being paginated</typeparam>
    public class PaginatedResponse<T>
    {
        public IEnumerable<T> Data { get; set; } = new List<T>();
        public PaginationMetadata Pagination { get; set; } = new PaginationMetadata();
    }

}