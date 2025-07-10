namespace cams.Backend.Enums
{
    public enum SecurityEventType
    {
        Login,
        LoginFailure,
        Logout,
        PasswordChange,
        PasswordReset,
        EmailChange,
        AccountLockout,
        UnauthorizedAccess,
        TokenGeneration,
        TokenExpiration,
        PermissionDenied,
        SuspiciousActivity,
        BruteForceAttempt,
        SessionExpired,
        AccountDeactivation,
        RoleChange
    }
}