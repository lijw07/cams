namespace cams.Backend.View
{
    public class BulkDeleteRoleResult
    {
        public List<int> Successful { get; set; } = new();
        public List<BulkDeleteRoleError> Failed { get; set; } = new();
        public string Message { get; set; } = string.Empty;
        public int TotalRequested { get; set; }
        public int SuccessfulCount { get; set; }
        public int FailedCount { get; set; }
    }

    public class BulkDeleteRoleError
    {
        public int Id { get; set; }
        public string Error { get; set; } = string.Empty;
    }
}