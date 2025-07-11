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
}