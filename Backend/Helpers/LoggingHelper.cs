using System;
using System.Text.RegularExpressions;

namespace Backend.Helpers
{
    public static class LoggingHelper
    {
        private static readonly Regex SanitizationRegex = new Regex(@"[\r\n\t]", RegexOptions.Compiled);
        private static readonly Regex MultipleSpacesRegex = new Regex(@"\s+", RegexOptions.Compiled);

        /// <summary>
        /// Sanitizes a string value for safe logging by removing newlines and other control characters
        /// </summary>
        public static string? Sanitize(string? input)
        {
            if (string.IsNullOrEmpty(input))
                return input;

            // Remove newlines, carriage returns, and tabs
            var sanitized = SanitizationRegex.Replace(input, " ");
            // Collapse multiple spaces into single spaces
            sanitized = MultipleSpacesRegex.Replace(sanitized, " ");
            return sanitized.Trim();
        }

        /// <summary>
        /// Sanitizes a GUID value for safe logging
        /// </summary>
        public static string Sanitize(Guid input)
        {
            return input.ToString();
        }

        /// <summary>
        /// Sanitizes an object for safe logging by converting to string and removing control characters
        /// </summary>
        public static string? Sanitize(object? input)
        {
            if (input == null)
                return null;

            return Sanitize(input.ToString());
        }

        /// <summary>
        /// Creates a safe log message with sanitized parameters
        /// </summary>
        public static string CreateSafeLogMessage(string template, params object?[] args)
        {
            var sanitizedArgs = new object?[args.Length];
            for (int i = 0; i < args.Length; i++)
            {
                sanitizedArgs[i] = Sanitize(args[i]);
            }

            return string.Format(template, sanitizedArgs);
        }
    }
}