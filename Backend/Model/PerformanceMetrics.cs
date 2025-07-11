namespace cams.Backend.Model
{
    public class PerformanceMetrics
    {
        public double AverageResponseTime { get; set; }
        public double MedianResponseTime { get; set; }
        public double P95ResponseTime { get; set; }
        public double P99ResponseTime { get; set; }
        public int TotalRequests { get; set; }
        public int SlowRequests { get; set; }
        public int ErrorRequests { get; set; }
        public double ErrorRate { get; set; }
        public double ThroughputPerMinute { get; set; }
        public Dictionary<string, int> ResponseTimeDistribution { get; set; } = new();
        public Dictionary<string, double> OperationAverages { get; set; } = new();
    }
}