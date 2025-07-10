using System.Security.Claims;

namespace cams.Backend.Helpers
{
    public static class UserHelper
    {
        /// <summary>
        /// Extracts the current user ID from the claims principal
        /// </summary>
        /// <param name="user">The claims principal from the controller context</param>
        /// <returns>The user ID</returns>
        /// <exception cref="UnauthorizedAccessException">Thrown when user ID is not found or invalid</exception>
        public static int GetCurrentUserId(ClaimsPrincipal user)
        {
            var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                throw new UnauthorizedAccessException("User ID not found in token");
            }
            return userId;
        }

        /// <summary>
        /// Gets the current username from the claims principal
        /// </summary>
        /// <param name="user">The claims principal from the controller context</param>
        /// <returns>The username or null if not found</returns>
        public static string? GetCurrentUsername(ClaimsPrincipal user)
        {
            return user.FindFirst(ClaimTypes.Name)?.Value;
        }

        /// <summary>
        /// Gets the current user email from the claims principal
        /// </summary>
        /// <param name="user">The claims principal from the controller context</param>
        /// <returns>The email or null if not found</returns>
        public static string? GetCurrentUserEmail(ClaimsPrincipal user)
        {
            return user.FindFirst(ClaimTypes.Email)?.Value;
        }

        /// <summary>
        /// Checks if the user has a specific role
        /// </summary>
        /// <param name="user">The claims principal from the controller context</param>
        /// <param name="role">The role to check for</param>
        /// <returns>True if user has the role, false otherwise</returns>
        public static bool HasRole(ClaimsPrincipal user, string role)
        {
            return user.IsInRole(role);
        }
    }
}