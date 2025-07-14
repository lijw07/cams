import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Applications from '@/pages/Applications'
import { useNotifications } from '@/contexts/NotificationContext'
import { applicationService } from '@/services/applicationService'

// Mock dependencies
vi.mock('@/contexts/NotificationContext')
vi.mock('@/services/applicationService')
vi.mock('@/pages/DatabaseConnections', () => ({
  default: () => <div data-testid="database-connections">Database Connections Component</div>
}))
vi.mock('@/components/common/Pagination', () => ({
  default: ({ currentPage, totalPages, onPageChange }: any) => (
    <div data-testid="pagination">
      <button onClick={() => onPageChange(currentPage - 1)}>Previous</button>
      <span>Page {currentPage} of {totalPages}</span>
      <button onClick={() => onPageChange(currentPage + 1)}>Next</button>
    </div>
  )
}))
vi.mock('@/components/modals/ApplicationModal', () => ({
  default: ({ isOpen, onClose, onSubmit, application, mode }: any) => {
    if (!isOpen) return null
    return (
      <div data-testid="application-modal">
        <h2>{mode === 'edit' ? 'Edit' : 'Create'} Application</h2>
        {application && <div>Editing: {application.Name}</div>}
        <button onClick={onClose}>Close</button>
        <button onClick={() => onSubmit({ Name: 'Updated App' })}>Submit</button>
      </div>
    )
  }
}))
vi.mock('@/components/modals/ApplicationWithConnectionModal', () => ({
  default: ({ isOpen, onClose, onSubmit }: any) => {
    if (!isOpen) return null
    return (
      <div data-testid="application-with-connection-modal">
        <h2>Create Application with Connection</h2>
        <button onClick={onClose}>Close</button>
        <button onClick={() => onSubmit({ Application: { Name: 'New App' }, DatabaseConnection: {} })}>Submit</button>
      </div>
    )
  }
}))

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Package: () => <div data-testid="package-icon">Package</div>,
  Plus: () => <div data-testid="plus-icon">Plus</div>,
  Edit: () => <div data-testid="edit-icon">Edit</div>,
  Trash2: () => <div data-testid="trash-icon">Trash</div>,
  ToggleLeft: () => <div data-testid="toggle-left-icon">ToggleLeft</div>,
  ToggleRight: () => <div data-testid="toggle-right-icon">ToggleRight</div>,
  Database: () => <div data-testid="database-icon">Database</div>,
  Search: () => <div data-testid="search-icon">Search</div>,
  Plug: () => <div data-testid="plug-icon">Plug</div>
}))

const renderApplications = () => {
  return render(
    <BrowserRouter>
      <Applications />
    </BrowserRouter>
  )
}

