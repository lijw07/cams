namespace cams.Backend.Constants
{
    public static class RoleConstants
    {
        public const string PLATFORM_ADMIN = "PlatformAdmin";
        public const string ADMIN = "Admin";
        public const string USER = "User";
        
        public static readonly string[] DefaultRoles = new[]
        {
            PLATFORM_ADMIN,
            ADMIN,
            USER
        };
        
        public static readonly Dictionary<string, string> RoleDescriptions = new()
        {
            { PLATFORM_ADMIN, "Platform-wide administrator with full system access" },
            { ADMIN, "Administrator with management capabilities within assigned applications" },
            { USER, "Standard user with basic access permissions" }
        };
    }
}