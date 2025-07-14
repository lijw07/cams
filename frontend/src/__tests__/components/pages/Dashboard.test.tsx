import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Dashboard from '@/pages/Dashboard'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { dashboardService } from '@/services/dashboardService'

// Mock dependencies
vi.mock('@/contexts/AuthContext')
vi.mock('@/contexts/NotificationContext')
vi.mock('@/services/dashboardService')

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Package: () => <div data-testid="package-icon">Package</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
  Shield: () => <div data-testid="shield-icon">Shield</div>
}))

const renderDashboard = () => {
  return render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  )
}

describe('Dashboard', () => {
  const mockAddNotification = vi.fn()
  const mockUser = {
    Id: '123',
    Username: 'testuser',
    FirstName: 'Test',
    LastName: 'User',
    Email: 'test@example.com',
    Roles: ['User']
  }

  const mockStats = {
    totalUsers: 42,
    totalApplications: 15,
    totalRoles: 5
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock auth context
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUserProfile: vi.fn(),
      updateProfile: vi.fn(),
      changePassword: vi.fn(),
      changeEmail: vi.fn()
    })

    // Mock notifications context
    vi.mocked(useNotifications).mockReturnValue({
      notifications: [],
      unreadCount: 0,
      addNotification: mockAddNotification,
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      removeNotification: vi.fn(),
      deleteNotification: vi.fn(),
      clearAllNotifications: vi.fn(),
      showNotificationDetails: vi.fn(),
      handleNotificationClick: vi.fn()
    })

    // Mock dashboard service
    vi.mocked(dashboardService.getDashboardStats).mockResolvedValue(mockStats)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('header', () => {
    it('should display welcome message with user first name', async () => {
      renderDashboard()

      expect(screen.getByText('Welcome back, Test!')).toBeInTheDocument()
      expect(screen.getByText("Here's an overview of your applications and database connections.")).toBeInTheDocument()
    })

    it('should display username when first name is not available', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { ...mockUser, FirstName: undefined },
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        refreshUserProfile: vi.fn(),
        updateProfile: vi.fn(),
        changePassword: vi.fn(),
        changeEmail: vi.fn()
      })

      renderDashboard()

      expect(screen.getByText('Welcome back, testuser!')).toBeInTheDocument()
    })

    it('should handle null user gracefully', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        refreshUserProfile: vi.fn(),
        updateProfile: vi.fn(),
        changePassword: vi.fn(),
        changeEmail: vi.fn()
      })

      renderDashboard()

      expect(screen.getByText('Welcome back, !')).toBeInTheDocument()
    })
  })

  describe('statistics', () => {
    it('should fetch and display dashboard statistics', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(dashboardService.getDashboardStats).toHaveBeenCalled()
        expect(screen.getByText('42')).toBeInTheDocument() // Total Users
        expect(screen.getByText('15')).toBeInTheDocument() // Total Applications
        expect(screen.getByText('5')).toBeInTheDocument()  // Total Roles
      })
    })

    it('should show loading state while fetching stats', () => {
      renderDashboard()

      // Check for loading placeholders by class
      const loadingElements = document.querySelectorAll('.animate-pulse')
      expect(loadingElements.length).toBeGreaterThan(0)
    })

    it('should handle API errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = new Error('API Error')
      vi.mocked(dashboardService.getDashboardStats).mockRejectedValue(error)

      renderDashboard()

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith({
          title: 'Error',
          message: 'Failed to load dashboard statistics',
          type: 'error',
          source: 'Dashboard'
        })
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching dashboard stats:', error)
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('stat cards', () => {
    it('should render all stat cards with correct information', async () => {
      renderDashboard()

      await waitFor(() => {
        // Check card titles
        expect(screen.getByText('Total Users')).toBeInTheDocument()
        expect(screen.getByText('Total Applications')).toBeInTheDocument()
        expect(screen.getByText('Total Roles')).toBeInTheDocument()

        // Check icons
        expect(screen.getByTestId('users-icon')).toBeInTheDocument()
        expect(screen.getByTestId('package-icon')).toBeInTheDocument()
        expect(screen.getByTestId('shield-icon')).toBeInTheDocument()
      })
    })

    it('should have correct links for each stat card', async () => {
      renderDashboard()

      await waitFor(() => {
        const links = screen.getAllByRole('link')
        
        expect(links[0]).toHaveAttribute('href', '/management/users')
        expect(links[1]).toHaveAttribute('href', '/applications')
        expect(links[2]).toHaveAttribute('href', '/management/roles')
      })
    })

    it('should apply correct colors to stat card icons', async () => {
      renderDashboard()

      await waitFor(() => {
        const statCards = screen.getAllByRole('link')
        
        // Check for color classes in icon containers
        expect(statCards[0].innerHTML).toContain('bg-purple-500')
        expect(statCards[1].innerHTML).toContain('bg-blue-500')
        expect(statCards[2].innerHTML).toContain('bg-green-500')
      })
    })

    it('should have hover effect on stat cards', async () => {
      renderDashboard()

      await waitFor(() => {
        const statCards = screen.getAllByRole('link')
        
        statCards.forEach(card => {
          const cardDiv = card.querySelector('.hover\\:shadow-lg')
          expect(cardDiv).toBeInTheDocument()
          expect(cardDiv).toHaveClass('transition-shadow')
          expect(cardDiv).toHaveClass('cursor-pointer')
        })
      })
    })
  })

  describe('responsive design', () => {
    it('should have responsive grid layout', async () => {
      renderDashboard()

      await waitFor(() => {
        const grid = screen.getByText('Total Users').closest('.grid')
        expect(grid).toHaveClass('grid-cols-1')
        expect(grid).toHaveClass('md:grid-cols-2')
        expect(grid).toHaveClass('lg:grid-cols-3')
      })
    })
  })

  describe('dark mode', () => {
    it('should have dark mode classes', async () => {
      renderDashboard()

      await waitFor(() => {
        // Check header dark mode
        const header = screen.getByText(/Welcome back/).closest('.bg-white')
        expect(header).toHaveClass('dark:bg-gray-800')

        // Check stat cards dark mode
        const statCard = screen.getByText('Total Users').closest('.bg-white')
        expect(statCard).toHaveClass('dark:bg-gray-800')

        // Check text dark mode
        expect(screen.getByText(/Welcome back/)).toHaveClass('dark:text-white')
        expect(screen.getByText(/Here's an overview/)).toHaveClass('dark:text-gray-300')
      })
    })
  })

  describe('accessibility', () => {
    it('should have proper heading structure', async () => {
      renderDashboard()

      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent(/Welcome back/)
    })

    it('should have accessible links', async () => {
      renderDashboard()

      await waitFor(() => {
        const links = screen.getAllByRole('link')
        links.forEach(link => {
          expect(link).toBeInTheDocument()
          expect(link).toHaveAttribute('href')
        })
      })
    })
  })

  describe('edge cases', () => {
    it('should handle zero values correctly', async () => {
      vi.mocked(dashboardService.getDashboardStats).mockResolvedValue({
        totalUsers: 0,
        totalApplications: 0,
        totalRoles: 0
      })

      renderDashboard()

      await waitFor(() => {
        const zeros = screen.getAllByText('0')
        expect(zeros).toHaveLength(3)
      })
    })

    it('should handle large numbers correctly', async () => {
      vi.mocked(dashboardService.getDashboardStats).mockResolvedValue({
        totalUsers: 999999,
        totalApplications: 123456,
        totalRoles: 789
      })

      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText('999999')).toBeInTheDocument()
        expect(screen.getByText('123456')).toBeInTheDocument()
        expect(screen.getByText('789')).toBeInTheDocument()
      })
    })

    it('should handle API returning unexpected data', async () => {
      vi.mocked(dashboardService.getDashboardStats).mockResolvedValue({
        totalUsers: undefined as any,
        totalApplications: null as any,
        totalRoles: 'invalid' as any
      })

      renderDashboard()

      await waitFor(() => {
        // Should handle gracefully - component shouldn't crash
        expect(screen.getByText('Total Users')).toBeInTheDocument()
        expect(screen.getByText('Total Applications')).toBeInTheDocument()
        expect(screen.getByText('Total Roles')).toBeInTheDocument()
      })
    })
  })

  describe('performance', () => {
    it('should memoize stat cards to prevent unnecessary re-renders', async () => {
      const { rerender } = renderDashboard()

      await waitFor(() => {
        expect(screen.getByText('42')).toBeInTheDocument()
      })

      // Force re-render with same data
      rerender(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      )

      // Stats should still be displayed without refetching
      expect(dashboardService.getDashboardStats).toHaveBeenCalledTimes(1)
    })
  })
})