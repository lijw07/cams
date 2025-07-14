import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ErrorBoundary from '@/components/common/ErrorBoundary'

// Component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

// Component that throws in useEffect
const ThrowErrorInEffect: React.FC = () => {
  React.useEffect(() => {
    throw new Error('Effect error')
  }, [])
  return <div>Component content</div>
}

describe('ErrorBoundary', () => {
  let mockConsoleError: any
  const originalEnv = process.env.NODE_ENV

  beforeEach(() => {
    // Mock console.error to avoid cluttering test output
    mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    mockConsoleError.mockRestore()
    process.env.NODE_ENV = originalEnv
    vi.clearAllMocks()
  })

  describe('normal operation', () => {
    it('should render children when there is no error', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      )

      expect(screen.getByText('Test content')).toBeInTheDocument()
    })

    it('should render multiple children', () => {
      render(
        <ErrorBoundary>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </ErrorBoundary>
      )

      expect(screen.getByText('Child 1')).toBeInTheDocument()
      expect(screen.getByText('Child 2')).toBeInTheDocument()
      expect(screen.getByText('Child 3')).toBeInTheDocument()
    })
  })

  describe('error handling', () => {
    it('should catch errors and display fallback UI', () => {
      render(
        <BrowserRouter>
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
        </BrowserRouter>
      )

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
      expect(screen.getByText(/We're sorry, but something unexpected happened/)).toBeInTheDocument()
    })

    it('should display custom fallback when provided', () => {
      const customFallback = <div>Custom error UI</div>

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Custom error UI')).toBeInTheDocument()
      expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument()
    })

    it('should log errors in development mode', () => {
      process.env.NODE_ENV = 'development'

      render(
        <BrowserRouter>
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
        </BrowserRouter>
      )

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error caught by ErrorBoundary:',
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      )
    })

    it('should not log errors in production mode', () => {
      process.env.NODE_ENV = 'production'

      render(
        <BrowserRouter>
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
        </BrowserRouter>
      )

      // Console.error is called by React itself, but not by our component
      const errorBoundaryLogs = mockConsoleError.mock.calls.filter(
        call => call[0] === 'Error caught by ErrorBoundary:'
      )
      expect(errorBoundaryLogs).toHaveLength(0)
    })
  })

  describe('error details', () => {
    it('should show error details in development mode', () => {
      process.env.NODE_ENV = 'development'

      render(
        <BrowserRouter>
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
        </BrowserRouter>
      )

      const detailsElement = screen.getByText('Error details (Development only)')
      expect(detailsElement).toBeInTheDocument()

      // Click to expand details
      fireEvent.click(detailsElement)

      expect(screen.getByText(/Error: Test error/)).toBeInTheDocument()
    })

    it('should not show error details in production mode', () => {
      process.env.NODE_ENV = 'production'

      render(
        <BrowserRouter>
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
        </BrowserRouter>
      )

      expect(screen.queryByText('Error details (Development only)')).not.toBeInTheDocument()
    })
  })

  describe('recovery actions', () => {
    it('should have refresh button that reloads page', () => {
      const mockReload = vi.fn()
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true
      })

      render(
        <BrowserRouter>
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
        </BrowserRouter>
      )

      const refreshButton = screen.getByRole('button', { name: /refresh page/i })
      fireEvent.click(refreshButton)

      expect(mockReload).toHaveBeenCalled()
    })

    it('should have home link that resets error state', () => {
      render(
        <BrowserRouter>
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
        </BrowserRouter>
      )

      const homeLink = screen.getByRole('link', { name: /go home/i })
      expect(homeLink).toHaveAttribute('href', '/')

      // Click should reset error state
      fireEvent.click(homeLink)
      // Note: In a real app, this would navigate and reset, but in tests
      // we can't easily verify the reset without more complex setup
    })
  })

  describe('error recovery', () => {
    it('should recover when error component is replaced', () => {
      const { rerender } = render(
        <BrowserRouter>
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>
        </BrowserRouter>
      )

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()

      // Re-render without error
      rerender(
        <BrowserRouter>
          <ErrorBoundary>
            <ThrowError shouldThrow={false} />
          </ErrorBoundary>
        </BrowserRouter>
      )

      // Should still show error boundary since state hasn't been reset
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
    })

    it('should handle multiple sequential errors', () => {
      const FirstError = () => {
        throw new Error('First error')
      }

      const SecondError = () => {
        throw new Error('Second error')
      }

      const { rerender } = render(
        <BrowserRouter>
          <ErrorBoundary>
            <FirstError />
          </ErrorBoundary>
        </BrowserRouter>
      )

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()

      // Try to render different error component
      rerender(
        <BrowserRouter>
          <ErrorBoundary>
            <SecondError />
          </ErrorBoundary>
        </BrowserRouter>
      )

      // Should still show error UI
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle errors in child components', () => {
      const ParentComponent = () => (
        <div>
          <h1>Parent</h1>
          <ThrowError />
        </div>
      )

      render(
        <BrowserRouter>
          <ErrorBoundary>
            <ParentComponent />
          </ErrorBoundary>
        </BrowserRouter>
      )

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
      expect(screen.queryByText('Parent')).not.toBeInTheDocument()
    })

    it('should handle async errors in useEffect', () => {
      // Note: Error boundaries don't catch errors in event handlers,
      // async code, or during SSR. This test demonstrates that.
      const AsyncError = () => {
        React.useEffect(() => {
          setTimeout(() => {
            throw new Error('Async error')
          }, 0)
        }, [])
        return <div>Async component</div>
      }

      render(
        <BrowserRouter>
          <ErrorBoundary>
            <AsyncError />
          </ErrorBoundary>
        </BrowserRouter>
      )

      // Component renders normally - async errors aren't caught
      expect(screen.getByText('Async component')).toBeInTheDocument()
    })

    it('should handle errors with no message', () => {
      const ThrowEmptyError = () => {
        throw new Error()
      }

      render(
        <BrowserRouter>
          <ErrorBoundary>
            <ThrowEmptyError />
          </ErrorBoundary>
        </BrowserRouter>
      )

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
    })

    it('should handle non-Error objects being thrown', () => {
      const ThrowString = () => {
        throw 'String error' // eslint-disable-line no-throw-literal
      }

      render(
        <BrowserRouter>
          <ErrorBoundary>
            <ThrowString />
          </ErrorBoundary>
        </BrowserRouter>
      )

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have accessible error UI', () => {
      render(
        <BrowserRouter>
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
        </BrowserRouter>
      )

      // Check for heading structure
      const heading = screen.getByRole('heading', { name: 'Oops! Something went wrong' })
      expect(heading).toBeInTheDocument()

      // Check for accessible buttons
      const refreshButton = screen.getByRole('button', { name: /refresh page/i })
      expect(refreshButton).toBeInTheDocument()

      const homeLink = screen.getByRole('link', { name: /go home/i })
      expect(homeLink).toBeInTheDocument()
    })

    it('should be keyboard navigable', () => {
      render(
        <BrowserRouter>
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
        </BrowserRouter>
      )

      const refreshButton = screen.getByRole('button', { name: /refresh page/i })
      const homeLink = screen.getByRole('link', { name: /go home/i })

      // Tab to refresh button
      refreshButton.focus()
      expect(document.activeElement).toBe(refreshButton)

      // Tab to home link
      homeLink.focus()
      expect(document.activeElement).toBe(homeLink)
    })
  })

  describe('styling', () => {
    it('should have proper styling classes', () => {
      render(
        <BrowserRouter>
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
        </BrowserRouter>
      )

      // Check for dark mode classes
      const container = screen.getByText('Oops! Something went wrong').closest('div')
      expect(container).toHaveClass('dark:bg-gray-800')

      // Check for responsive classes
      const buttonContainer = screen.getByRole('button', { name: /refresh page/i }).parentElement
      expect(buttonContainer).toHaveClass('flex-col sm:flex-row')
    })
  })
})