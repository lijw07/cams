namespace cams.Backend.Exceptions
{
    /// <summary>
    /// Exception for database connection errors
    /// </summary>
    public class DatabaseConnectionException : CamsException
    {
        public override int StatusCode => 500;

        public DatabaseConnectionException(string message) : base(message)
        {
        }

        public DatabaseConnectionException(string message, Exception innerException) : base(message, innerException)
        {
        }
    }
}