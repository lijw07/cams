using Microsoft.AspNetCore.Mvc;
using cams.Backend.Helpers;

namespace cams.Backend.Controller
{
    /// <summary>
    /// Base controller with common functionality for all CAMS controllers
    /// </summary>
    public abstract class BaseController : ControllerBase
    {
        /// <summary>
        /// Validates ModelState and returns appropriate error response if invalid
        /// </summary>
        /// <returns>Validation error response if ModelState is invalid, null otherwise</returns>
        protected IActionResult? ValidateModelState()
        {
            if (!ModelState.IsValid)
            {
                return HttpResponseHelper.CreateValidationErrorResponse(
                    ModelState.Where(x => x.Value?.Errors.Count > 0)
                        .ToDictionary(
                            kvp => kvp.Key,
                            kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? Array.Empty<string>()
                        ));
            }
            return null;
        }

        /// <summary>
        /// Validates ModelState and returns simple BadRequest if invalid
        /// </summary>
        /// <returns>BadRequest response if ModelState is invalid, null otherwise</returns>
        protected IActionResult? ValidateModelStateSimple()
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            return null;
        }
    }
}