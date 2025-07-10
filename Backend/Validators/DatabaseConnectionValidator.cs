using cams.Backend.View;
using cams.Backend.Enums;
using cams.Backend.Constants;

namespace cams.Backend.Validators
{
    public interface IDatabaseConnectionValidator
    {
        ValidationResult ValidateCreateRequest(DatabaseConnectionRequest request);
        ValidationResult ValidateUpdateRequest(DatabaseConnectionUpdateRequest request);
        ValidationResult ValidateTestRequest(DatabaseConnectionTestRequest request);
    }

    public class DatabaseConnectionValidator : IDatabaseConnectionValidator
    {
        public ValidationResult ValidateCreateRequest(DatabaseConnectionRequest request)
        {
            var errors = new List<string>();

            if (string.IsNullOrWhiteSpace(request.Name))
                errors.Add("Connection name is required");
            else if (request.Name.Length > ApplicationConstants.ValidationRules.MAX_CONNECTION_NAME_LENGTH)
                errors.Add($"Connection name cannot exceed {ApplicationConstants.ValidationRules.MAX_CONNECTION_NAME_LENGTH} characters");

            // DatabaseType is an enum and cannot be null - validation handled by Required attribute

            if (string.IsNullOrWhiteSpace(request.Server))
                errors.Add("Server is required");

            if (request.Port <= 0 || request.Port > 65535)
                errors.Add("Port must be between 1 and 65535");

            if (string.IsNullOrWhiteSpace(request.Username))
                errors.Add("Username is required");

            if (string.IsNullOrWhiteSpace(request.Password))
                errors.Add("Password is required");

            // Database-specific validations
            ValidateDatabaseSpecificFields(request, errors);

            return new ValidationResult
            {
                IsValid = !errors.Any(),
                ErrorMessage = errors.Any() ? string.Join("; ", errors) : null,
                Errors = errors
            };
        }

        public ValidationResult ValidateUpdateRequest(DatabaseConnectionUpdateRequest request)
        {
            var errors = new List<string>();

            if (request.Id <= 0)
                errors.Add("Connection ID is required and must be greater than 0");

            if (string.IsNullOrWhiteSpace(request.Name))
                errors.Add("Connection name is required");
            else if (request.Name.Length > ApplicationConstants.ValidationRules.MAX_CONNECTION_NAME_LENGTH)
                errors.Add($"Connection name cannot exceed {ApplicationConstants.ValidationRules.MAX_CONNECTION_NAME_LENGTH} characters");

            // DatabaseType is an enum and cannot be null - validation handled by Required attribute

            if (string.IsNullOrWhiteSpace(request.Server))
                errors.Add("Server is required");

            if (request.Port <= 0 || request.Port > 65535)
                errors.Add("Port must be between 1 and 65535");

            return new ValidationResult
            {
                IsValid = !errors.Any(),
                ErrorMessage = errors.Any() ? string.Join("; ", errors) : null,
                Errors = errors
            };
        }

        public ValidationResult ValidateTestRequest(DatabaseConnectionTestRequest request)
        {
            var errors = new List<string>();

            if (request.ConnectionId == null && request.ConnectionDetails == null)
                errors.Add("Either ConnectionId or ConnectionDetails must be provided");

            if (request.ConnectionDetails != null)
            {
                var detailsValidation = ValidateCreateRequest(request.ConnectionDetails);
                if (!detailsValidation.IsValid)
                {
                    errors.AddRange(detailsValidation.Errors);
                }
            }

            return new ValidationResult
            {
                IsValid = !errors.Any(),
                ErrorMessage = errors.Any() ? string.Join("; ", errors) : null,
                Errors = errors
            };
        }

        private static void ValidateDatabaseSpecificFields(DatabaseConnectionRequest request, List<string> errors)
        {
            switch (request.Type)
            {
                case DatabaseType.SqlServer:
                case DatabaseType.MySQL:
                case DatabaseType.PostgreSQL:
                case DatabaseType.Oracle:
                    if (string.IsNullOrWhiteSpace(request.Database))
                        errors.Add("Database name is required for relational databases");
                    break;

                case DatabaseType.MongoDB:
                    if (string.IsNullOrWhiteSpace(request.Database))
                        errors.Add("Database name is required for MongoDB");
                    break;

                case DatabaseType.RestApi:
                case DatabaseType.GraphQL:
                case DatabaseType.WebSocket:
                    if (string.IsNullOrWhiteSpace(request.ConnectionString))
                        errors.Add("Connection string/URL is required for API connections");
                    break;

                case DatabaseType.Custom:
                    if (string.IsNullOrWhiteSpace(request.ConnectionString))
                        errors.Add("Connection string is required for custom connections");
                    break;
            }
        }
    }

    public class ValidationResult
    {
        public bool IsValid { get; set; }
        public string? ErrorMessage { get; set; }
        public List<string> Errors { get; set; } = new();
    }
}