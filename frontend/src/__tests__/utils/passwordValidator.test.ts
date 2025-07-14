import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  validatePassword,
  getPasswordStrengthPercentage,
  getPasswordStrengthColor,
  PasswordValidationResult
} from '@/utils/passwordValidator'
import { PASSWORD_POLICY } from '@/config/security'

// Mock the security config to ensure consistent test behavior
vi.mock('../config/security', () => ({
  PASSWORD_POLICY: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    specialChars: '@$!%*?&',
    preventCommon: true,
    preventUserInfo: true,
  }
}))

describe('passwordValidator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validatePassword', () => {
    describe('basic validation', () => {
      it('should return invalid result for empty password', () => {
        const result = validatePassword('')
        
        expect(result.isValid).toBe(false)
        expect(result.errors).toEqual(['Password is required'])
        expect(result.strength).toBe('weak')
        expect(result.score).toBe(0)
      })

      it('should return invalid result for null/undefined password', () => {
        const result = validatePassword(null as any)
        
        expect(result.isValid).toBe(false)
        expect(result.errors).toEqual(['Password is required'])
      })

      it('should validate minimum length requirement', () => {
        const shortPassword = 'Abc1@'
        const result = validatePassword(shortPassword)
        
        expect(result.errors).toContain('Password must be at least 8 characters long')
        expect(result.isValid).toBe(false)
      })

      it('should pass minimum length requirement for 8+ character password', () => {
        const validLengthPassword = 'Abc123@#'
        const result = validatePassword(validLengthPassword)
        
        expect(result.errors).not.toContain('Password must be at least 8 characters long')
        expect(result.score).toBeGreaterThan(0)
      })
    })

    describe('character requirements', () => {
      it('should require uppercase letters', () => {
        const noUppercase = 'abc123@#'
        const result = validatePassword(noUppercase)
        
        expect(result.errors).toContain('Password must contain at least one uppercase letter')
        expect(result.isValid).toBe(false)
      })

      it('should require lowercase letters', () => {
        const noLowercase = 'ABC123@#'
        const result = validatePassword(noLowercase)
        
        expect(result.errors).toContain('Password must contain at least one lowercase letter')
        expect(result.isValid).toBe(false)
      })

      it('should require numbers', () => {
        const noNumbers = 'Abcdef@#'
        const result = validatePassword(noNumbers)
        
        expect(result.errors).toContain('Password must contain at least one number')
        expect(result.isValid).toBe(false)
      })

      it('should require special characters', () => {
        const noSpecial = 'Abc123def'
        const result = validatePassword(noSpecial)
        
        expect(result.errors).toContain('Password must contain at least one special character (@$!%*?&)')
        expect(result.isValid).toBe(false)
      })

      it('should accept all allowed special characters', () => {
        const specialChars = '@$!%*?&'
        
        for (const char of specialChars) {
          const password = `Test123${char}`
          const result = validatePassword(password)
          
          expect(result.errors).not.toContain('Password must contain at least one special character (@$!%*?&)')
        }
      })

      it('should reject disallowed special characters', () => {
        const password = 'Test123#' // # is not in allowed special chars
        const result = validatePassword(password)
        
        expect(result.errors).toContain('Password must contain at least one special character (@$!%*?&)')
      })
    })

    describe('common password detection', () => {
      const commonPasswords = [
        'password',
        'password123',
        '123456',
        'qwerty',
        'admin',
        'letmein',
        'welcome'
      ]

      it.each(commonPasswords)('should reject common password: %s', (commonPassword) => {
        const result = validatePassword(commonPassword)
        
        expect(result.errors).toContain('Password is too common. Please choose a more unique password')
        expect(result.isValid).toBe(false)
      })

      it('should reject common passwords regardless of case', () => {
        const variations = ['PASSWORD', 'Password', 'pAsSwOrD', 'PASSWORD123']
        
        variations.forEach(password => {
          const result = validatePassword(password)
          expect(result.errors).toContain('Password is too common. Please choose a more unique password')
        })
      })

      it('should accept non-common passwords', () => {
        const uniquePassword = 'MyUn1qu3P@ss'
        const result = validatePassword(uniquePassword)
        
        expect(result.errors).not.toContain('Password is too common. Please choose a more unique password')
      })
    })

    describe('user information validation', () => {
      const userInfo = {
        username: 'john.doe',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe'
      }

      it('should reject password containing username', () => {
        const password = 'john.doe123@'
        const result = validatePassword(password, userInfo)
        
        expect(result.errors).toContain('Password should not contain personal information')
        expect(result.isValid).toBe(false)
      })

      it('should reject password containing email', () => {
        const password = 'john@example.com123!'
        const result = validatePassword(password, userInfo)
        
        expect(result.errors).toContain('Password should not contain personal information')
      })

      it('should reject password containing first name', () => {
        const password = 'JohnSecure123@'
        const result = validatePassword(password, userInfo)
        
        expect(result.errors).toContain('Password should not contain personal information')
      })

      it('should reject password containing last name', () => {
        const password = 'DoePassword123@'
        const result = validatePassword(password, userInfo)
        
        expect(result.errors).toContain('Password should not contain personal information')
      })

      it('should be case insensitive for user info check', () => {
        const password = 'JOHN123@'
        const result = validatePassword(password, userInfo)
        
        expect(result.errors).toContain('Password should not contain personal information')
      })

      it('should handle partial user info', () => {
        const partialUserInfo = { username: 'testuser' }
        const password = 'testuser123@'
        const result = validatePassword(password, partialUserInfo)
        
        expect(result.errors).toContain('Password should not contain personal information')
      })

      it('should handle empty user info', () => {
        const password = 'ValidP@ss123'
        const result = validatePassword(password, {})
        
        expect(result.errors).not.toContain('Password should not contain personal information')
      })

      it('should accept password without user info when none provided', () => {
        const password = 'ValidP@ss123'
        const result = validatePassword(password)
        
        expect(result.errors).not.toContain('Password should not contain personal information')
      })
    })

    describe('scoring system', () => {
      it('should give points for meeting length requirements', () => {
        const shortValid = 'Test123@'    // 8 chars = 1 point
        const mediumValid = 'Test123@Test' // 12+ chars = 2 points
        const longValid = 'Test123@TestTest123' // 16+ chars = 3 points
        
        const shortResult = validatePassword(shortValid)
        const mediumResult = validatePassword(mediumValid)
        const longResult = validatePassword(longValid)
        
        expect(mediumResult.score).toBeGreaterThan(shortResult.score)
        expect(longResult.score).toBeGreaterThan(mediumResult.score)
      })

      it('should give points for each character type requirement', () => {
        const basicPassword = 'testpass'
        const withUpper = 'Testpass'
        const withNumber = 'Testpass1'
        const withSpecial = 'Testpass1@'
        
        const basicResult = validatePassword(basicPassword)
        const upperResult = validatePassword(withUpper)
        const numberResult = validatePassword(withNumber)
        const specialResult = validatePassword(withSpecial)
        
        expect(upperResult.score).toBeGreaterThan(basicResult.score)
        expect(numberResult.score).toBeGreaterThan(upperResult.score)
        expect(specialResult.score).toBeGreaterThan(numberResult.score)
      })

      it('should calculate maximum score for ideal password', () => {
        const idealPassword = 'MyVeryLongSecureP@ssw0rd123!' // 16+ chars, all requirements
        const result = validatePassword(idealPassword)
        
        expect(result.score).toBe(7) // Maximum possible score
        expect(result.strength).toBe('strong')
        expect(result.isValid).toBe(true)
      })
    })

    describe('strength assessment', () => {
      it('should classify weak passwords (score 0-1)', () => {
        const weakPassword = 'test'
        const result = validatePassword(weakPassword)
        
        expect(result.strength).toBe('weak')
        expect(result.score).toBeLessThan(2)
      })

      it('should classify fair passwords (score 2-3)', () => {
        const fairPassword = 'Test123'
        const result = validatePassword(fairPassword)
        
        expect(result.strength).toBe('fair')
        expect(result.score).toBeGreaterThanOrEqual(2)
        expect(result.score).toBeLessThan(4)
      })

      it('should classify good passwords (score 4-5)', () => {
        const goodPassword = 'Test123@' // Shorter password to get lower score
        const result = validatePassword(goodPassword)
        
        expect(result.strength).toBe('good')
        expect(result.score).toBeGreaterThanOrEqual(4)
        expect(result.score).toBeLessThan(6)
      })

      it('should classify strong passwords (score 6-7)', () => {
        const strongPassword = 'MyVerySecureP@ssw0rd123'
        const result = validatePassword(strongPassword)
        
        expect(result.strength).toBe('strong')
        expect(result.score).toBeGreaterThanOrEqual(6)
      })
    })

    describe('edge cases', () => {
      it('should handle passwords with unicode characters', () => {
        const unicodePassword = 'Test123@ñáéí'
        const result = validatePassword(unicodePassword)
        
        // Should meet basic requirements
        expect(result.isValid).toBe(true)
      })

      it('should handle very long passwords', () => {
        const veryLongPassword = 'A'.repeat(100) + 'b1@'
        const result = validatePassword(veryLongPassword)
        
        expect(result.isValid).toBe(true)
        expect(result.score).toBeGreaterThan(0)
      })

      it('should handle passwords with only whitespace', () => {
        const whitespacePassword = '        '
        const result = validatePassword(whitespacePassword)
        
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Password must contain at least one uppercase letter')
      })

      it('should escape special characters in regex properly', () => {
        // Test with regex special characters that might break the validation
        const passwordWithRegexChars = 'Test123[{()*+?.\\^$|'
        const result = validatePassword(passwordWithRegexChars)
        
        // Should not throw an error due to invalid regex
        expect(result).toBeDefined()
        expect(result.errors).toBeDefined()
      })
    })
  })

  describe('getPasswordStrengthPercentage', () => {
    it('should return 0% for score 0', () => {
      const result: PasswordValidationResult = {
        isValid: false,
        errors: [],
        strength: 'weak',
        score: 0
      }
      
      expect(getPasswordStrengthPercentage(result)).toBe(0)
    })

    it('should return 100% for maximum score', () => {
      const result: PasswordValidationResult = {
        isValid: true,
        errors: [],
        strength: 'strong',
        score: 7
      }
      
      expect(getPasswordStrengthPercentage(result)).toBe(100)
    })

    it('should return appropriate percentages for intermediate scores', () => {
      const testCases = [
        { score: 1, expected: 14 }, // 1/7 * 100 ≈ 14
        { score: 2, expected: 29 }, // 2/7 * 100 ≈ 29
        { score: 3, expected: 43 }, // 3/7 * 100 ≈ 43
        { score: 4, expected: 57 }, // 4/7 * 100 ≈ 57
        { score: 5, expected: 71 }, // 5/7 * 100 ≈ 71
        { score: 6, expected: 86 }, // 6/7 * 100 ≈ 86
      ]
      
      testCases.forEach(({ score, expected }) => {
        const result: PasswordValidationResult = {
          isValid: true,
          errors: [],
          strength: 'fair',
          score
        }
        
        expect(getPasswordStrengthPercentage(result)).toBe(expected)
      })
    })
  })

  describe('getPasswordStrengthColor', () => {
    it('should return red for weak passwords', () => {
      expect(getPasswordStrengthColor('weak')).toBe('#dc3545')
    })

    it('should return yellow for fair passwords', () => {
      expect(getPasswordStrengthColor('fair')).toBe('#ffc107')
    })

    it('should return green for good passwords', () => {
      expect(getPasswordStrengthColor('good')).toBe('#28a745')
    })

    it('should return blue for strong passwords', () => {
      expect(getPasswordStrengthColor('strong')).toBe('#007bff')
    })

    it('should return gray for invalid strength values', () => {
      expect(getPasswordStrengthColor('invalid' as any)).toBe('#6c757d')
    })
  })

  describe('integration tests', () => {
    it('should validate strong password successfully', () => {
      const strongPassword = 'MyVerySecureP@ssw0rd2024'
      const result = validatePassword(strongPassword, { username: 'user', email: 'user@test.com' })
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.strength).toBe('strong')
      expect(result.score).toBeGreaterThanOrEqual(6)
      
      // Verify utility functions work together
      const percentage = getPasswordStrengthPercentage(result)
      const color = getPasswordStrengthColor(result.strength)
      
      expect(percentage).toBeGreaterThan(80)
      expect(color).toBe('#007bff') // Blue for strong
    })

    it('should reject common password with good scoring but invalid result', () => {
      const commonPassword = 'password123'
      const result = validatePassword(commonPassword)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password is too common. Please choose a more unique password')
      expect(result.score).toBeGreaterThan(0) // Has some points but still invalid
      
      const percentage = getPasswordStrengthPercentage(result)
      const color = getPasswordStrengthColor(result.strength)
      
      expect(percentage).toBeGreaterThanOrEqual(0)
      expect(percentage).toBeLessThanOrEqual(100)
      expect(color).toMatch(/^#[0-9a-f]{6}$/i)
    })

    it('should handle user info validation correctly', () => {
      const password = 'myUsernameIsUser123@'
      const result = validatePassword(password, { username: 'user' })
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password should not contain personal information')
      
      // Verify utility functions still work with invalid passwords
      const percentage = getPasswordStrengthPercentage(result)
      const color = getPasswordStrengthColor(result.strength)
      
      expect(percentage).toBeGreaterThanOrEqual(0)
      expect(color).toMatch(/^#[0-9a-f]{6}$/i)
    })
  })
})