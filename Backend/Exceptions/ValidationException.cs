namespace cams.Backend.Exceptions
{
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
}