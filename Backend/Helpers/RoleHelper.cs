using cams.Backend.Model;
using cams.Backend.Constants;

namespace cams.Backend.Helpers
{
    public static class RoleHelper
    {
        // Use constants from RoleConstants
        public const string PLATFORM_ADMIN = RoleConstants.PLATFORM_ADMIN;
        public const string ADMIN = RoleConstants.ADMIN;
        public const string USER = RoleConstants.USER;

        /// <summary>
        /// Check if user has any of the specified roles
        /// </summary>
        public static bool HasRole(User user, params string[] requiredRoles)
        {
            if (user?.UserRoles == null || !requiredRoles.Any())
                return false;

            var userRoles = user.UserRoles
                .Where(ur => ur.IsActive && ur.Role.IsActive)
                .Select(ur => ur.Role.Name)
                .ToList();

            return requiredRoles.Any(role => userRoles.Contains(role, StringComparer.OrdinalIgnoreCase));
        }

        /// <summary>
        /// Check if user has admin privileges (Admin or PlatformAdmin)
        /// </summary>
        public static bool IsAdmin(User user)
        {
            return HasRole(user, ADMIN, PLATFORM_ADMIN);
        }

        /// <summary>
        /// Check if user has platform admin privileges
        /// </summary>
        public static bool IsPlatformAdmin(User user)
        {
            return HasRole(user, PLATFORM_ADMIN);
        }

        /// <summary>
        /// Get all active roles for a user
        /// </summary>
        public static List<string> GetUserRoles(User user)
        {
            if (user?.UserRoles == null)
                return new List<string>();

            return user.UserRoles
                .Where(ur => ur.IsActive && ur.Role.IsActive)
                .Select(ur => ur.Role.Name)
                .ToList();
        }
    }
}