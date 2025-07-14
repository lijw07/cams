import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { authService } from '@/services/authService'

// Mock dependencies
vi.mock('@/services/authService', () => ({
  authService: {
    isAuthenticated: vi.fn(),
    validateToken: vi.fn(),
    getUserProfile: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
    changeEmail: vi.fn()
  }
}))

vi.mock('@/contexts/NotificationContext', () => ({
  useNotifications: () => ({
    addNotification: vi.fn()
  })
}))

vi.mock('@/config/security', () => ({
  SESSION_CONFIG: {
    timeout: 1800000, // 30 minutes
    warningTime: 300000, // 5 minutes
    refreshInterval: 600000, // 10 minutes
  }
}))

// Test component to access auth context
const TestComponent: React.FC = () => {
  const auth = useAuth()
  
  return (
    <div>
      <div data-testid="loading">{auth.isLoading.toString()}</div>
      <div data-testid="authenticated">{auth.isAuthenticated.toString()}</div>
      <div data-testid="user">{auth.user?.Username || 'none'}</div>
      <button onClick={() => auth.login('test', 'password')}>Login</button>
      <button onClick={() => auth.logout()}>Logout</button>
      <button onClick={() => auth.refreshUserProfile()}>Refresh</button>
    </div>
  )
}

describe('AuthContext', () => {
  const mockUser = {
    Id: '123',
    Username: 'testuser',
    Email: 'test@example.com',
    FirstName: 'Test',
    LastName: 'User',
    Roles: ['User']
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    
    // Mock authService default behavior
    vi.mocked(authService.isAuthenticated).mockReturnValue(false)
    vi.mocked(authService.validateToken).mockResolvedValue({ isValid: false })
    vi.mocked(authService.getUserProfile).mockResolvedValue(mockUser)
    vi.mocked(authService.login).mockResolvedValue({ Token: 'test-token' })
    vi.mocked(authService.logout).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      expect(() => {
        render(<TestComponent />)
      }).toThrow('useAuth must be used within an AuthProvider')
      
      consoleSpy.mockRestore()
    })
  })

  describe('initial state', () => {
    it('should start with loading state and complete initialization', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Wait for initialization to complete
      await waitFor(
        () => {
          expect(screen.getByTestId('loading')).toHaveTextContent('false')
        },
        { timeout: 10000 }
      )
      
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
      expect(screen.getByTestId('user')).toHaveTextContent('none')
    })

    it('should load authenticated user on mount', async () => {
      vi.mocked(authService.isAuthenticated).mockReturnValue(true)
      vi.mocked(authService.validateToken).mockResolvedValue({ isValid: true })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
        expect(screen.getByTestId('user')).toHaveTextContent('testuser')
      })

      expect(authService.validateToken).toHaveBeenCalled()
      expect(authService.getUserProfile).toHaveBeenCalled()
    })

    it('should clear invalid token on mount', async () => {
      vi.mocked(authService.isAuthenticated).mockReturnValue(true)
      vi.mocked(authService.validateToken).mockResolvedValue({ isValid: false })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(authService.logout).toHaveBeenCalled()
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
      })
    })

    it('should handle initialization errors', async () => {
      vi.mocked(authService.isAuthenticated).mockReturnValue(true)
      vi.mocked(authService.validateToken).mockRejectedValue(new Error('Network error'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(authService.logout).toHaveBeenCalled()
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
      })

      expect(consoleSpy).toHaveBeenCalledWith('Auth initialization error:', expect.any(Error))
      consoleSpy.mockRestore()
    })
  })

  describe('login', () => {
    it('should login successfully', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      const loginButton = screen.getByText('Login')
      
      await act(async () => {
        loginButton.click()
      })

      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledWith({
          Username: 'test',
          Password: 'password'
        })
        expect(authService.getUserProfile).toHaveBeenCalled()
        expect(screen.getByTestId('user')).toHaveTextContent('testuser')
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
      })
    })

    it('should handle login without token', async () => {
      vi.mocked(authService.login).mockResolvedValue({ message: 'Invalid credentials' })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      const loginButton = screen.getByText('Login')
      
      await act(async () => {
        await expect(async () => {
          loginButton.click()
          await waitFor(() => {
            expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
          })
        }).rejects.toThrow()
      })
    })

    it('should handle login errors', async () => {
      const error = new Error('Network error')
      vi.mocked(authService.login).mockRejectedValue(error)

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      const loginButton = screen.getByText('Login')
      
      await act(async () => {
        await expect(async () => {
          loginButton.click()
          await waitFor(() => {
            expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
          })
        }).rejects.toThrow()
      })
    })
  })

  describe('logout', () => {
    it('should logout successfully', async () => {
      // Set up authenticated state
      vi.mocked(authService.isAuthenticated).mockReturnValue(true)
      vi.mocked(authService.validateToken).mockResolvedValue({ isValid: true })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
      })

      const logoutButton = screen.getByText('Logout')
      
      await act(async () => {
        logoutButton.click()
      })

      await waitFor(() => {
        expect(authService.logout).toHaveBeenCalled()
        expect(screen.getByTestId('user')).toHaveTextContent('none')
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
      })
    })

    it('should clear state even if logout API fails', async () => {
      vi.mocked(authService.logout).mockRejectedValue(new Error('Network error'))
      vi.mocked(authService.isAuthenticated).mockReturnValue(true)
      vi.mocked(authService.validateToken).mockResolvedValue({ isValid: true })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
      })

      const logoutButton = screen.getByText('Logout')
      
      await act(async () => {
        logoutButton.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('none')
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
      })

      consoleSpy.mockRestore()
    })
  })

  describe('profile management', () => {
    it('should refresh user profile', async () => {
      vi.mocked(authService.isAuthenticated).mockReturnValue(true)
      vi.mocked(authService.validateToken).mockResolvedValue({ isValid: true })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
      })

      // Update mock to return different data
      const updatedUser = { ...mockUser, FirstName: 'Updated' }
      vi.mocked(authService.getUserProfile).mockResolvedValue(updatedUser)

      const refreshButton = screen.getByText('Refresh')
      
      await act(async () => {
        refreshButton.click()
      })

      await waitFor(() => {
        expect(authService.getUserProfile).toHaveBeenCalledTimes(2) // Initial + refresh
      })
    })

    it('should update profile', async () => {
      const TestProfileUpdate = () => {
        const auth = useAuth()
        
        return (
          <button 
            onClick={() => auth.updateProfile({ 
              firstName: 'New', 
              lastName: 'Name' 
            })}
          >
            Update Profile
          </button>
        )
      }

      const updatedProfile = { ...mockUser, FirstName: 'New', LastName: 'Name' }
      vi.mocked(authService.updateProfile).mockResolvedValue(updatedProfile)

      render(
        <AuthProvider>
          <TestProfileUpdate />
        </AuthProvider>
      )

      const updateButton = screen.getByText('Update Profile')
      
      await act(async () => {
        updateButton.click()
      })

      await waitFor(() => {
        expect(authService.updateProfile).toHaveBeenCalledWith({
          FirstName: 'New',
          LastName: 'Name',
          PhoneNumber: undefined
        })
      })
    })

    it('should change password', async () => {
      const TestPasswordChange = () => {
        const auth = useAuth()
        
        return (
          <button 
            onClick={() => auth.changePassword({ 
              currentPassword: 'old', 
              newPassword: 'new',
              confirmNewPassword: 'new'
            })}
          >
            Change Password
          </button>
        )
      }

      render(
        <AuthProvider>
          <TestPasswordChange />
        </AuthProvider>
      )

      const changeButton = screen.getByText('Change Password')
      
      await act(async () => {
        changeButton.click()
      })

      await waitFor(() => {
        expect(authService.changePassword).toHaveBeenCalledWith({
          CurrentPassword: 'old',
          NewPassword: 'new',
          ConfirmNewPassword: 'new'
        })
      })
    })

    it('should change email', async () => {
      const TestEmailChange = () => {
        const auth = useAuth()
        
        return (
          <button 
            onClick={() => auth.changeEmail({ 
              newEmail: 'new@example.com', 
              password: 'password'
            })}
          >
            Change Email
          </button>
        )
      }

      render(
        <AuthProvider>
          <TestEmailChange />
        </AuthProvider>
      )

      const changeButton = screen.getByText('Change Email')
      
      await act(async () => {
        changeButton.click()
      })

      await waitFor(() => {
        expect(authService.changeEmail).toHaveBeenCalledWith({
          NewEmail: 'new@example.com',
          CurrentPassword: 'password'
        })
      })
    })
  })

  describe('session management', () => {
    it('should set up session timers on login', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false')
      })

      const loginButton = screen.getByText('Login')
      
      await act(async () => {
        loginButton.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
      })

      // Check that timers were set
      expect(vi.getTimerCount()).toBeGreaterThan(0)
    })
  })

  describe('event handling', () => {
    it('should handle unauthorized event', async () => {
      vi.mocked(authService.isAuthenticated).mockReturnValue(true)
      vi.mocked(authService.validateToken).mockResolvedValue({ isValid: true })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
      })

      // Dispatch unauthorized event
      act(() => {
        window.dispatchEvent(new Event('auth:unauthorized'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
        expect(authService.logout).toHaveBeenCalled()
      })
    })

    it('should cleanup event listeners on unmount', async () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'auth:unauthorized',
        expect.any(Function)
      )
    })
  })

  describe('error handling', () => {
    it('should handle profile update errors', async () => {
      const TestProfileUpdate = () => {
        const auth = useAuth()
        
        return (
          <button 
            onClick={async () => {
              try {
                await auth.updateProfile({ firstName: 'New' })
              } catch (error) {
                // Expected
              }
            }}
          >
            Update Profile
          </button>
        )
      }

      const error = new Error('Validation error')
      vi.mocked(authService.updateProfile).mockRejectedValue(error)

      render(
        <AuthProvider>
          <TestProfileUpdate />
        </AuthProvider>
      )

      const updateButton = screen.getByText('Update Profile')
      
      await act(async () => {
        updateButton.click()
      })

      await waitFor(() => {
        expect(authService.updateProfile).toHaveBeenCalled()
      })
    })
  })
})