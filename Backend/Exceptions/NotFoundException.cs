namespace cams.Backend.Exceptions
{
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
}