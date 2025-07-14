import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext'

// Test component to access theme context
const TestComponent: React.FC = () => {
  const { theme, setTheme, currentTheme } = useTheme()
  
  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <div data-testid="current-theme">{currentTheme}</div>
      <button onClick={() => setTheme('light')}>Light</button>
      <button onClick={() => setTheme('dark')}>Dark</button>
      <button onClick={() => setTheme('system')}>System</button>
    </div>
  )
}

describe('ThemeContext', () => {
  let mockMatchMedia: any
  const originalMatchMedia = window.matchMedia

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear()
    
    // Reset document classes
    document.documentElement.classList.remove('dark')
    
    // Mock matchMedia
    mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
    
    window.matchMedia = mockMatchMedia
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
    vi.clearAllMocks()
  })

  describe('useTheme hook', () => {
    it('should throw error when used outside ThemeProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      expect(() => {
        render(<TestComponent />)
      }).toThrow('useTheme must be used within a ThemeProvider')
      
      consoleSpy.mockRestore()
    })
  })

  describe('initial state', () => {
    it('should default to system theme', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByTestId('theme')).toHaveTextContent('system')
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('should load theme from localStorage', () => {
      localStorage.setItem('theme', 'dark')

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('should respect system dark mode preference', () => {
      mockMatchMedia.mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByTestId('theme')).toHaveTextContent('system')
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })

  describe('theme switching', () => {
    it('should switch to light theme', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      const lightButton = screen.getByText('Light')
      
      act(() => {
        lightButton.click()
      })

      expect(screen.getByTestId('theme')).toHaveTextContent('light')
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
      expect(document.documentElement.classList.contains('dark')).toBe(false)
      expect(localStorage.getItem('theme')).toBe('light')
    })

    it('should switch to dark theme', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      const darkButton = screen.getByText('Dark')
      
      act(() => {
        darkButton.click()
      })

      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(localStorage.getItem('theme')).toBe('dark')
    })

    it('should switch back to system theme', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      // First switch to dark
      act(() => {
        screen.getByText('Dark').click()
      })

      expect(document.documentElement.classList.contains('dark')).toBe(true)

      // Then back to system
      act(() => {
        screen.getByText('System').click()
      })

      expect(screen.getByTestId('theme')).toHaveTextContent('system')
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
      expect(document.documentElement.classList.contains('dark')).toBe(false)
      expect(localStorage.getItem('theme')).toBe('system')
    })
  })

  describe('system theme changes', () => {
    it('should respond to system theme changes when using system theme', () => {
      let changeListener: ((e: MediaQueryListEvent) => void) | null = null
      
      mockMatchMedia.mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
          if (event === 'change') {
            changeListener = listener
          }
        }),
        removeEventListener: vi.fn(),
      }))

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByTestId('current-theme')).toHaveTextContent('light')

      // Simulate system theme change to dark
      act(() => {
        if (changeListener) {
          changeListener({ matches: true } as MediaQueryListEvent)
        }
      })

      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)

      // Simulate system theme change back to light
      act(() => {
        if (changeListener) {
          changeListener({ matches: false } as MediaQueryListEvent)
        }
      })

      expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('should not respond to system changes when using explicit theme', () => {
      let changeListener: ((e: MediaQueryListEvent) => void) | null = null
      
      mockMatchMedia.mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
          if (event === 'change') {
            changeListener = listener
          }
        }),
        removeEventListener: vi.fn(),
      }))

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      // Set explicit dark theme
      act(() => {
        screen.getByText('Dark').click()
      })

      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)

      // Simulate system theme change - should not affect current theme
      act(() => {
        if (changeListener) {
          changeListener({ matches: false } as MediaQueryListEvent)
        }
      })

      // Should still be dark
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('should cleanup event listeners on unmount', () => {
      const removeEventListenerSpy = vi.fn()
      
      mockMatchMedia.mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: removeEventListenerSpy,
      }))

      const { unmount } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function))
    })
  })

  describe('multiple theme changes', () => {
    it('should handle rapid theme changes', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      const lightButton = screen.getByText('Light')
      const darkButton = screen.getByText('Dark')
      const systemButton = screen.getByText('System')

      // Rapid changes
      act(() => {
        lightButton.click()
        darkButton.click()
        systemButton.click()
        darkButton.click()
      })

      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(localStorage.getItem('theme')).toBe('dark')
    })

    it('should maintain theme across component re-renders', () => {
      const { rerender } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      // Set dark theme
      act(() => {
        screen.getByText('Dark').click()
      })

      expect(screen.getByTestId('theme')).toHaveTextContent('dark')

      // Re-render
      rerender(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      // Theme should persist
      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle invalid localStorage values', () => {
      localStorage.setItem('theme', 'invalid-theme')

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      // Should default to system
      expect(screen.getByTestId('theme')).toHaveTextContent('system')
    })

    it('should handle localStorage errors', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error')
      })

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      // Should not throw when clicking theme buttons
      expect(() => {
        act(() => {
          screen.getByText('Dark').click()
        })
      }).not.toThrow()

      setItemSpy.mockRestore()
    })

    it('should handle missing documentElement', () => {
      // Save original
      const originalDocumentElement = document.documentElement
      
      // Mock documentElement
      Object.defineProperty(document, 'documentElement', {
        value: null,
        configurable: true,
      })

      // Should not throw
      expect(() => {
        render(
          <ThemeProvider>
            <TestComponent />
          </ThemeProvider>
        )
      }).not.toThrow()

      // Restore
      Object.defineProperty(document, 'documentElement', {
        value: originalDocumentElement,
        configurable: true,
      })
    })
  })

  describe('integration with multiple providers', () => {
    it('should work with nested providers', () => {
      const WrapperComponent = ({ children }: { children: React.ReactNode }) => (
        <div>
          <div>Wrapper</div>
          {children}
        </div>
      )

      render(
        <WrapperComponent>
          <ThemeProvider>
            <TestComponent />
          </ThemeProvider>
        </WrapperComponent>
      )

      expect(screen.getByText('Wrapper')).toBeInTheDocument()
      expect(screen.getByTestId('theme')).toHaveTextContent('system')

      // Theme switching should still work
      act(() => {
        screen.getByText('Dark').click()
      })

      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })

  describe('performance', () => {
    it('should not cause unnecessary re-renders', () => {
      let renderCount = 0

      const CountingComponent = () => {
        const { theme } = useTheme()
        renderCount++
        return <div>Theme: {theme}, Renders: {renderCount}</div>
      }

      render(
        <ThemeProvider>
          <CountingComponent />
        </ThemeProvider>
      )

      // Initial render + effect
      const initialRenders = renderCount

      // Same theme selection should not cause re-render
      act(() => {
        const savedTheme = localStorage.getItem('theme') || 'system'
        localStorage.setItem('theme', savedTheme)
      })

      expect(renderCount).toBe(initialRenders)
    })
  })
})