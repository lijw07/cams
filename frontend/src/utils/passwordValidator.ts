import { PASSWORD_POLICY } from '../config/security';

/**
 * Common weak passwords to check against
 */
const COMMON_PASSWORDS = [
  'password', 'password123', '123456', '12345678', 'qwerty', 'abc123',
  'password1', 'password!', 'admin', 'letmein', 'welcome', '123456789',
  'qwerty123', '1q2w3e4r', 'admin123', 'root', 'toor', 'pass', 'test',
  'guest', 'master', 'dragon', 'football', 'baseball', 'monkey'
];

/**
 * Result object returned by password validation functions
 * Contains validation status, error messages, and strength assessment
 * 
 * @interface PasswordValidationResult
 * @property isValid - Whether the password meets all requirements
 * @property errors - Array of validation error messages
 * @property strength - Qualitative strength assessment
 * @property score - Numeric strength score (0-7)
 */
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong';
  score: number;
}

/**
 * Validates a password according to the configured password policy
 * Checks length, character requirements, common passwords, and user info
 * Returns detailed validation results with strength assessment
 * 
 * @param password - The password string to validate
 * @param userInfo - Optional user information to prevent password reuse
 * @param userInfo.username - User's username to check against
 * @param userInfo.email - User's email to check against
 * @param userInfo.firstName - User's first name to check against
 * @param userInfo.lastName - User's last name to check against
 * @returns Comprehensive validation result with errors and strength
 * 
 * @example
 * ```typescript
 * const result = validatePassword('MyP@ssw0rd123', {
 *   username: 'john.doe',
 *   email: 'john@example.com'
 * });
 * 
 * if (result.isValid) {
 *   console.log('Password strength:', result.strength);
 * } else {
 *   console.log('Validation errors:', result.errors);
 * }
 * ```
 */
export function validatePassword(
  password: string,
  userInfo?: {
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  }
): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  if (!password) {
    return {
      isValid: false,
      errors: ['Password is required'],
      strength: 'weak',
      score: 0
    };
  }

  // Length check
  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(`Password must be at least ${PASSWORD_POLICY.minLength} characters long`);
  } else {
    score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
  }

  // Character type checks
  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else if (PASSWORD_POLICY.requireUppercase) {
    score += 1;
  }

  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else if (PASSWORD_POLICY.requireLowercase) {
    score += 1;
  }

  if (PASSWORD_POLICY.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else if (PASSWORD_POLICY.requireNumbers) {
    score += 1;
  }

  if (PASSWORD_POLICY.requireSpecialChars) {
    const specialCharsRegex = new RegExp(`[${PASSWORD_POLICY.specialChars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`);
    if (!specialCharsRegex.test(password)) {
      errors.push(`Password must contain at least one special character (${PASSWORD_POLICY.specialChars})`);
    } else {
      score += 1;
    }
  }

  // Common password check
  if (PASSWORD_POLICY.preventCommon) {
    const lowerPassword = password.toLowerCase();
    if (COMMON_PASSWORDS.includes(lowerPassword)) {
      errors.push('Password is too common. Please choose a more unique password');
    }
  }

  // User info check
  if (PASSWORD_POLICY.preventUserInfo && userInfo) {
    const lowerPassword = password.toLowerCase();
    const userInfoValues = Object.values(userInfo)
      .filter(Boolean)
      .map(v => v!.toLowerCase());

    for (const value of userInfoValues) {
      if (lowerPassword.includes(value) || value.includes(lowerPassword)) {
        errors.push('Password should not contain personal information');
        break;
      }
    }
  }

  // Calculate strength
  let strength: 'weak' | 'fair' | 'good' | 'strong' = 'weak';
  if (score >= 6) {
    strength = 'strong';
  } else if (score >= 4) {
    strength = 'good';
  } else if (score >= 2) {
    strength = 'fair';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score
  };
}

/**
 * Generates a password strength meter percentage (0-100) for UI display
 * Converts the numeric score to a percentage for progress bars or meters
 * 
 * @param result - Password validation result containing the numeric score
 * @returns Percentage value (0-100) suitable for progress bars
 * 
 * @example
 * ```typescript
 * const result = validatePassword('MyPassword123!');
 * const percentage = getPasswordStrengthPercentage(result);
 * // Use percentage for progress bar: <progress value={percentage} max="100" />
 * ```
 */
export function getPasswordStrengthPercentage(result: PasswordValidationResult): number {
  const maxScore = 7; // Maximum possible score
  return Math.round((result.score / maxScore) * 100);
}

/**
 * Gets appropriate CSS color for password strength visual indicator
 * Returns color values that correspond to strength levels for UI feedback
 * 
 * @param strength - Password strength level from validation result
 * @returns CSS color string (hex format) for styling strength indicators
 * 
 * @example
 * ```typescript
 * const result = validatePassword('password123');
 * const color = getPasswordStrengthColor(result.strength);
 * // Use color in styles: style={{ color }} or className based on color
 * ```
 */
export function getPasswordStrengthColor(strength: PasswordValidationResult['strength']): string {
  switch (strength) {
    case 'weak':
      return '#dc3545'; // Red
    case 'fair':
      return '#ffc107'; // Yellow
    case 'good':
      return '#28a745'; // Green
    case 'strong':
      return '#007bff'; // Blue
    default:
      return '#6c757d'; // Gray
  }
}