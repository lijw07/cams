namespace cams.Backend.Constants
{
    public static class ApplicationConstants
    {
        public static class ErrorMessages
        {
            public const string INVALID_CREDENTIALS = "Invalid username or password";
            public const string USER_NOT_FOUND = "User not found";
            public const string CONNECTION_NOT_FOUND = "Connection not found";
            public const string APPLICATION_NOT_FOUND = "Application not found";
            public const string APPLICATION_ID_MISMATCH = "Application ID mismatch";
            public const string UNAUTHORIZED_ACCESS = "Unauthorized access";
            public const string VALIDATION_FAILED = "Validation failed";
            public const string CONNECTION_ID_MISMATCH = "Connection ID mismatch";
            public const string REFRESH_TOKEN_REQUIRED = "Refresh token is required";
            public const string INVALID_REFRESH_TOKEN = "Invalid refresh token";
        }

        public static class SuccessMessages
        {
            public const string LOGIN_SUCCESSFUL = "Login successful";
            public const string LOGOUT_SUCCESSFUL = "Logged out successfully";
            public const string CONNECTION_CREATED = "Database connection created successfully";
            public const string CONNECTION_UPDATED = "Database connection updated successfully";
            public const string CONNECTION_DELETED = "Database connection deleted successfully";
            public const string CONNECTION_ACTIVATED = "Connection activated successfully";
            public const string CONNECTION_DEACTIVATED = "Connection deactivated successfully";
            public const string TOKEN_VALID = "Token is valid";
        }

        public static class LogMessages
        {
            public const string USER_LOGIN_SUCCESS = "User {Username} logged in successfully";
            public const string USER_LOGIN_FAILED = "Authentication failed for username: {Username}";
            public const string USER_LOGOUT_SUCCESS = "User logged out successfully";
            public const string CONNECTION_CREATED = "Database connection created for user {UserId}";
            public const string CONNECTION_UPDATED = "Database connection {ConnectionId} updated for user {UserId}";
            public const string CONNECTION_DELETED = "Database connection {ConnectionId} deleted for user {UserId}";
            public const string CONNECTION_TEST_SUCCESS = "Connection test successful for user {UserId}";
            public const string CONNECTION_TEST_FAILED = "Connection test failed for user {UserId}";
        }

        public static class ConfigurationKeys
        {
            public const string JWT_SECRET = "JWT_SECRET_KEY";
            public const string JWT_ISSUER = "JWT_ISSUER";
            public const string JWT_AUDIENCE = "JWT_AUDIENCE";
            public const string JWT_EXPIRES_IN_MINUTES = "JWT_EXPIRES_IN_MINUTES";
            public const string JWT_REFRESH_EXPIRES_IN_DAYS = "JWT_REFRESH_EXPIRES_IN_DAYS";
            public const string DB_CONNECTION_STRING = "DefaultConnection";
        }

        public static class CookieNames
        {
            public const string REFRESH_TOKEN = "refreshToken";
        }

        public static class ClaimTypes
        {
            public const string USER_ID = System.Security.Claims.ClaimTypes.NameIdentifier;
            public const string USERNAME = System.Security.Claims.ClaimTypes.Name;
            public const string EMAIL = System.Security.Claims.ClaimTypes.Email;
        }

        public static class HttpHeaders
        {
            public const string AUTHORIZATION = "Authorization";
            public const string BEARER_PREFIX = "Bearer ";
        }

        public static class ValidationRules
        {
            public const int MIN_PASSWORD_LENGTH = 6;
            public const int MAX_PASSWORD_LENGTH = 100;
            public const int MAX_USERNAME_LENGTH = 50;
            public const int MAX_EMAIL_LENGTH = 255;
            public const int MAX_CONNECTION_NAME_LENGTH = 100;
        }
    }
}