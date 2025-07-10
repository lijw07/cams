namespace cams.Backend.Exceptions
{
    /// <summary>
    /// Base exception class for CAMS application
    /// </summary>
    public abstract class CamsException : Exception
    {
        protected CamsException(string message) : base(message)
        {
        }

        protected CamsException(string message, Exception innerException) : base(message, innerException)
        {
        }

        public abstract int StatusCode { get; }
    }

    /// <summary>
    /// Exception for validation errors
    /// </summary>
    public class ValidationException : CamsException
    {
        public List<string> Errors { get; }
        public override int StatusCode => 400;

        public ValidationException(string message) : base(message)
        {
            Errors = new List<string> { message };
        }

        public ValidationException(List<string> errors) : base("Validation failed")
        {
            Errors = errors;
        }
    }

    /// <summary>
    /// Exception for resource not found errors
    /// </summary>
    public class NotFoundException : CamsException
    {
        public override int StatusCode => 404;

        public NotFoundException(string resource) : base($"{resource} not found")
        {
        }

        public NotFoundException(string resource, object identifier) : base($"{resource} with ID '{identifier}' not found")
        {
        }
    }

    /// <summary>
    /// Exception for business logic errors
    /// </summary>
    public class BusinessException : CamsException
    {
        public override int StatusCode => 400;

        public BusinessException(string message) : base(message)
        {
        }

        public BusinessException(string message, Exception innerException) : base(message, innerException)
        {
        }
    }

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