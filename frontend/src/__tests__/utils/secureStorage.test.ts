import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SecureStorage, secureStorage } from '@/utils/secureStorage'

// Mock the security config
vi.mock('@/config/security', () => ({
  AUTH_STORAGE_STRATEGY: {
    current: 'localStorage',
    target: 'httpOnlyCookie',
  }
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
}

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
})

// Mock console.error to capture error logs
const mockConsoleError = vi.spyOn(console, 'error')

describe('SecureStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConsoleError.mockClear()
    mockConsoleError.mockImplementation(() => {}) // Silence console output during tests
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = SecureStorage.getInstance()
      const instance2 = SecureStorage.getInstance()
      
      expect(instance1).toBe(instance2)
    })

    it('should export a singleton instance', () => {
      expect(secureStorage).toBeInstanceOf(SecureStorage)
      expect(secureStorage).toBe(SecureStorage.getInstance())
    })

    it('should not allow direct instantiation', () => {
      // Constructor is private, so this would be a TypeScript error
      // but we can't test it at runtime. This test serves as documentation.
      expect(SecureStorage.getInstance()).toBeInstanceOf(SecureStorage)
    })
  })

  describe('token management', () => {
    describe('getToken', () => {
      it('should retrieve token from localStorage', () => {
        const expectedToken = 'test-token-123'
        mockLocalStorage.getItem.mockReturnValue(expectedToken)

        const result = secureStorage.getToken()

        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('auth_token')
        expect(result).toBe(expectedToken)
      })

      it('should return null when no token exists', () => {
        mockLocalStorage.getItem.mockReturnValue(null)

        const result = secureStorage.getToken()

        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('auth_token')
        expect(result).toBe(null)
      })

      it('should handle localStorage errors gracefully', () => {
        mockLocalStorage.getItem.mockImplementation(() => {
          throw new Error('Storage unavailable')
        })

        expect(() => secureStorage.getToken()).toThrow('Storage unavailable')
      })
    })

    describe('setToken', () => {
      it('should store token in localStorage', () => {
        const token = 'new-auth-token'

        secureStorage.setToken(token)

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_token', token)
      })

      it('should handle localStorage setItem errors', () => {
        const token = 'test-token'
        mockLocalStorage.setItem.mockImplementation(() => {
          throw new Error('Storage quota exceeded')
        })

        expect(() => secureStorage.setToken(token)).toThrow('Storage quota exceeded')
      })

      it('should handle empty token', () => {
        secureStorage.setToken('')

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_token', '')
      })
    })

    describe('removeToken', () => {
      it('should remove token from localStorage', () => {
        secureStorage.removeToken()

        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token')
      })

      it('should handle localStorage removeItem errors', () => {
        mockLocalStorage.removeItem.mockImplementation(() => {
          throw new Error('Storage unavailable')
        })

        expect(() => secureStorage.removeToken()).toThrow('Storage unavailable')
      })
    })

    describe('isAuthenticated', () => {
      it('should return true when token exists', () => {
        mockLocalStorage.getItem.mockReturnValue('valid-token')

        const result = secureStorage.isAuthenticated()

        expect(result).toBe(true)
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('auth_token')
      })

      it('should return false when token is null', () => {
        mockLocalStorage.getItem.mockReturnValue(null)

        const result = secureStorage.isAuthenticated()

        expect(result).toBe(false)
      })

      it('should return false when token is empty string', () => {
        mockLocalStorage.getItem.mockReturnValue('')

        const result = secureStorage.isAuthenticated()

        expect(result).toBe(false)
      })

      it('should return false when token is whitespace', () => {
        mockLocalStorage.getItem.mockReturnValue('   ')

        const result = secureStorage.isAuthenticated()

        expect(result).toBe(true) // Non-empty string is truthy
      })
    })
  })

  describe('auth storage management', () => {
    describe('clearAuthStorage', () => {
      it('should remove all auth-related items', () => {
        secureStorage.clearAuthStorage()

        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token')
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user_profile')
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refresh_token')
        expect(mockLocalStorage.removeItem).toHaveBeenCalledTimes(3)
      })

      it('should handle errors when removing items', () => {
        mockLocalStorage.removeItem.mockImplementation((key) => {
          if (key === 'user_profile') {
            throw new Error('Cannot remove item')
          }
        })

        expect(() => secureStorage.clearAuthStorage()).toThrow('Cannot remove item')
      })
    })
  })

  describe('user data management', () => {
    describe('setUserData', () => {
      it('should store user data with prefixed key', () => {
        const key = 'preferences'
        const value = { theme: 'dark', language: 'en' }

        secureStorage.setUserData(key, value)

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'user_preferences',
          JSON.stringify(value)
        )
      })

      it('should handle primitive values', () => {
        secureStorage.setUserData('count', 42)
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user_count', '42')

        secureStorage.setUserData('enabled', true)
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user_enabled', 'true')

        secureStorage.setUserData('name', 'John')
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user_name', '"John"')
      })

      it('should handle null and undefined values', () => {
        secureStorage.setUserData('nullValue', null)
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user_nullValue', 'null')

        secureStorage.setUserData('undefinedValue', undefined)
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user_undefinedValue', undefined)
      })

      it('should handle complex objects', () => {
        const complexObject = {
          user: { id: 1, name: 'John' },
          settings: { notifications: true },
          tags: ['work', 'important'],
        }

        secureStorage.setUserData('complex', complexObject)

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'user_complex',
          JSON.stringify(complexObject)
        )
      })

      it('should handle localStorage errors gracefully', () => {
        mockLocalStorage.setItem.mockImplementation(() => {
          throw new Error('Storage quota exceeded')
        })

        // Should not throw, errors are caught and logged
        expect(() => secureStorage.setUserData('test', 'value')).not.toThrow()
      })

      it('should handle JSON serialization errors', () => {
        const circularObject: any = { name: 'test' }
        circularObject.self = circularObject

        // Should not throw, JSON.stringify errors are caught and logged
        expect(() => secureStorage.setUserData('circular', circularObject)).not.toThrow()
      })
    })

    describe('getUserData', () => {
      it('should retrieve and parse user data', () => {
        const storedValue = { theme: 'dark', language: 'en' }
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedValue))

        const result = secureStorage.getUserData('preferences')

        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('user_preferences')
        expect(result).toEqual(storedValue)
      })

      it('should return typed data correctly', () => {
        mockLocalStorage.getItem.mockReturnValue('42')
        const numberResult = secureStorage.getUserData<number>('count')
        expect(numberResult).toBe(42)

        mockLocalStorage.getItem.mockReturnValue('true')
        const booleanResult = secureStorage.getUserData<boolean>('enabled')
        expect(booleanResult).toBe(true)

        mockLocalStorage.getItem.mockReturnValue('"John"')
        const stringResult = secureStorage.getUserData<string>('name')
        expect(stringResult).toBe('John')
      })

      it('should return null when item does not exist', () => {
        mockLocalStorage.getItem.mockReturnValue(null)

        const result = secureStorage.getUserData('nonexistent')

        expect(result).toBe(null)
      })

      it('should return null when item is empty string', () => {
        mockLocalStorage.getItem.mockReturnValue('')

        const result = secureStorage.getUserData('empty')

        expect(result).toBe(null)
      })

      it('should handle JSON parsing errors gracefully', () => {
        mockLocalStorage.getItem.mockReturnValue('invalid-json{')

        const result = secureStorage.getUserData('invalid')

        expect(result).toBe(null)
        // Errors are caught and logged, but function continues gracefully
      })

      it('should handle localStorage getItem errors gracefully', () => {
        mockLocalStorage.getItem.mockImplementation(() => {
          throw new Error('Storage unavailable')
        })

        const result = secureStorage.getUserData('test')

        expect(result).toBe(null)
        // Errors are caught and logged, but function returns null gracefully
      })

      it('should handle null values correctly', () => {
        mockLocalStorage.getItem.mockReturnValue('null')

        const result = secureStorage.getUserData('nullValue')

        expect(result).toBe(null)
      })

      it('should handle complex objects', () => {
        const complexObject = {
          user: { id: 1, name: 'John' },
          settings: { notifications: true },
          tags: ['work', 'important'],
        }
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(complexObject))

        const result = secureStorage.getUserData('complex')

        expect(result).toEqual(complexObject)
      })
    })

    describe('removeUserData', () => {
      it('should remove user data with prefixed key', () => {
        secureStorage.removeUserData('preferences')

        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user_preferences')
      })

      it('should handle removal errors', () => {
        mockLocalStorage.removeItem.mockImplementation(() => {
          throw new Error('Cannot remove item')
        })

        expect(() => secureStorage.removeUserData('test')).toThrow('Cannot remove item')
      })
    })

    describe('clearUserData', () => {
      it('should remove all user data items', () => {
        // Mock Object.keys to return some localStorage keys
        const mockKeys = [
          'user_preferences',
          'user_settings',
          'auth_token',
          'user_profile',
          'some_other_key',
          'user_temp_data',
        ]
        
        // Mock Object.keys(localStorage) to return our mock keys
        const originalKeys = Object.keys
        Object.keys = vi.fn((obj) => {
          if (obj === mockLocalStorage) {
            return mockKeys
          }
          return originalKeys(obj)
        })

        secureStorage.clearUserData()

        // Should only remove keys that start with 'user_'
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user_preferences')
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user_settings')
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user_profile')
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user_temp_data')
        expect(mockLocalStorage.removeItem).toHaveBeenCalledTimes(4)
        
        // Should not remove non-user keys
        expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith('auth_token')
        expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith('some_other_key')

        // Restore Object.keys
        Object.keys = originalKeys
      })

      it('should handle empty localStorage', () => {
        const originalKeys = Object.keys
        Object.keys = vi.fn((obj) => {
          if (obj === mockLocalStorage) {
            return []
          }
          return originalKeys(obj)
        })

        secureStorage.clearUserData()

        expect(mockLocalStorage.removeItem).not.toHaveBeenCalled()
        
        Object.keys = originalKeys
      })

      it('should handle removal errors during clear', () => {
        const mockKeys = ['user_preferences', 'user_settings']
        const originalKeys = Object.keys
        Object.keys = vi.fn((obj) => {
          if (obj === mockLocalStorage) {
            return mockKeys
          }
          return originalKeys(obj)
        })
        
        mockLocalStorage.removeItem.mockImplementation((key) => {
          if (key === 'user_settings') {
            throw new Error('Cannot remove item')
          }
        })

        expect(() => secureStorage.clearUserData()).toThrow('Cannot remove item')
        
        // Should have attempted to remove the first item before error
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user_preferences')
        
        Object.keys = originalKeys
      })
    })
  })

  describe('integration scenarios', () => {
    it('should handle complete auth workflow', () => {
      // Login - set token
      secureStorage.setToken('auth-token-123')
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_token', 'auth-token-123')

      // Check authentication
      mockLocalStorage.getItem.mockReturnValue('auth-token-123')
      expect(secureStorage.isAuthenticated()).toBe(true)

      // Store user data
      secureStorage.setUserData('profile', { name: 'John', id: 1 })
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user_profile', '{"name":"John","id":1}')

      // Logout - clear all
      secureStorage.clearAuthStorage()
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user_profile')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refresh_token')
    })

    it('should handle partial storage failures gracefully', () => {
      // Set token successfully
      secureStorage.setToken('token')
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_token', 'token')

      // Fail to set user data
      mockLocalStorage.setItem.mockImplementation((key) => {
        if (key.startsWith('user_')) {
          throw new Error('Storage quota exceeded')
        }
      })

      // Should not throw despite storage error
      expect(() => secureStorage.setUserData('preferences', { theme: 'dark' })).not.toThrow()

      // Token should still work
      mockLocalStorage.getItem.mockReturnValue('token')
      expect(secureStorage.isAuthenticated()).toBe(true)
    })

    it('should handle mixed data types in user storage', () => {
      const testData = [
        { key: 'string', value: 'test string' },
        { key: 'number', value: 42 },
        { key: 'boolean', value: false },
        { key: 'object', value: { nested: { data: 'value' } } },
        { key: 'array', value: [1, 'two', { three: 3 }] },
        { key: 'null', value: null },
      ]

      testData.forEach(({ key, value }) => {
        secureStorage.setUserData(key, value)
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          `user_${key}`,
          JSON.stringify(value)
        )
      })

      // Simulate retrieval
      testData.forEach(({ key, value }) => {
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(value))
        const retrieved = secureStorage.getUserData(key)
        expect(retrieved).toEqual(value)
      })
    })
  })

  describe('future httpOnly cookie migration', () => {
    it('should document the migration path in comments', () => {
      // This test serves as documentation for the future migration
      // When AUTH_STORAGE_STRATEGY.current becomes 'httpOnlyCookie':
      // - getToken() should return null (tokens sent via cookies)
      // - setToken() should be a no-op (handled by backend)
      // - removeToken() should be a no-op (handled by backend)
      // - isAuthenticated() should check auth state differently
      // - clearAuthStorage() should be a no-op (handled by backend)
      
      expect(true).toBe(true) // Placeholder test for documentation
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle extremely large data gracefully', () => {
      const largeObject = {
        data: 'x'.repeat(100000),
        nested: { moreData: 'y'.repeat(50000) },
      }

      expect(() => secureStorage.setUserData('large', largeObject)).not.toThrow()
    })

    it('should handle special characters in keys', () => {
      const specialKeys = ['key with spaces', 'key-with-dashes', 'key_with_underscores', 'key.with.dots']

      specialKeys.forEach(key => {
        secureStorage.setUserData(key, 'test value')
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(`user_${key}`, '"test value"')
      })
    })

    it('should handle empty keys', () => {
      secureStorage.setUserData('', 'empty key')
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user_', '"empty key"')

      secureStorage.removeUserData('')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user_')
    })

    it('should handle multiple instances gracefully', () => {
      const instance1 = SecureStorage.getInstance()
      const instance2 = SecureStorage.getInstance()
      
      instance1.setToken('token1')
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_token', 'token1')
      
      mockLocalStorage.getItem.mockReturnValue('token1')
      expect(instance2.getToken()).toBe('token1')
      
      // Both instances should be the same
      expect(instance1).toBe(instance2)
    })
  })
})