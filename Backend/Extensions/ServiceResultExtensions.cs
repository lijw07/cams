using Microsoft.AspNetCore.Mvc;
using cams.Backend.Helpers;

namespace cams.Backend.Extensions
{
    /// <summary>
    /// Service result wrapper for standardized response handling
    /// </summary>
    /// <typeparam name="T">The type of data being returned</typeparam>
    public class ServiceResult<T>
    {
        public bool IsSuccess { get; set; }
        public T? Data { get; set; }
        public string? ErrorMessage { get; set; }
        public List<string> Errors { get; set; } = new();
        public int? StatusCode { get; set; }

        public static ServiceResult<T> Success(T data)
        {
            return new ServiceResult<T>
            {
                IsSuccess = true,
                Data = data
            };
        }

        public static ServiceResult<T> Failure(string errorMessage, int statusCode = 400)
        {
            return new ServiceResult<T>
            {
                IsSuccess = false,
                ErrorMessage = errorMessage,
                StatusCode = statusCode
            };
        }

        public static ServiceResult<T> NotFound(string resource = "Resource")
        {
            return new ServiceResult<T>
            {
                IsSuccess = false,
                ErrorMessage = $"{resource} not found",
                StatusCode = 404
            };
        }

        public static ServiceResult<T> ValidationError(List<string> errors)
        {
            return new ServiceResult<T>
            {
                IsSuccess = false,
                ErrorMessage = "Validation failed",
                Errors = errors,
                StatusCode = 400
            };
        }
    }

    public static class ServiceResultExtensions
    {
        /// <summary>
        /// Converts a ServiceResult to an appropriate IActionResult
        /// </summary>
        /// <typeparam name="T">The type of data in the service result</typeparam>
        /// <param name="result">The service result to convert</param>
        /// <returns>Appropriate IActionResult based on the service result</returns>
        public static IActionResult ToActionResult<T>(this ServiceResult<T> result)
        {
            if (result.IsSuccess)
            {
                return new OkObjectResult(result.Data);
            }

            return result.StatusCode switch
            {
                404 => HttpResponseHelper.CreateNotFoundResponse(result.ErrorMessage ?? "Resource"),
                400 when result.Errors.Any() => HttpResponseHelper.CreateValidationErrorResponse(
                    result.Errors.ToDictionary(e => "error", e => new[] { e })),
                400 => HttpResponseHelper.CreateBadRequestResponse(result.ErrorMessage ?? "Bad request"),
                401 => HttpResponseHelper.CreateUnauthorizedResponse(result.ErrorMessage ?? "Unauthorized"),
                _ => HttpResponseHelper.CreateErrorResponse(result.ErrorMessage ?? "An error occurred", result.StatusCode ?? 500)
            };
        }

        /// <summary>
        /// Converts a ServiceResult to a CreatedAtAction result
        /// </summary>
        /// <typeparam name="T">The type of data in the service result</typeparam>
        /// <param name="result">The service result to convert</param>
        /// <param name="actionName">The action name for the location header</param>
        /// <param name="routeValues">The route values for the location header</param>
        /// <returns>CreatedAtActionResult if successful, otherwise appropriate error result</returns>
        public static IActionResult ToCreatedResult<T>(this ServiceResult<T> result, string actionName, object routeValues)
        {
            if (result.IsSuccess)
            {
                return new CreatedAtActionResult(actionName, null, routeValues, result.Data);
            }

            return result.ToActionResult();
        }
    }
}