import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { authService } from '@/services/authService'
import { apiService } from '@/services/api'
import { secureStorage } from '@/utils/secureStorage'

// Mock dependencies
vi.mock('@/services/api')
vi.mock('@/utils/secureStorage')

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock console methods
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('login', () => {
    it('should successfully login and store token', async () => {
      const mockCredentials = {
        Username: 'test@example.com',
        Password: 'password123'
      }
      
      const mockResponse = {
        Token: 'jwt-token',
        User: {
          Id: '123',
          Username: 'test@example.com',
          FirstName: 'Test',
          LastName: 'User',
          Email: 'test@example.com',
          Roles: ['User']
        }
      }
      
      ;(apiService.post as any).mockResolvedValue(mockResponse)
      
      const result = await authService.login(mockCredentials)
      
      expect(apiService.post).toHaveBeenCalledWith('/auth/authenticate', mockCredentials)
      expect(secureStorage.setToken).toHaveBeenCalledWith('jwt-token')
      expect(secureStorage.setUserData).toHaveBeenCalledWith('profile', mockResponse.User)
      expect(result).toEqual(mockResponse)
    })

    it('should handle login without user data in response', async () => {
      const mockCredentials = {
        Username: 'test@example.com',
        Password: 'password123'
      }
      
      const mockResponse = {
        Token: 'jwt-token'
        // No User property
      }
      
      ;(apiService.post as any).mockResolvedValue(mockResponse)
      
      const result = await authService.login(mockCredentials)
      
      expect(secureStorage.setToken).toHaveBeenCalledWith('jwt-token')
      expect(secureStorage.setUserData).not.toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should handle login response without token', async () => {
      const mockCredentials = {
        Username: 'test@example.com',
        Password: 'password123'
      }
      
      const mockResponse = {
        // No token
        User: { Id: '123' }
      }
      
      ;(apiService.post as any).mockResolvedValue(mockResponse)
      
      const result = await authService.login(mockCredentials)
      
      expect(secureStorage.setToken).not.toHaveBeenCalled()
      expect(secureStorage.setUserData).not.toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should throw error when login fails', async () => {
      const mockCredentials = {
        Username: 'test@example.com',
        Password: 'wrongpassword'
      }
      
      const mockError = {
        Code: 'INVALID_CREDENTIALS',
        Message: 'Invalid username or password'
      }
      
      ;(apiService.post as any).mockRejectedValue(mockError)
      
      await expect(authService.login(mockCredentials)).rejects.toEqual(mockError)
      expect(secureStorage.setToken).not.toHaveBeenCalled()
    })
  })

  describe('logout', () => {
    it('should successfully logout and clear storage', async () => {
      ;(secureStorage.getToken as any).mockReturnValue('jwt-token')
      ;(apiService.post as any).mockResolvedValue(undefined)
      
      await authService.logout()
      
      expect(apiService.post).toHaveBeenCalledWith('/auth/logout')
      expect(secureStorage.clearAuthStorage).toHaveBeenCalled()
      expect(secureStorage.clearUserData).toHaveBeenCalled()
    })

    it('should clear storage even if logout API call fails', async () => {
      ;(secureStorage.getToken as any).mockReturnValue('jwt-token')
      ;(apiService.post as any).mockRejectedValue(new Error('Network error'))
      
      await authService.logout()
      
      expect(console.warn).toHaveBeenCalledWith('Logout API call failed:', expect.any(Error))
      expect(secureStorage.clearAuthStorage).toHaveBeenCalled()
      expect(secureStorage.clearUserData).toHaveBeenCalled()
    })

    it('should not call logout endpoint if no token exists', async () => {
      ;(secureStorage.getToken as any).mockReturnValue(null)
      
      await authService.logout()
      
      expect(apiService.post).not.toHaveBeenCalled()
      expect(secureStorage.clearAuthStorage).toHaveBeenCalled()
      expect(secureStorage.clearUserData).toHaveBeenCalled()
    })
  })

  describe('refreshToken', () => {
    it('should refresh token and update storage', async () => {
      const mockResponse = {
        Token: 'new-jwt-token',
        User: {
          Id: '123',
          Username: 'test@example.com',
          FirstName: 'Test',
          LastName: 'User'
        }
      }
      
      ;(apiService.post as any).mockResolvedValue(mockResponse)
      
      const result = await authService.refreshToken('test@example.com', 'refresh-token')
      
      expect(apiService.post).toHaveBeenCalledWith('/auth/refresh-token', {
        Username: 'test@example.com',
        RefreshToken: 'refresh-token'
      })
      expect(secureStorage.setToken).toHaveBeenCalledWith('new-jwt-token')
      expect(secureStorage.setUserData).toHaveBeenCalledWith('profile', mockResponse.User)
      expect(result).toEqual(mockResponse)
    })

    it('should handle refresh without user data', async () => {
      const mockResponse = {
        Token: 'new-jwt-token'
        // No User data
      }
      
      ;(apiService.post as any).mockResolvedValue(mockResponse)
      
      await authService.refreshToken('test@example.com', 'refresh-token')
      
      expect(secureStorage.setToken).toHaveBeenCalledWith('new-jwt-token')
      expect(secureStorage.setUserData).not.toHaveBeenCalled()
    })

    it('should handle refresh without token', async () => {
      const mockResponse = {
        // No token
        User: { Id: '123' }
      }
      
      ;(apiService.post as any).mockResolvedValue(mockResponse)
      
      await authService.refreshToken('test@example.com', 'refresh-token')
      
      expect(secureStorage.setToken).not.toHaveBeenCalled()
      expect(secureStorage.setUserData).not.toHaveBeenCalled()
    })

    it('should throw error when refresh fails', async () => {
      const mockError = {
        Code: 'INVALID_REFRESH_TOKEN',
        Message: 'Refresh token is invalid or expired'
      }
      
      ;(apiService.post as any).mockRejectedValue(mockError)
      
      await expect(
        authService.refreshToken('test@example.com', 'invalid-token')
      ).rejects.toEqual(mockError)
    })
  })

  describe('validateToken', () => {
    it('should validate token successfully', async () => {
      const mockResponse = {
        isValid: true,
        username: 'test@example.com',
        message: 'Token is valid'
      }
      
      ;(apiService.get as any).mockResolvedValue(mockResponse)
      
      const result = await authService.validateToken()
      
      expect(apiService.get).toHaveBeenCalledWith('/auth/validate')
      expect(result).toEqual(mockResponse)
    })

    it('should handle invalid token response', async () => {
      const mockResponse = {
        isValid: false,
        username: '',
        message: 'Token is expired'
      }
      
      ;(apiService.get as any).mockResolvedValue(mockResponse)
      
      const result = await authService.validateToken()
      
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getUserProfile', () => {
    it('should fetch user profile successfully', async () => {
      const mockProfile = {
        Id: '123',
        Username: 'test@example.com',
        FirstName: 'Test',
        LastName: 'User',
        Email: 'test@example.com',
        PhoneNumber: '+1234567890',
        Roles: ['User', 'Admin'],
        IsActive: true,
        CreatedDate: '2024-01-01',
        LastModifiedDate: '2024-01-15'
      }
      
      ;(apiService.get as any).mockResolvedValue(mockProfile)
      
      const result = await authService.getUserProfile()
      
      expect(apiService.get).toHaveBeenCalledWith('/user/profile')
      expect(result).toEqual(mockProfile)
    })

    it('should throw error when profile fetch fails', async () => {
      const mockError = {
        Code: 'UNAUTHORIZED',
        Message: 'User not authenticated'
      }
      
      ;(apiService.get as any).mockRejectedValue(mockError)
      
      await expect(authService.getUserProfile()).rejects.toEqual(mockError)
    })
  })

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const updateData = {
        FirstName: 'Updated',
        LastName: 'Name',
        PhoneNumber: '+9876543210'
      }
      
      const mockResponse = {
        Id: '123',
        Username: 'test@example.com',
        FirstName: 'Updated',
        LastName: 'Name',
        Email: 'test@example.com',
        PhoneNumber: '+9876543210',
        Roles: ['User']
      }
      
      ;(apiService.put as any).mockResolvedValue(mockResponse)
      
      const result = await authService.updateProfile(updateData)
      
      expect(apiService.put).toHaveBeenCalledWith('/user/profile', updateData)
      expect(result).toEqual(mockResponse)
    })

    it('should handle partial profile updates', async () => {
      const updateData = {
        FirstName: 'OnlyFirstName'
      }
      
      const mockResponse = {
        Id: '123',
        FirstName: 'OnlyFirstName',
        LastName: 'User',
        Email: 'test@example.com'
      }
      
      ;(apiService.put as any).mockResolvedValue(mockResponse)
      
      const result = await authService.updateProfile(updateData)
      
      expect(apiService.put).toHaveBeenCalledWith('/user/profile', updateData)
      expect(result).toEqual(mockResponse)
    })

    it('should handle empty update data', async () => {
      const updateData = {}
      
      ;(apiService.put as any).mockResolvedValue({ Id: '123' })
      
      await authService.updateProfile(updateData)
      
      expect(apiService.put).toHaveBeenCalledWith('/user/profile', updateData)
    })
  })

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const passwordData = {
        CurrentPassword: 'oldPassword123',
        NewPassword: 'newPassword456!',
        ConfirmNewPassword: 'newPassword456!'
      }
      
      ;(apiService.post as any).mockResolvedValue(undefined)
      
      await authService.changePassword(passwordData)
      
      expect(apiService.post).toHaveBeenCalledWith('/user/change-password', passwordData)
    })

    it('should throw error when password change fails', async () => {
      const passwordData = {
        CurrentPassword: 'wrongPassword',
        NewPassword: 'newPassword456!',
        ConfirmNewPassword: 'newPassword456!'
      }
      
      const mockError = {
        Code: 'INVALID_PASSWORD',
        Message: 'Current password is incorrect'
      }
      
      ;(apiService.post as any).mockRejectedValue(mockError)
      
      await expect(authService.changePassword(passwordData)).rejects.toEqual(mockError)
    })
  })

  describe('changeEmail', () => {
    it('should change email successfully', async () => {
      const emailData = {
        NewEmail: 'newemail@example.com',
        CurrentPassword: 'password123'
      }
      
      ;(apiService.post as any).mockResolvedValue(undefined)
      
      await authService.changeEmail(emailData)
      
      expect(apiService.post).toHaveBeenCalledWith('/user/change-email', emailData)
    })

    it('should throw error when email change fails', async () => {
      const emailData = {
        NewEmail: 'taken@example.com',
        CurrentPassword: 'password123'
      }
      
      const mockError = {
        Code: 'EMAIL_TAKEN',
        Message: 'Email address is already in use'
      }
      
      ;(apiService.post as any).mockRejectedValue(mockError)
      
      await expect(authService.changeEmail(emailData)).rejects.toEqual(mockError)
    })
  })

  describe('checkEmailAvailability', () => {
    it('should check available email', async () => {
      const mockResponse = {
        isAvailable: true,
        message: 'Email is available'
      }
      
      ;(apiService.get as any).mockResolvedValue(mockResponse)
      
      const result = await authService.checkEmailAvailability('new@example.com')
      
      expect(apiService.get).toHaveBeenCalledWith('/user/check-email/new%40example.com')
      expect(result).toEqual(mockResponse)
    })

    it('should check unavailable email', async () => {
      const mockResponse = {
        isAvailable: false,
        message: 'Email is already registered'
      }
      
      ;(apiService.get as any).mockResolvedValue(mockResponse)
      
      const result = await authService.checkEmailAvailability('taken@example.com')
      
      expect(apiService.get).toHaveBeenCalledWith('/user/check-email/taken%40example.com')
      expect(result).toEqual(mockResponse)
    })

    it('should handle special characters in email', async () => {
      const email = 'test+tag@example.com'
      
      ;(apiService.get as any).mockResolvedValue({ isAvailable: true, message: 'Available' })
      
      await authService.checkEmailAvailability(email)
      
      expect(apiService.get).toHaveBeenCalledWith('/user/check-email/test%2Btag%40example.com')
    })
  })

  describe('isAuthenticated', () => {
    it('should return true when authenticated', () => {
      ;(secureStorage.isAuthenticated as any).mockReturnValue(true)
      
      const result = authService.isAuthenticated()
      
      expect(secureStorage.isAuthenticated).toHaveBeenCalled()
      expect(result).toBe(true)
    })

    it('should return false when not authenticated', () => {
      ;(secureStorage.isAuthenticated as any).mockReturnValue(false)
      
      const result = authService.isAuthenticated()
      
      expect(secureStorage.isAuthenticated).toHaveBeenCalled()
      expect(result).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle null/undefined responses gracefully', async () => {
      ;(apiService.post as any).mockResolvedValue(null)
      
      const result = await authService.login({
        Username: 'test@example.com',
        Password: 'password'
      })
      
      expect(result).toBeNull()
      expect(secureStorage.setToken).not.toHaveBeenCalled()
    })

    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Network timeout')
      ;(apiService.get as any).mockRejectedValue(timeoutError)
      
      await expect(authService.getUserProfile()).rejects.toThrow('Network timeout')
    })

    it('should handle malformed API responses', async () => {
      // Return string instead of object
      ;(apiService.get as any).mockResolvedValue('Invalid response')
      
      const result = await authService.validateToken()
      
      expect(result).toBe('Invalid response')
    })
  })
})