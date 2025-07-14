import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock dependencies first
vi.mock('@/contexts/AuthContext')
vi.mock('@/hooks/useAnalytics')
vi.mock('@/config/environment', () => ({
  env: {
    app: {
      environment: 'test'
    },
    analytics: {
      enabled: true,
      debug: false,
      measurementId: 'test-id'
    }
  }
}))

// Import components after mocks
import { AnalyticsProvider, useAnalyticsContext } from '@/contexts/AnalyticsContext'
import { useAuth } from '@/contexts/AuthContext'
import { useAnalytics } from '@/hooks/useAnalytics'
import { env } from '@/config/environment'
import { CUSTOM_DIMENSIONS } from '@/constants/AnalyticsConstants'

// Test component to access analytics context
const TestComponent: React.FC = () => {
  const { isInitialized, optOut, optIn } = useAnalyticsContext()
  
  return (
    <div>
      <div data-testid="initialized">{isInitialized.toString()}</div>
      <button onClick={optOut}>Opt Out</button>
      <button onClick={optIn}>Opt In</button>
    </div>
  )
}

describe('AnalyticsContext', () => {
  const mockTrackUser = vi.fn()
  const mockSetUserProperties = vi.fn()
  const mockOptOut = vi.fn()
  const mockOptIn = vi.fn()
  const mockIsInitialized = vi.fn()

  const mockUser = {
    Id: '123',
    Username: 'testuser',
    Email: 'test@example.com',
    FirstName: 'Test',
    LastName: 'User',
    Roles: ['Admin', 'User']
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock implementations
    ;(useAuth as any).mockReturnValue({
      user: null,
      isAuthenticated: false
    })

    ;(useAnalytics as any).mockReturnValue({
      trackUser: mockTrackUser,
      setUserProperties: mockSetUserProperties,
      optOut: mockOptOut,
      optIn: mockOptIn,
      isInitialized: mockIsInitialized
    })

    mockIsInitialized.mockReturnValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('useAnalyticsContext hook', () => {
    it('should throw error when used outside AnalyticsProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      expect(() => {
        render(<TestComponent />)
      }).toThrow('useAnalyticsContext must be used within an AnalyticsProvider')
      
      consoleSpy.mockRestore()
    })
  })

  describe('initialization', () => {
    it('should provide analytics methods', () => {
      render(
        <AnalyticsProvider>
          <TestComponent />
        </AnalyticsProvider>
      )

      expect(screen.getByTestId('initialized')).toHaveTextContent('true')
      expect(screen.getByText('Opt Out')).toBeInTheDocument()
      expect(screen.getByText('Opt In')).toBeInTheDocument()
    })

    it('should reflect initialization state', () => {
      mockIsInitialized.mockReturnValue(false)

      render(
        <AnalyticsProvider>
          <TestComponent />
        </AnalyticsProvider>
      )

      expect(screen.getByTestId('initialized')).toHaveTextContent('false')
    })
  })

  describe('user tracking', () => {
    it('should track authenticated user', async () => {
      ;(useAuth as any).mockReturnValue({
        user: mockUser,
        isAuthenticated: true
      })

      render(
        <AnalyticsProvider>
          <TestComponent />
        </AnalyticsProvider>
      )

      await waitFor(() => {
        expect(mockTrackUser).toHaveBeenCalledWith({
          user_id: '123',
          user_role: 'Admin'
        })

        expect(mockSetUserProperties).toHaveBeenCalledWith({
          [CUSTOM_DIMENSIONS.USER_ROLE]: 'Admin',
          [CUSTOM_DIMENSIONS.USER_PERMISSIONS]: 'Admin,User',
          [CUSTOM_DIMENSIONS.ENVIRONMENT]: 'test'
        })
      })
    })

    it('should handle user without roles', async () => {
      const userWithoutRoles = { ...mockUser, Roles: [] }
      
      ;(useAuth as any).mockReturnValue({
        user: userWithoutRoles,
        isAuthenticated: true
      })

      render(
        <AnalyticsProvider>
          <TestComponent />
        </AnalyticsProvider>
      )

      await waitFor(() => {
        expect(mockTrackUser).toHaveBeenCalledWith({
          user_id: '123',
          user_role: 'user'
        })

        expect(mockSetUserProperties).toHaveBeenCalledWith({
          [CUSTOM_DIMENSIONS.USER_ROLE]: 'user',
          [CUSTOM_DIMENSIONS.USER_PERMISSIONS]: '',
          [CUSTOM_DIMENSIONS.ENVIRONMENT]: 'test'
        })
      })
    })

    it('should not track unauthenticated user', async () => {
      ;(useAuth as any).mockReturnValue({
        user: null,
        isAuthenticated: false
      })

      render(
        <AnalyticsProvider>
          <TestComponent />
        </AnalyticsProvider>
      )

      await waitFor(() => {
        expect(mockTrackUser).not.toHaveBeenCalled()
        expect(mockSetUserProperties).not.toHaveBeenCalled()
      })
    })

    it('should not track when analytics not initialized', async () => {
      mockIsInitialized.mockReturnValue(false)
      
      ;(useAuth as any).mockReturnValue({
        user: mockUser,
        isAuthenticated: true
      })

      render(
        <AnalyticsProvider>
          <TestComponent />
        </AnalyticsProvider>
      )

      await waitFor(() => {
        expect(mockTrackUser).not.toHaveBeenCalled()
        expect(mockSetUserProperties).not.toHaveBeenCalled()
      })
    })
  })

  describe('user actions', () => {
    it('should handle opt out', () => {
      render(
        <AnalyticsProvider>
          <TestComponent />
        </AnalyticsProvider>
      )

      const optOutButton = screen.getByText('Opt Out')
      optOutButton.click()

      expect(mockOptOut).toHaveBeenCalled()
    })

    it('should handle opt in', () => {
      render(
        <AnalyticsProvider>
          <TestComponent />
        </AnalyticsProvider>
      )

      const optInButton = screen.getByText('Opt In')
      optInButton.click()

      expect(mockOptIn).toHaveBeenCalled()
    })
  })

  describe('auth state changes', () => {
    it('should track user when authentication state changes', async () => {
      const { rerender } = render(
        <AnalyticsProvider>
          <TestComponent />
        </AnalyticsProvider>
      )

      expect(mockTrackUser).not.toHaveBeenCalled()

      // Update auth state
      ;(useAuth as any).mockReturnValue({
        user: mockUser,
        isAuthenticated: true
      })

      rerender(
        <AnalyticsProvider>
          <TestComponent />
        </AnalyticsProvider>
      )

      await waitFor(() => {
        expect(mockTrackUser).toHaveBeenCalledWith({
          user_id: '123',
          user_role: 'Admin'
        })
      })
    })

    it('should handle logout', async () => {
      // Start authenticated
      ;(useAuth as any).mockReturnValue({
        user: mockUser,
        isAuthenticated: true
      })

      const { rerender } = render(
        <AnalyticsProvider>
          <TestComponent />
        </AnalyticsProvider>
      )

      await waitFor(() => {
        expect(mockTrackUser).toHaveBeenCalledTimes(1)
      })

      // Logout
      ;(useAuth as any).mockReturnValue({
        user: null,
        isAuthenticated: false
      })

      rerender(
        <AnalyticsProvider>
          <TestComponent />
        </AnalyticsProvider>
      )

      // Should not track again
      await waitFor(() => {
        expect(mockTrackUser).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('edge cases', () => {
    it('should handle null user object', async () => {
      ;(useAuth as any).mockReturnValue({
        user: null,
        isAuthenticated: true // Edge case: authenticated but no user
      })

      render(
        <AnalyticsProvider>
          <TestComponent />
        </AnalyticsProvider>
      )

      await waitFor(() => {
        expect(mockTrackUser).not.toHaveBeenCalled()
        expect(mockSetUserProperties).not.toHaveBeenCalled()
      })
    })

    it('should handle user with undefined roles', async () => {
      const userWithUndefinedRoles = { ...mockUser, Roles: undefined }
      
      ;(useAuth as any).mockReturnValue({
        user: userWithUndefinedRoles,
        isAuthenticated: true
      })

      render(
        <AnalyticsProvider>
          <TestComponent />
        </AnalyticsProvider>
      )

      await waitFor(() => {
        expect(mockTrackUser).toHaveBeenCalledWith({
          user_id: '123',
          user_role: 'user'
        })

        expect(mockSetUserProperties).toHaveBeenCalledWith({
          [CUSTOM_DIMENSIONS.USER_ROLE]: 'user',
          [CUSTOM_DIMENSIONS.USER_PERMISSIONS]: '',
          [CUSTOM_DIMENSIONS.ENVIRONMENT]: 'test'
        })
      })
    })

    it('should handle user with single role', async () => {
      const userWithSingleRole = { ...mockUser, Roles: ['Editor'] }
      
      ;(useAuth as any).mockReturnValue({
        user: userWithSingleRole,
        isAuthenticated: true
      })

      render(
        <AnalyticsProvider>
          <TestComponent />
        </AnalyticsProvider>
      )

      await waitFor(() => {
        expect(mockTrackUser).toHaveBeenCalledWith({
          user_id: '123',
          user_role: 'Editor'
        })

        expect(mockSetUserProperties).toHaveBeenCalledWith({
          [CUSTOM_DIMENSIONS.USER_ROLE]: 'Editor',
          [CUSTOM_DIMENSIONS.USER_PERMISSIONS]: 'Editor',
          [CUSTOM_DIMENSIONS.ENVIRONMENT]: 'test'
        })
      })
    })
  })

  describe('multiple renders', () => {
    it('should not duplicate tracking on re-renders with same user', async () => {
      ;(useAuth as any).mockReturnValue({
        user: mockUser,
        isAuthenticated: true
      })

      const { rerender } = render(
        <AnalyticsProvider>
          <TestComponent />
        </AnalyticsProvider>
      )

      await waitFor(() => {
        expect(mockTrackUser).toHaveBeenCalledTimes(1)
      })

      // Re-render with same user
      rerender(
        <AnalyticsProvider>
          <TestComponent />
        </AnalyticsProvider>
      )

      // Should not track again
      await waitFor(() => {
        expect(mockTrackUser).toHaveBeenCalledTimes(1)
      })
    })

    it('should track when user changes', async () => {
      ;(useAuth as any).mockReturnValue({
        user: mockUser,
        isAuthenticated: true
      })

      const { rerender } = render(
        <AnalyticsProvider>
          <TestComponent />
        </AnalyticsProvider>
      )

      await waitFor(() => {
        expect(mockTrackUser).toHaveBeenCalledTimes(1)
      })

      // Change user
      const newUser = { ...mockUser, Id: '456', Roles: ['User'] }
      ;(useAuth as any).mockReturnValue({
        user: newUser,
        isAuthenticated: true
      })

      rerender(
        <AnalyticsProvider>
          <TestComponent />
        </AnalyticsProvider>
      )

      await waitFor(() => {
        expect(mockTrackUser).toHaveBeenCalledTimes(2)
        expect(mockTrackUser).toHaveBeenLastCalledWith({
          user_id: '456',
          user_role: 'User'
        })
      })
    })
  })

  describe('error handling', () => {
    it('should handle tracking errors gracefully', async () => {
      mockTrackUser.mockImplementation(() => {
        throw new Error('Tracking error')
      })

      ;(useAuth as any).mockReturnValue({
        user: mockUser,
        isAuthenticated: true
      })

      // Should not throw
      expect(() => {
        render(
          <AnalyticsProvider>
            <TestComponent />
          </AnalyticsProvider>
        )
      }).not.toThrow()
    })

    it('should handle setUserProperties errors gracefully', async () => {
      mockSetUserProperties.mockImplementation(() => {
        throw new Error('Properties error')
      })

      ;(useAuth as any).mockReturnValue({
        user: mockUser,
        isAuthenticated: true
      })

      // Should not throw
      expect(() => {
        render(
          <AnalyticsProvider>
            <TestComponent />
          </AnalyticsProvider>
        )
      }).not.toThrow()
    })
  })

  describe('integration with multiple children', () => {
    it('should provide context to multiple children', () => {
      const ChildComponent1 = () => {
        const { isInitialized } = useAnalyticsContext()
        return <div>Child 1: {isInitialized.toString()}</div>
      }

      const ChildComponent2 = () => {
        const { optOut } = useAnalyticsContext()
        return <button onClick={optOut}>Child 2 Opt Out</button>
      }

      render(
        <AnalyticsProvider>
          <ChildComponent1 />
          <ChildComponent2 />
        </AnalyticsProvider>
      )

      expect(screen.getByText('Child 1: true')).toBeInTheDocument()
      expect(screen.getByText('Child 2 Opt Out')).toBeInTheDocument()

      // Click should work
      screen.getByText('Child 2 Opt Out').click()
      expect(mockOptOut).toHaveBeenCalled()
    })
  })
})