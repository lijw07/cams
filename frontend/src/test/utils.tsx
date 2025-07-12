import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { ThemeProvider } from '@/contexts/ThemeContext'

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  // Create a new QueryClient for each test to avoid test pollution
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  })

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }
export { default as userEvent } from '@testing-library/user-event'

// Mock data factories
export const createMockUser = (overrides = {}) => ({
  Id: '123e4567-e89b-12d3-a456-426614174000',
  Username: 'testuser',
  Email: 'test@example.com',
  FirstName: 'Test',
  LastName: 'User',
  IsActive: true,
  CreatedAt: new Date().toISOString(),
  UpdatedAt: new Date().toISOString(),
  LastLoginAt: new Date().toISOString(),
  Roles: ['User'],
  ...overrides,
})

export const createMockApplication = (overrides = {}) => ({
  Id: '123e4567-e89b-12d3-a456-426614174001',
  Name: 'Test Application',
  Description: 'Test application description',
  Version: '1.0.0',
  Environment: 'Development',
  Tags: 'test,app',
  IsActive: true,
  CreatedAt: new Date().toISOString(),
  UpdatedAt: new Date().toISOString(),
  LastAccessedAt: new Date().toISOString(),
  DatabaseConnectionCount: 0,
  DatabaseConnections: [],
  ...overrides,
})

export const createMockDatabaseConnection = (overrides = {}) => ({
  Id: '123e4567-e89b-12d3-a456-426614174002',
  Name: 'Test Database',
  Type: 'SqlServer',
  TypeName: 'Microsoft SQL Server',
  ConnectionString: 'Server=localhost;Database=test;',
  Description: 'Test database connection',
  IsActive: true,
  Status: 'Active',
  StatusName: 'Active',
  CreatedAt: new Date().toISOString(),
  UpdatedAt: new Date().toISOString(),
  LastTestedAt: new Date().toISOString(),
  ...overrides,
})

export const createMockRole = (overrides = {}) => ({
  Id: '123e4567-e89b-12d3-a456-426614174003',
  Name: 'TestRole',
  Description: 'Test role description',
  IsActive: true,
  IsSystem: false,
  CreatedAt: new Date().toISOString(),
  UpdatedAt: new Date().toISOString(),
  UserCount: 0,
  ...overrides,
})

// Mock API responses
export const createMockApiResponse = <T>(data: T, success = true) => ({
  Success: success,
  Data: data,
  Error: success ? null : {
    Code: 'TEST_ERROR',
    Message: 'Test error message',
    Details: {},
  },
})

export const createMockPaginatedResponse = <T>(data: T[], page = 1, pageSize = 10) => ({
  Success: true,
  Data: {
    Items: data,
    TotalCount: data.length,
    Page: page,
    PageSize: pageSize,
    TotalPages: Math.ceil(data.length / pageSize),
    HasNext: page * pageSize < data.length,
    HasPrevious: page > 1,
  },
  Error: null,
})

// Wait for async operations in tests
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

// Mock window location
export const mockLocation = (url: string) => {
  delete (window as any).location
  window.location = new URL(url) as any
}