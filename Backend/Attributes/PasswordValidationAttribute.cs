using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace cams.Backend.Attributes
{
    public class PasswordValidationAttribute : ValidationAttribute
    {
        protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
        {
            var password = value as string;

            if (string.IsNullOrEmpty(password))
            {
                return ValidationResult.Success;
            }

            var errors = new List<string>();

            if (password.Length < 8)
            {
                errors.Add("at least 8 characters");
            }

            if (!Regex.IsMatch(password, @"[A-Z]"))
            {
                errors.Add("at least one uppercase letter");
            }

            if (!Regex.IsMatch(password, @"[a-z]"))
            {
                errors.Add("at least one lowercase letter");
            }

            if (!Regex.IsMatch(password, @"\d"))
            {
                errors.Add("at least one digit");
            }

            if (!Regex.IsMatch(password, @"[@$!%*?&]"))
            {
                errors.Add("at least one special character (@$!%*?&)");
            }

            if (errors.Any())
            {
                return new ValidationResult($"Password must contain {string.Join(", ", errors)}");
            }

            return ValidationResult.Success;
        }
    }
}