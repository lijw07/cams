using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace cams.Backend.Attributes
{
    public class PhoneNumberValidationAttribute : ValidationAttribute
    {
        protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
        {
            var phoneNumber = value as string;
            
            // If phone number is null or empty, it's valid (optional field)
            if (string.IsNullOrWhiteSpace(phoneNumber))
            {
                return ValidationResult.Success;
            }

            // Basic phone number validation - accepts common formats
            // Allows digits, spaces, hyphens, parentheses, and + for international
            var phonePattern = @"^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$";
            
            if (Regex.IsMatch(phoneNumber, phonePattern))
            {
                return ValidationResult.Success;
            }

            return new ValidationResult(ErrorMessage ?? "Invalid phone number format");
        }
    }
}