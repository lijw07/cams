using Microsoft.AspNetCore.Mvc;

namespace cams.Backend.Helpers
{
    public static class HttpResponseHelper
    {
        /// <summary>
        /// Creates a standardized error response
        /// </summary>
        /// <param name="message">Error message</param>
        /// <param name="statusCode">HTTP status code</param>
        /// <returns>ObjectResult with error details</returns>
        public static ObjectResult CreateErrorResponse(string message, int statusCode = 500)
        {
            return new ObjectResult(new { message })
            {
                StatusCode = statusCode
            };
        }

        /// <summary>
        /// Creates a standardized success response
        /// </summary>
        /// <param name="data">Response data</param>
        /// <param name="message">Success message</param>
        /// <returns>OkObjectResult with success details</returns>
        public static OkObjectResult CreateSuccessResponse<T>(T data, string? message = null)
        {
            var response = message != null
                ? new { data, message }
                : (object?)data;

            return new OkObjectResult(response);
        }

        /// <summary>
        /// Creates a standardized not found response
        /// </summary>
        /// <param name="resource">Name of the resource that was not found</param>
        /// <returns>NotFoundObjectResult</returns>
        public static NotFoundObjectResult CreateNotFoundResponse(string resource)
        {
            return new NotFoundObjectResult(new { message = $"{resource} not found" });
        }

        /// <summary>
        /// Creates a standardized bad request response
        /// </summary>
        /// <param name="message">Error message</param>
        /// <returns>BadRequestObjectResult</returns>
        public static BadRequestObjectResult CreateBadRequestResponse(string message)
        {
            return new BadRequestObjectResult(new { message });
        }

        /// <summary>
        /// Creates a standardized validation error response
        /// </summary>
        /// <param name="errors">Validation errors</param>
        /// <returns>BadRequestObjectResult with validation errors</returns>
        public static BadRequestObjectResult CreateValidationErrorResponse(IDictionary<string, string[]> errors)
        {
            return new BadRequestObjectResult(new { message = "Validation failed", errors });
        }

        /// <summary>
        /// Creates a standardized unauthorized response
        /// </summary>
        /// <param name="message">Unauthorized message</param>
        /// <returns>UnauthorizedObjectResult</returns>
        public static UnauthorizedObjectResult CreateUnauthorizedResponse(string message = "Unauthorized access")
        {
            return new UnauthorizedObjectResult(new { message });
        }
    }
}