describe('Applications', () => {
  const mockAddNotification = vi.fn()
  const mockApplications = [
    {
      Id: '1',
      Name: 'Test App 1',
      Description: 'Test application 1',
      Version: '1.0.0',
      Environment: 'Production',
      Tags: 'tag1,tag2',
      IsActive: true,
      DatabaseConnectionCount: 2,
      CreatedAt: '2024-01-01',
      UpdatedAt: '2024-01-02'
    },
    {
      Id: '2',
      Name: 'Test App 2',
      Description: 'Test application 2',
      Version: '2.0.0',
      Environment: 'Development',
      Tags: 'tag3',
      IsActive: false,
      DatabaseConnectionCount: 0,
      CreatedAt: '2024-01-03',
      UpdatedAt: '2024-01-04'
    }
  ]

  const mockPagedResult = {
    Items: mockApplications,
    TotalCount: 2,
    PageNumber: 1,
    PageSize: 9,
    TotalPages: 1
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock notifications
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

    // Mock application service
    vi.mocked(applicationService.getApplicationsPaginated).mockResolvedValue(mockPagedResult)
    vi.mocked(applicationService.getApplicationConnections).mockResolvedValue([])
    vi.mocked(applicationService.updateApplication).mockResolvedValue(undefined)
    vi.mocked(applicationService.toggleApplicationStatus).mockResolvedValue(undefined)
    vi.mocked(applicationService.deleteApplication).mockResolvedValue(undefined)
    vi.mocked(applicationService.createApplicationWithConnection).mockResolvedValue({
      Application: mockApplications[0],
      DatabaseConnection: null,
      ConnectionTestResult: true,
      ConnectionTestMessage: null
    })

    // Mock window.confirm
    global.confirm = vi.fn(() => true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial render', () => {
    it('should render page header', async () => {
      renderApplications()

      expect(screen.getByText('Application Management')).toBeInTheDocument()
      expect(screen.getByText('Manage applications, database connections, and testing')).toBeInTheDocument()
    })

    it('should render tab navigation', async () => {
      renderApplications()

      expect(screen.getByText('Applications')).toBeInTheDocument()
      expect(screen.getByText('Database Connections')).toBeInTheDocument()
    })

    it('should fetch applications on mount', async () => {
      renderApplications()

      await waitFor(() => {
        expect(applicationService.getApplicationsPaginated).toHaveBeenCalledWith({
          PageNumber: 1,
          PageSize: 9,
          SearchTerm: undefined,
          SortBy: 'Name',
          SortDirection: 'asc'
        })
      })
    })

    it('should display loading state', () => {
      vi.mocked(applicationService.getApplicationsPaginated).mockImplementation(() => new Promise(() => {}))
      
      renderApplications()

      expect(screen.getByText('Loading applications...')).toBeInTheDocument()
      expect(screen.getByTestId(/animate-spin/i, { exact: false })).toBeInTheDocument()
    })
  })

  describe('application display', () => {
    it('should display applications after loading', async () => {
      renderApplications()

      await waitFor(() => {
        expect(screen.getByText('Test App 1')).toBeInTheDocument()
        expect(screen.getByText('Test App 2')).toBeInTheDocument()
      })
    })

    it('should display application details', async () => {
      renderApplications()

      await waitFor(() => {
        expect(screen.getByText('Test application 1')).toBeInTheDocument()
        expect(screen.getByText('Production')).toBeInTheDocument()
        expect(screen.getByText('Version: 1.0.0')).toBeInTheDocument()
        expect(screen.getByText('2 Connections')).toBeInTheDocument()
      })
    })

    it('should display active/inactive status', async () => {
      renderApplications()

      await waitFor(() => {
        const activeButtons = screen.getAllByText('Active')
        const inactiveButtons = screen.getAllByText('Inactive')
        expect(activeButtons).toHaveLength(1)
        expect(inactiveButtons).toHaveLength(1)
      })
    })

    it('should display empty state when no applications', async () => {
      vi.mocked(applicationService.getApplicationsPaginated).mockResolvedValue({
        Items: [],
        TotalCount: 0,
        PageNumber: 1,
        PageSize: 9,
        TotalPages: 0
      })

      renderApplications()

      await waitFor(() => {
        expect(screen.getByText('No applications yet')).toBeInTheDocument()
        expect(screen.getByText('Create your first application to get started with connection management.')).toBeInTheDocument()
      })
    })
  })

  describe('search functionality', () => {
    it('should search applications on input', async () => {
      const user = userEvent.setup()
      renderApplications()

      await waitFor(() => {
        expect(screen.getByText('Test App 1')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search applications...')
      await user.type(searchInput, 'production')

      await waitFor(() => {
        expect(applicationService.getApplicationsPaginated).toHaveBeenLastCalledWith({
          PageNumber: 1,
          PageSize: 9,
          SearchTerm: 'production',
          SortBy: 'Name',
          SortDirection: 'asc'
        })
      })
    })

    it('should reset to first page when searching', async () => {
      const user = userEvent.setup()
      renderApplications()

      await waitFor(() => {
        expect(screen.getByText('Test App 1')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search applications...')
      await user.type(searchInput, 'test')

      await waitFor(() => {
        expect(applicationService.getApplicationsPaginated).toHaveBeenLastCalledWith(
          expect.objectContaining({
            PageNumber: 1,
            SearchTerm: 'test'
          })
        )
      })
    })

    it('should display search empty state', async () => {
      vi.mocked(applicationService.getApplicationsPaginated).mockResolvedValue({
        Items: [],
        TotalCount: 0,
        PageNumber: 1,
        PageSize: 9,
        TotalPages: 0
      })

      const user = userEvent.setup()
      renderApplications()

      const searchInput = screen.getByPlaceholderText('Search applications...')
      await user.type(searchInput, 'nonexistent')

      await waitFor(() => {
        expect(screen.getByText('No matching applications')).toBeInTheDocument()
        expect(screen.getByText('No applications found for "nonexistent". Try adjusting your search.')).toBeInTheDocument()
      })
    })
  })

  describe('sorting', () => {
    it('should sort by different fields', async () => {
      renderApplications()

      await waitFor(() => {
        expect(screen.getByText('Test App 1')).toBeInTheDocument()
      })

      const sortSelect = screen.getByRole('combobox', { name: /sort by/i })
      fireEvent.change(sortSelect, { target: { value: 'CreatedAt' } })

      await waitFor(() => {
        expect(applicationService.getApplicationsPaginated).toHaveBeenLastCalledWith(
          expect.objectContaining({
            SortBy: 'CreatedAt',
            SortDirection: 'asc'
          })
        )
      })
    })

    it('should toggle sort direction', async () => {
      renderApplications()

      await waitFor(() => {
        expect(screen.getByText('Test App 1')).toBeInTheDocument()
      })

      const sortButton = screen.getByTitle('Sort descending')
      fireEvent.click(sortButton)

      await waitFor(() => {
        expect(applicationService.getApplicationsPaginated).toHaveBeenLastCalledWith(
          expect.objectContaining({
            SortDirection: 'desc'
          })
        )
      })
    })
  })

  describe('pagination', () => {
    it('should change page size', async () => {
      renderApplications()

      await waitFor(() => {
        expect(screen.getByText('Test App 1')).toBeInTheDocument()
      })

      const pageSizeSelect = screen.getByRole('combobox', { name: /show/i })
      fireEvent.change(pageSizeSelect, { target: { value: '12' } })

      await waitFor(() => {
        expect(applicationService.getApplicationsPaginated).toHaveBeenLastCalledWith(
          expect.objectContaining({
            PageSize: 12,
            PageNumber: 1
          })
        )
      })
    })

    it('should render pagination when multiple pages', async () => {
      vi.mocked(applicationService.getApplicationsPaginated).mockResolvedValue({
        ...mockPagedResult,
        TotalPages: 3
      })

      renderApplications()

      await waitFor(() => {
        expect(screen.getByTestId('pagination')).toBeInTheDocument()
        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
      })
    })
  })

  describe('application actions', () => {
    it('should toggle application status', async () => {
      renderApplications()

      await waitFor(() => {
        expect(screen.getByText('Test App 1')).toBeInTheDocument()
      })

      const toggleButtons = screen.getAllByTitle('Deactivate')
      fireEvent.click(toggleButtons[0])

      await waitFor(() => {
        expect(applicationService.toggleApplicationStatus).toHaveBeenCalledWith('1', false)
        expect(mockAddNotification).toHaveBeenCalledWith({
          title: 'Success',
          message: 'Application deactivated successfully',
          type: 'success',
          source: 'Applications'
        })
      })
    })

    it('should delete application with confirmation', async () => {
      renderApplications()

      await waitFor(() => {
        expect(screen.getByText('Test App 1')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByTitle('Delete')
      fireEvent.click(deleteButtons[0])

      expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete this application?')

      await waitFor(() => {
        expect(applicationService.deleteApplication).toHaveBeenCalledWith('1')
        expect(mockAddNotification).toHaveBeenCalledWith({
          title: 'Success',
          message: 'Application deleted successfully',
          type: 'success',
          source: 'Applications'
        })
      })
    })

    it('should not delete application if not confirmed', async () => {
      global.confirm = vi.fn(() => false)
      
      renderApplications()

      await waitFor(() => {
        expect(screen.getByText('Test App 1')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByTitle('Delete')
      fireEvent.click(deleteButtons[0])

      expect(applicationService.deleteApplication).not.toHaveBeenCalled()
    })

    it('should open edit modal on card click', async () => {
      renderApplications()

      await waitFor(() => {
        expect(screen.getByText('Test App 1')).toBeInTheDocument()
      })

      const appCard = screen.getByText('Test App 1').closest('.bg-white')
      fireEvent.click(appCard!)

      await waitFor(() => {
        expect(applicationService.getApplicationConnections).toHaveBeenCalledWith('1')
        expect(screen.getByTestId('application-modal')).toBeInTheDocument()
        expect(screen.getByText('Edit Application')).toBeInTheDocument()
        expect(screen.getByText('Editing: Test App 1')).toBeInTheDocument()
      })
    })

    it('should open edit modal on edit button click', async () => {
      renderApplications()

      await waitFor(() => {
        expect(screen.getByText('Test App 1')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByTitle('Edit')
      fireEvent.click(editButtons[0])

      await waitFor(() => {
        expect(screen.getByTestId('application-modal')).toBeInTheDocument()
      })
    })

    it('should update application', async () => {
      renderApplications()

      await waitFor(() => {
        expect(screen.getByText('Test App 1')).toBeInTheDocument()
      })

      // Open edit modal
      const editButtons = screen.getAllByTitle('Edit')
      fireEvent.click(editButtons[0])

      await waitFor(() => {
        expect(screen.getByTestId('application-modal')).toBeInTheDocument()
      })

      // Submit form
      const submitButton = screen.getByText('Submit')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(applicationService.updateApplication).toHaveBeenCalledWith('1', {
          Name: 'Updated App',
          Id: '1'
        })
        expect(mockAddNotification).toHaveBeenCalledWith({
          title: 'Success',
          message: 'Application updated successfully',
          type: 'success',
          source: 'Applications'
        })
      })
    })
  })

  describe('create application', () => {
    it('should open create modal on button click', async () => {
      renderApplications()

      await waitFor(() => {
        expect(screen.getByText('Test App 1')).toBeInTheDocument()
      })

      const createButton = screen.getByRole('button', { name: /new application/i })
      fireEvent.click(createButton)

      expect(screen.getByTestId('application-with-connection-modal')).toBeInTheDocument()
      expect(screen.getByText('Create Application with Connection')).toBeInTheDocument()
    })

    it('should create application with connection', async () => {
      renderApplications()

      const createButton = screen.getByRole('button', { name: /new application/i })
      fireEvent.click(createButton)

      const submitButton = screen.getByText('Submit')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(applicationService.createApplicationWithConnection).toHaveBeenCalled()
        expect(mockAddNotification).toHaveBeenCalledWith({
          title: 'Success',
          message: 'Application and connection created successfully',
          type: 'success',
          source: 'Applications'
        })
      })
    })

    it('should show connection test success', async () => {
      renderApplications()

      const createButton = screen.getByRole('button', { name: /new application/i })
      fireEvent.click(createButton)

      const submitButton = screen.getByText('Submit')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith({
          title: 'Success',
          message: 'Database connection test passed',
          type: 'success',
          source: 'Applications'
        })
      })
    })

    it('should show connection test failure', async () => {
      vi.mocked(applicationService.createApplicationWithConnection).mockResolvedValue({
        Application: mockApplications[0],
        DatabaseConnection: null,
        ConnectionTestResult: false,
        ConnectionTestMessage: 'Connection failed'
      })

      renderApplications()

      const createButton = screen.getByRole('button', { name: /new application/i })
      fireEvent.click(createButton)

      const submitButton = screen.getByText('Submit')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith({
          title: 'Error',
          message: 'Connection test failed: Connection failed',
          type: 'error',
          source: 'Applications'
        })
      })
    })
  })

  describe('tab navigation', () => {
    it('should switch to connections tab', async () => {
      renderApplications()

      const connectionsTab = screen.getByRole('button', { name: /database connections/i })
      fireEvent.click(connectionsTab)

      await waitFor(() => {
        expect(screen.getByTestId('database-connections')).toBeInTheDocument()
        expect(screen.queryByText('Test App 1')).not.toBeInTheDocument()
      })
    })

    it('should show application count in tab', async () => {
      renderApplications()

      await waitFor(() => {
        const countBadge = screen.getByText('2')
        expect(countBadge).toBeInTheDocument()
        expect(countBadge.parentElement).toHaveClass('rounded-full')
      })
    })

    it('should hide create button on connections tab', async () => {
      renderApplications()

      expect(screen.getByRole('button', { name: /new application/i })).toBeInTheDocument()

      const connectionsTab = screen.getByRole('button', { name: /database connections/i })
      fireEvent.click(connectionsTab)

      expect(screen.queryByRole('button', { name: /new application/i })).not.toBeInTheDocument()
    })
  })

  describe('error handling', () => {
    it('should handle fetch error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.mocked(applicationService.getApplicationsPaginated).mockRejectedValue(new Error('Fetch failed'))

      renderApplications()

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith({
          title: 'Error',
          message: 'Failed to load applications',
          type: 'error',
          source: 'Applications'
        })
      })

      consoleErrorSpy.mockRestore()
    })

    it('should handle update error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.mocked(applicationService.updateApplication).mockRejectedValue(new Error('Update failed'))

      renderApplications()

      await waitFor(() => {
        expect(screen.getByText('Test App 1')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByTitle('Edit')
      fireEvent.click(editButtons[0])

      await waitFor(() => {
        expect(screen.getByTestId('application-modal')).toBeInTheDocument()
      })

      const submitButton = screen.getByText('Submit')
      
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith({
          title: 'Error',
          message: 'Failed to update application',
          type: 'error',
          source: 'Applications'
        })
      })

      consoleErrorSpy.mockRestore()
    })

    it('should handle validation errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const validationError = {
        response: {
          data: {
            errors: {
              Name: ['Name is required'],
              Version: ['Invalid version format']
            }
          }
        }
      }
      vi.mocked(applicationService.createApplicationWithConnection).mockRejectedValue(validationError)

      renderApplications()

      const createButton = screen.getByRole('button', { name: /new application/i })
      fireEvent.click(createButton)

      const submitButton = screen.getByText('Submit')
      
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith({
          title: 'Validation Error',
          message: 'Name: Name is required; Version: Invalid version format',
          type: 'error',
          source: 'Applications'
        })
      })

      consoleErrorSpy.mockRestore()
    })

    it('should handle connection loading error gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.mocked(applicationService.getApplicationConnections).mockRejectedValue(new Error('Connection load failed'))

      renderApplications()

      await waitFor(() => {
        expect(screen.getByText('Test App 1')).toBeInTheDocument()
      })

      const appCard = screen.getByText('Test App 1').closest('.bg-white')
      fireEvent.click(appCard!)

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith({
          title: 'Warning',
          message: 'Could not load database connections. You can still edit the application.',
          type: 'error',
          source: 'Applications'
        })
        expect(screen.getByTestId('application-modal')).toBeInTheDocument()
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('links', () => {
    it('should render application detail links', async () => {
      renderApplications()

      await waitFor(() => {
        const links = screen.getAllByRole('link')
        const connectionLink = links.find(link => link.textContent?.includes('2 Connections'))
        expect(connectionLink).toHaveAttribute('href', '/applications/1')
      })
    })
  })
})