namespace cams.Backend.Exceptions
{
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
}