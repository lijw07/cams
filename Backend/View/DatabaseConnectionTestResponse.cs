namespace cams.Backend.View
{
    public class DatabaseConnectionTestResponse
    {
        public bool IsSuccessful { get; set; }
        public string Message { get; set; } = string.Empty;
        public DateTime TestedAt { get; set; }
        public TimeSpan ResponseTime { get; set; }
        public string? ErrorCode { get; set; }
        public string? ErrorDetails { get; set; }
        public Dictionary<string, object>? AdditionalInfo { get; set; }
    }
}