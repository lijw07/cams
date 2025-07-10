using cams.Backend.View;
using cams.Backend.Constants;
using System.Text.RegularExpressions;

namespace cams.Backend.Validators
{
    public interface IUserValidator
    {
        ValidationResult ValidateLoginRequest(LoginRequest request);
        ValidationResult ValidateRefreshTokenRequest(RefreshTokenRequest request);
        ValidationResult ValidateEmail(string email);
        ValidationResult ValidatePassword(string password);
        ValidationResult ValidateUsername(string username);
    }

    public class UserValidator : IUserValidator
    {
        private static readonly Regex EmailRegex = new(
            @"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex UsernameRegex = new(
            @"^[a-zA-Z0-9._-]+$",
            RegexOptions.Compiled);

        public ValidationResult ValidateLoginRequest(LoginRequest request)
        {
            var errors = new List<string>();

            if (string.IsNullOrWhiteSpace(request.Username))
                errors.Add("Username is required");
            else
            {
                var usernameValidation = ValidateUsername(request.Username);
                if (!usernameValidation.IsValid)
                    errors.AddRange(usernameValidation.Errors);
            }

            if (string.IsNullOrWhiteSpace(request.Password))
                errors.Add("Password is required");
            else
            {
                var passwordValidation = ValidatePassword(request.Password);
                if (!passwordValidation.IsValid)
                    errors.AddRange(passwordValidation.Errors);
            }

            return new ValidationResult
            {
                IsValid = !errors.Any(),
                ErrorMessage = errors.Any() ? string.Join("; ", errors) : null,
                Errors = errors
            };
        }

        public ValidationResult ValidateRefreshTokenRequest(RefreshTokenRequest request)
        {
            var errors = new List<string>();

            if (string.IsNullOrWhiteSpace(request.Username))
                errors.Add("Username is required");

            if (string.IsNullOrWhiteSpace(request.RefreshToken))
                errors.Add("Refresh token is required");

            return new ValidationResult
            {
                IsValid = !errors.Any(),
                ErrorMessage = errors.Any() ? string.Join("; ", errors) : null,
                Errors = errors
            };
        }

        public ValidationResult ValidateEmail(string email)
        {
            var errors = new List<string>();

            if (string.IsNullOrWhiteSpace(email))
            {
                errors.Add("Email is required");
            }
            else
            {
                if (email.Length > ApplicationConstants.ValidationRules.MAX_EMAIL_LENGTH)
                    errors.Add($"Email cannot exceed {ApplicationConstants.ValidationRules.MAX_EMAIL_LENGTH} characters");

                if (!EmailRegex.IsMatch(email))
                    errors.Add("Email format is invalid");
            }

            return new ValidationResult
            {
                IsValid = !errors.Any(),
                ErrorMessage = errors.Any() ? string.Join("; ", errors) : null,
                Errors = errors
            };
        }

        public ValidationResult ValidatePassword(string password)
        {
            var errors = new List<string>();

            if (string.IsNullOrWhiteSpace(password))
            {
                errors.Add("Password is required");
            }
            else
            {
                if (password.Length < ApplicationConstants.ValidationRules.MIN_PASSWORD_LENGTH)
                    errors.Add($"Password must be at least {ApplicationConstants.ValidationRules.MIN_PASSWORD_LENGTH} characters long");

                if (password.Length > ApplicationConstants.ValidationRules.MAX_PASSWORD_LENGTH)
                    errors.Add($"Password cannot exceed {ApplicationConstants.ValidationRules.MAX_PASSWORD_LENGTH} characters");

                // Additional password strength requirements can be added here
                if (!HasValidPasswordComplexity(password))
                    errors.Add("Password must contain at least one letter and one number");
            }

            return new ValidationResult
            {
                IsValid = !errors.Any(),
                ErrorMessage = errors.Any() ? string.Join("; ", errors) : null,
                Errors = errors
            };
        }

        public ValidationResult ValidateUsername(string username)
        {
            var errors = new List<string>();

            if (string.IsNullOrWhiteSpace(username))
            {
                errors.Add("Username is required");
            }
            else
            {
                if (username.Length > ApplicationConstants.ValidationRules.MAX_USERNAME_LENGTH)
                    errors.Add($"Username cannot exceed {ApplicationConstants.ValidationRules.MAX_USERNAME_LENGTH} characters");

                if (!UsernameRegex.IsMatch(username))
                    errors.Add("Username can only contain letters, numbers, dots, underscores, and hyphens");

                if (username.Length < 3)
                    errors.Add("Username must be at least 3 characters long");
            }

            return new ValidationResult
            {
                IsValid = !errors.Any(),
                ErrorMessage = errors.Any() ? string.Join("; ", errors) : null,
                Errors = errors
            };
        }

        private static bool HasValidPasswordComplexity(string password)
        {
            bool hasLetter = password.Any(char.IsLetter);
            bool hasDigit = password.Any(char.IsDigit);
            
            return hasLetter && hasDigit;
        }
    }
}