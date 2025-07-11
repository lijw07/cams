using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace cams.Backend.Attributes
{
    public class PhoneNumberValidationAttribute : ValidationAttribute
    {
        protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
        {
            var phoneNumber = value as string;
            
            if (string.IsNullOrWhiteSpace(phoneNumber))
            {
                return ValidationResult.Success;
            }
            
            var phonePattern = @"^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$";
            
            if (Regex.IsMatch(phoneNumber, phonePattern))
            {
                return ValidationResult.Success;
            }

            return new ValidationResult(ErrorMessage ?? "Invalid phone number format");
        }
    }
}