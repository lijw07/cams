using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using cams.Backend.Helpers;

namespace cams.Backend.Extensions
{
    public static class ControllerExtensions
    {
        /// <summary>
        /// Creates a standardized validation error response from ModelState
        /// </summary>
        /// <param name="controller">The controller instance</param>
        /// <param name="modelState">The ModelState to extract errors from</param>
        /// <returns>BadRequestObjectResult with validation errors</returns>
        public static IActionResult CreateValidationErrorResponse(this ControllerBase controller, ModelStateDictionary modelState)
        {
            var errors = modelState
                .Where(x => x.Value?.Errors.Count > 0)
                .ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? Array.Empty<string>()
                );

            return HttpResponseHelper.CreateValidationErrorResponse(errors);
        }

        /// <summary>
        /// Gets the current user ID from the controller's User claims
        /// </summary>
        /// <param name="controller">The controller instance</param>
        /// <returns>The user ID</returns>
        /// <exception cref="UnauthorizedAccessException">Thrown when user ID is not found or invalid</exception>
        public static int GetCurrentUserId(this ControllerBase controller)
        {
            return UserHelper.GetCurrentUserId(controller.User);
        }

        /// <summary>
        /// Gets the current username from the controller's User claims
        /// </summary>
        /// <param name="controller">The controller instance</param>
        /// <returns>The username or null if not found</returns>
        public static string? GetCurrentUsername(this ControllerBase controller)
        {
            return UserHelper.GetCurrentUsername(controller.User);
        }
    }
}