import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NotificationProvider, useNotifications } from '@/contexts/NotificationContext'
import { Notification } from '@/types'

// Mock the NotificationDetailsModal component
vi.mock('@/components/modals/NotificationDetailsModal', () => ({
  default: ({ isOpen, onClose, notification }: any) => {
    if (!isOpen || !notification) return null
    return (
      <div data-testid="notification-modal">
        <h2>{notification.title}</h2>
        <p>{notification.message}</p>
        <button onClick={onClose}>Close</button>
      </div>
    )
  }
}))

// Test component to access notification context
const TestComponent: React.FC = () => {
  const {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    showNotificationDetails,
    handleNotificationClick
  } = useNotifications()

  const testNotification = {
    title: 'Test Notification',
    message: 'Test message',
    type: 'info' as const,
    source: 'Test'
  }

  return (
    <div>
      <div data-testid="notification-count">{notifications.length}</div>
      <div data-testid="unread-count">{unreadCount}</div>
      <button onClick={() => addNotification(testNotification)}>Add Notification</button>
      <button onClick={() => notifications[0] && markAsRead(notifications[0].id)}>Mark First Read</button>
      <button onClick={markAllAsRead}>Mark All Read</button>
      <button onClick={() => notifications[0] && deleteNotification(notifications[0].id)}>Delete First</button>
      <button onClick={clearAllNotifications}>Clear All</button>
      <button onClick={() => notifications[0] && showNotificationDetails(notifications[0])}>Show Details</button>
      <button onClick={() => notifications[0] && handleNotificationClick(notifications[0])}>Handle Click</button>
      
      <div data-testid="notifications">
        {notifications.map(notif => (
          <div key={notif.id} data-testid={`notification-${notif.id}`}>
            <span>{notif.title}</span>
            <span data-testid={`read-${notif.id}`}>{notif.isRead.toString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

describe('NotificationContext', () => {
  const originalConsoleError = console.error
  const originalConsoleLog = console.log

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear()
    // Mock console methods
    console.error = vi.fn()
    console.log = vi.fn()
  })

  afterEach(() => {
    console.error = originalConsoleError
    console.log = originalConsoleLog
    vi.clearAllMocks()
  })

  describe('useNotifications hook', () => {
    it('should throw error when used outside NotificationProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      expect(() => {
        render(<TestComponent />)
      }).toThrow('useNotifications must be used within a NotificationProvider')
      
      consoleSpy.mockRestore()
    })
  })

  describe('initial state', () => {
    it('should start with empty notifications', () => {
      render(
        <BrowserRouter>
          <NotificationProvider>
            <TestComponent />
          </NotificationProvider>
        </BrowserRouter>
      )

      expect(screen.getByTestId('notification-count')).toHaveTextContent('0')
      expect(screen.getByTestId('unread-count')).toHaveTextContent('0')
    })

    it('should load notifications from localStorage', () => {
      const savedNotifications = [
        {
          id: '123',
          title: 'Saved Notification',
          message: 'From localStorage',
          type: 'info',
          source: 'Test',
          timestamp: '2024-01-01T12:00:00.000Z',
          isRead: false
        }
      ]
      localStorage.setItem('notifications', JSON.stringify(savedNotifications))

      render(
        <BrowserRouter>
          <NotificationProvider>
            <TestComponent />
          </NotificationProvider>
        </BrowserRouter>
      )

      expect(screen.getByTestId('notification-count')).toHaveTextContent('1')
      expect(screen.getByTestId('unread-count')).toHaveTextContent('1')
      expect(screen.getByText('Saved Notification')).toBeInTheDocument()
    })

    it('should handle invalid localStorage data', () => {
      localStorage.setItem('notifications', 'invalid json')

      render(
        <BrowserRouter>
          <NotificationProvider>
            <TestComponent />
          </NotificationProvider>
        </BrowserRouter>
      )

      expect(screen.getByTestId('notification-count')).toHaveTextContent('0')
      expect(console.error).toHaveBeenCalledWith('Failed to parse saved notifications:', expect.any(Error))
      expect(localStorage.getItem('notifications')).toBeNull()
    })
  })

  describe('adding notifications', () => {
    it('should add new notification', () => {
      render(
        <BrowserRouter>
          <NotificationProvider>
            <TestComponent />
          </NotificationProvider>
        </BrowserRouter>
      )

      const addButton = screen.getByText('Add Notification')
      fireEvent.click(addButton)

      expect(screen.getByTestId('notification-count')).toHaveTextContent('1')
      expect(screen.getByTestId('unread-count')).toHaveTextContent('1')
      expect(screen.getByText('Test Notification')).toBeInTheDocument()
    })

    it('should add notification with unique ID and timestamp', () => {
      render(
        <BrowserRouter>
          <NotificationProvider>
            <TestComponent />
          </NotificationProvider>
        </BrowserRouter>
      )

      const addButton = screen.getByText('Add Notification')
      fireEvent.click(addButton)
      fireEvent.click(addButton)

      const notifications = screen.getByTestId('notifications').children
      expect(notifications).toHaveLength(2)
      
      // Check that IDs are unique
      const firstId = notifications[0].getAttribute('data-testid')
      const secondId = notifications[1].getAttribute('data-testid')
      expect(firstId).not.toBe(secondId)
    })

    it('should save notifications to localStorage', () => {
      render(
        <BrowserRouter>
          <NotificationProvider>
            <TestComponent />
          </NotificationProvider>
        </BrowserRouter>
      )

      const addButton = screen.getByText('Add Notification')
      fireEvent.click(addButton)

      const saved = localStorage.getItem('notifications')
      expect(saved).toBeTruthy()
      
      const parsed = JSON.parse(saved!)
      expect(parsed).toHaveLength(1)
      expect(parsed[0]).toMatchObject({
        title: 'Test Notification',
        message: 'Test message',
        type: 'info',
        source: 'Test',
        isRead: false
      })
    })
  })

  describe('marking as read', () => {
    it('should mark single notification as read', () => {
      render(
        <BrowserRouter>
          <NotificationProvider>
            <TestComponent />
          </NotificationProvider>
        </BrowserRouter>
      )

      // Add a notification
      fireEvent.click(screen.getByText('Add Notification'))
      expect(screen.getByTestId('unread-count')).toHaveTextContent('1')

      // Mark as read
      fireEvent.click(screen.getByText('Mark First Read'))
      expect(screen.getByTestId('unread-count')).toHaveTextContent('0')

      const notification = screen.getByTestId('notifications').children[0]
      const readStatus = notification.querySelector('[data-testid^="read-"]')
      expect(readStatus).toHaveTextContent('true')
    })

    it('should mark all notifications as read', () => {
      render(
        <BrowserRouter>
          <NotificationProvider>
            <TestComponent />
          </NotificationProvider>
        </BrowserRouter>
      )

      // Add multiple notifications
      const addButton = screen.getByText('Add Notification')
      fireEvent.click(addButton)
      fireEvent.click(addButton)
      fireEvent.click(addButton)

      expect(screen.getByTestId('unread-count')).toHaveTextContent('3')

      // Mark all as read
      fireEvent.click(screen.getByText('Mark All Read'))
      expect(screen.getByTestId('unread-count')).toHaveTextContent('0')
    })

    it('should handle marking non-existent notification as read', () => {
      render(
        <BrowserRouter>
          <NotificationProvider>
            <TestComponent />
          </NotificationProvider>
        </BrowserRouter>
      )

      // Try to mark first when none exist
      fireEvent.click(screen.getByText('Mark First Read'))
      
      // Should not throw
      expect(screen.getByTestId('unread-count')).toHaveTextContent('0')
    })
  })

  describe('deleting notifications', () => {
    it('should delete single notification', () => {
      render(
        <BrowserRouter>
          <NotificationProvider>
            <TestComponent />
          </NotificationProvider>
        </BrowserRouter>
      )

      // Add notifications
      const addButton = screen.getByText('Add Notification')
      fireEvent.click(addButton)
      fireEvent.click(addButton)

      expect(screen.getByTestId('notification-count')).toHaveTextContent('2')

      // Delete first
      fireEvent.click(screen.getByText('Delete First'))
      expect(screen.getByTestId('notification-count')).toHaveTextContent('1')
    })

    it('should clear all notifications', () => {
      render(
        <BrowserRouter>
          <NotificationProvider>
            <TestComponent />
          </NotificationProvider>
        </BrowserRouter>
      )

      // Add multiple notifications
      const addButton = screen.getByText('Add Notification')
      fireEvent.click(addButton)
      fireEvent.click(addButton)
      fireEvent.click(addButton)

      expect(screen.getByTestId('notification-count')).toHaveTextContent('3')

      // Clear all
      fireEvent.click(screen.getByText('Clear All'))
      expect(screen.getByTestId('notification-count')).toHaveTextContent('0')
      expect(localStorage.getItem('notifications')).toBe('[]')
    })
  })

  describe('notification details modal', () => {
    it('should show notification details modal', async () => {
      render(
        <BrowserRouter>
          <NotificationProvider>
            <TestComponent />
          </NotificationProvider>
        </BrowserRouter>
      )

      // Add a notification
      fireEvent.click(screen.getByText('Add Notification'))

      // Show details
      fireEvent.click(screen.getByText('Show Details'))

      await waitFor(() => {
        expect(screen.getByTestId('notification-modal')).toBeInTheDocument()
        expect(screen.getByText('Test Notification')).toBeInTheDocument()
        expect(screen.getByText('Test message')).toBeInTheDocument()
      })

      // Should mark as read
      expect(screen.getByTestId('unread-count')).toHaveTextContent('0')
    })

    it('should handle notification click with logging', async () => {
      render(
        <BrowserRouter>
          <NotificationProvider>
            <TestComponent />
          </NotificationProvider>
        </BrowserRouter>
      )

      // Add a notification
      fireEvent.click(screen.getByText('Add Notification'))

      // Handle click
      fireEvent.click(screen.getByText('Handle Click'))

      expect(console.log).toHaveBeenCalledWith('handleNotificationClick called with:', expect.any(Object))
      expect(console.log).toHaveBeenCalledWith('Showing notification details modal')

      await waitFor(() => {
        expect(screen.getByTestId('notification-modal')).toBeInTheDocument()
      })
    })

    it('should close notification modal', async () => {
      render(
        <BrowserRouter>
          <NotificationProvider>
            <TestComponent />
          </NotificationProvider>
        </BrowserRouter>
      )

      // Add and show notification
      fireEvent.click(screen.getByText('Add Notification'))
      fireEvent.click(screen.getByText('Show Details'))

      await waitFor(() => {
        expect(screen.getByTestId('notification-modal')).toBeInTheDocument()
      })

      // Close modal
      fireEvent.click(screen.getByText('Close'))

      await waitFor(() => {
        expect(screen.queryByTestId('notification-modal')).not.toBeInTheDocument()
      })
    })
  })

  describe('complex notification types', () => {
    it('should handle notifications with additional properties', () => {
      const ComplexTestComponent = () => {
        const { addNotification, notifications } = useNotifications()

        const complexNotification = {
          title: 'Complex Notification',
          message: 'Complex message',
          type: 'error' as const,
          source: 'API',
          details: 'Detailed error information',
          technical: 'Stack trace here',
          suggestions: ['Try again', 'Contact support']
        }

        return (
          <div>
            <button onClick={() => addNotification(complexNotification)}>Add Complex</button>
            {notifications.map(notif => (
              <div key={notif.id}>
                <span>{notif.title}</span>
                <span>{notif.details}</span>
                <span>{notif.technical}</span>
                <span>{notif.suggestions?.join(', ')}</span>
              </div>
            ))}
          </div>
        )
      }

      render(
        <BrowserRouter>
          <NotificationProvider>
            <ComplexTestComponent />
          </NotificationProvider>
        </BrowserRouter>
      )

      fireEvent.click(screen.getByText('Add Complex'))

      expect(screen.getByText('Complex Notification')).toBeInTheDocument()
      expect(screen.getByText('Detailed error information')).toBeInTheDocument()
      expect(screen.getByText('Stack trace here')).toBeInTheDocument()
      expect(screen.getByText('Try again, Contact support')).toBeInTheDocument()
    })
  })

  describe('notification ordering', () => {
    it('should add new notifications at the beginning', () => {
      render(
        <BrowserRouter>
          <NotificationProvider>
            <TestComponent />
          </NotificationProvider>
        </BrowserRouter>
      )

      // Add multiple notifications with different content
      const TestComponentWithCustom = () => {
        const { addNotification, notifications } = useNotifications()
        
        return (
          <div>
            <button onClick={() => addNotification({ title: 'First', message: 'msg', type: 'info', source: 'Test' })}>Add First</button>
            <button onClick={() => addNotification({ title: 'Second', message: 'msg', type: 'info', source: 'Test' })}>Add Second</button>
            <div data-testid="notification-list">
              {notifications.map((notif, index) => (
                <div key={notif.id} data-testid={`notif-${index}`}>{notif.title}</div>
              ))}
            </div>
          </div>
        )
      }

      const { unmount } = render(
        <BrowserRouter>
          <NotificationProvider>
            <TestComponentWithCustom />
          </NotificationProvider>
        </BrowserRouter>
      )

      fireEvent.click(screen.getByText('Add First'))
      fireEvent.click(screen.getByText('Add Second'))

      // Second should be first in the list (newer notifications at top)
      expect(screen.getByTestId('notif-0')).toHaveTextContent('Second')
      expect(screen.getByTestId('notif-1')).toHaveTextContent('First')
    })
  })

  describe('edge cases', () => {
    it('should handle empty operations gracefully', () => {
      render(
        <BrowserRouter>
          <NotificationProvider>
            <TestComponent />
          </NotificationProvider>
        </BrowserRouter>
      )

      // Operations on empty list should not throw
      expect(() => {
        fireEvent.click(screen.getByText('Mark First Read'))
        fireEvent.click(screen.getByText('Delete First'))
        fireEvent.click(screen.getByText('Show Details'))
        fireEvent.click(screen.getByText('Handle Click'))
      }).not.toThrow()
    })

    it('should handle localStorage quota exceeded', () => {
      const mockSetItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

      render(
        <BrowserRouter>
          <NotificationProvider>
            <TestComponent />
          </NotificationProvider>
        </BrowserRouter>
      )

      // Should not throw when adding notification
      expect(() => {
        fireEvent.click(screen.getByText('Add Notification'))
      }).not.toThrow()

      mockSetItem.mockRestore()
    })
  })

  describe('notification persistence', () => {
    it('should persist notifications across component remounts', () => {
      const { unmount } = render(
        <BrowserRouter>
          <NotificationProvider>
            <TestComponent />
          </NotificationProvider>
        </BrowserRouter>
      )

      // Add notifications
      fireEvent.click(screen.getByText('Add Notification'))
      expect(screen.getByTestId('notification-count')).toHaveTextContent('1')

      // Unmount
      unmount()

      // Remount
      render(
        <BrowserRouter>
          <NotificationProvider>
            <TestComponent />
          </NotificationProvider>
        </BrowserRouter>
      )

      // Notification should persist
      expect(screen.getByTestId('notification-count')).toHaveTextContent('1')
      expect(screen.getByText('Test Notification')).toBeInTheDocument()
    })
  })
})