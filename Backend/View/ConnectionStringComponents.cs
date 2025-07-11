namespace cams.Backend.View
{
    /// <summary>
    /// Parsed components of a connection string
    /// </summary>
    public class ConnectionStringComponents
    {
        public string? Server { get; set; }
        public string? Database { get; set; }
        public string? Username { get; set; }
        public int? Port { get; set; }
        public bool? UseIntegratedSecurity { get; set; }
        public int? ConnectionTimeout { get; set; }
        public int? CommandTimeout { get; set; }
    }
}