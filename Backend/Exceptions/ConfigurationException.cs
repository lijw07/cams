namespace cams.Backend.Exceptions
{
    /// <summary>
    /// Exception for configuration errors
    /// </summary>
    public class ConfigurationException : CamsException
    {
        public override int StatusCode => 500;

        public ConfigurationException(string message) : base(message)
        {
        }

        public ConfigurationException(string message, Exception innerException) : base(message, innerException)
        {
        }
    }
}