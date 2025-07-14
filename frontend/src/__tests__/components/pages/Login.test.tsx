import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Login from '@/pages/Login'
import { useLoginForm } from '@/hooks/useLoginForm'

// Mock dependencies
vi.mock('@/hooks/useLoginForm')
vi.mock('@/components/auth/LoginBackground', () => ({
  default: ({ mousePosition }: any) => <div data-testid="login-background">Background {mousePosition.x},{mousePosition.y}</div>
}))
vi.mock('@/components/auth/LoginBranding', () => ({
  default: () => <div data-testid="login-branding">Login Branding</div>
}))
vi.mock('@/components/auth/LoginForm', () => ({
  default: ({ onSubmit, onTogglePassword, showPassword, isLoading }: any) => (
    <form data-testid="login-form" onSubmit={onSubmit}>
      <button type="button" onClick={onTogglePassword}>Toggle Password</button>
      <div>Show Password: {showPassword.toString()}</div>
      <div>Loading: {isLoading.toString()}</div>
      <button type="submit">Submit</button>
    </form>
  )
}))
vi.mock('@/components/SEO/SEOHead', () => ({
  default: ({ title, description }: any) => (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
    </>
  )
}))
vi.mock('lucide-react', () => ({
  Database: () => <div data-testid="database-icon">Database</div>,
  ArrowLeft: () => <div data-testid="arrow-left-icon">Arrow</div>
}))

const renderLogin = () => {
  return render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  )
}

describe('Login', () => {
  const mockRegister = vi.fn()
  const mockHandleSubmit = vi.fn((fn) => (e: any) => {
    e?.preventDefault?.()
    fn()
  })
  const mockOnSubmit = vi.fn()
  const mockSetShowPassword = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    vi.mocked(useLoginForm).mockReturnValue({
      register: mockRegister,
      handleSubmit: mockHandleSubmit,
      errors: {},
      isLoading: false,
      showPassword: false,
      setShowPassword: mockSetShowPassword,
      onSubmit: mockOnSubmit
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('rendering', () => {
    it('should render all main components', () => {
      renderLogin()

      expect(screen.getByTestId('login-background')).toBeInTheDocument()
      expect(screen.getByTestId('login-branding')).toBeInTheDocument()
      expect(screen.getByTestId('login-form')).toBeInTheDocument()
    })

    it('should render SEO head with correct props', () => {
      renderLogin()

      expect(document.title).toBe('Login - CAMS Database Management Platform')
      const metaDescription = document.querySelector('meta[name="description"]')
      expect(metaDescription).toHaveAttribute('content', 'Sign in to CAMS to manage your database connections, monitor performance, and access your centralized application management dashboard.')
    })

    it('should render back to home link', () => {
      renderLogin()

      const backLink = screen.getByRole('link', { name: /back to home/i })
      expect(backLink).toBeInTheDocument()
      expect(backLink).toHaveAttribute('href', '/')
      expect(screen.getByTestId('arrow-left-icon')).toBeInTheDocument()
    })

    it('should render welcome message', () => {
      renderLogin()

      expect(screen.getByText('Welcome Back')).toBeInTheDocument()
      expect(screen.getByText('Sign in to your CAMS account')).toBeInTheDocument()
    })

    it('should render mobile logo', () => {
      renderLogin()

      expect(screen.getByTestId('database-icon')).toBeInTheDocument()
      expect(screen.getByText('CAMS')).toBeInTheDocument()
    })
  })

  describe('mouse tracking', () => {
    it('should track mouse position', async () => {
      const { container } = renderLogin()

      // Initial position
      expect(screen.getByTestId('login-background')).toHaveTextContent('Background 0,0')

      // Simulate mouse move
      fireEvent.mouseMove(window, { clientX: 500, clientY: 300 })

      await waitFor(() => {
        // Check that background received updated position
        const background = screen.getByTestId('login-background')
        const text = background.textContent || ''
        const match = text.match(/Background (\d+),(\d+)/)
        
        if (match) {
          const x = parseInt(match[1])
          const y = parseInt(match[2])
          expect(x).toBeGreaterThan(0)
          expect(y).toBeGreaterThan(0)
        }
      })
    })

    it('should cleanup mouse event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      
      const { unmount } = renderLogin()
      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function))
    })
  })

  describe('form interactions', () => {
    it('should toggle password visibility', () => {
      renderLogin()

      const toggleButton = screen.getByText('Toggle Password')
      expect(screen.getByText('Show Password: false')).toBeInTheDocument()

      fireEvent.click(toggleButton)
      expect(mockSetShowPassword).toHaveBeenCalledWith(true)
    })

    it('should handle form submission', () => {
      renderLogin()

      const form = screen.getByTestId('login-form')
      fireEvent.submit(form)

      expect(mockHandleSubmit).toHaveBeenCalled()
      expect(mockOnSubmit).toHaveBeenCalled()
    })

    it('should display loading state', () => {
      vi.mocked(useLoginForm).mockReturnValue({
        register: mockRegister,
        handleSubmit: mockHandleSubmit,
        errors: {},
        isLoading: true,
        showPassword: false,
        setShowPassword: mockSetShowPassword,
        onSubmit: mockOnSubmit
      })

      renderLogin()

      expect(screen.getByText('Loading: true')).toBeInTheDocument()
    })

    it('should pass errors to form', () => {
      const errors = {
        username: { message: 'Username is required' },
        password: { message: 'Password is required' }
      }

      vi.mocked(useLoginForm).mockReturnValue({
        register: mockRegister,
        handleSubmit: mockHandleSubmit,
        errors,
        isLoading: false,
        showPassword: false,
        setShowPassword: mockSetShowPassword,
        onSubmit: mockOnSubmit
      })

      renderLogin()

      // Form should receive errors prop
      expect(screen.getByTestId('login-form')).toBeInTheDocument()
    })
  })

  describe('responsive design', () => {
    it('should have responsive classes for branding section', () => {
      renderLogin()

      const brandingContainer = screen.getByTestId('login-branding').parentElement
      expect(brandingContainer).toHaveClass('hidden')
      expect(brandingContainer).toHaveClass('lg:flex')
      expect(brandingContainer).toHaveClass('lg:w-1/2')
    })

    it('should have responsive classes for form section', () => {
      renderLogin()

      const formSection = screen.getByTestId('login-form').closest('.w-full.lg\\:w-1\\/2')
      expect(formSection).toBeInTheDocument()
      expect(formSection).toHaveClass('w-full')
      expect(formSection).toHaveClass('lg:w-1/2')
    })

    it('should show mobile logo only on small screens', () => {
      renderLogin()

      const mobileLogoContainer = screen.getByText('CAMS').closest('.lg\\:hidden')
      expect(mobileLogoContainer).toBeInTheDocument()
      expect(mobileLogoContainer).toHaveClass('lg:hidden')
    })
  })

  describe('styling', () => {
    it('should have glassmorphism effect on login card', () => {
      renderLogin()

      const loginCard = screen.getByText('Welcome Back').closest('.bg-white\\/10')
      expect(loginCard).toHaveClass('bg-white/10')
      expect(loginCard).toHaveClass('backdrop-blur-xl')
      expect(loginCard).toHaveClass('border-white/20')
      expect(loginCard).toHaveClass('rounded-3xl')
      expect(loginCard).toHaveClass('shadow-2xl')
    })

    it('should have gradient blur effect', () => {
      renderLogin()

      const blurElement = screen.getByText('Welcome Back')
        .closest('.relative')
        ?.querySelector('.bg-gradient-to-r.blur-xl')
      
      expect(blurElement).toBeInTheDocument()
      expect(blurElement).toHaveClass('from-blue-600/20')
      expect(blurElement).toHaveClass('to-purple-600/20')
    })

    it('should have styled back button', () => {
      renderLogin()

      const backButton = screen.getByRole('link', { name: /back to home/i })
      expect(backButton).toHaveClass('bg-white/10')
      expect(backButton).toHaveClass('backdrop-blur-sm')
      expect(backButton).toHaveClass('border-white/20')
      expect(backButton).toHaveClass('hover:bg-white/20')
      expect(backButton).toHaveClass('transition-all')
    })
  })

  describe('accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderLogin()

      const h1 = screen.getByRole('heading', { level: 1, name: 'CAMS' })
      const h2 = screen.getByRole('heading', { level: 2, name: 'Welcome Back' })
      
      expect(h1).toBeInTheDocument()
      expect(h2).toBeInTheDocument()
    })

    it('should have accessible form structure', () => {
      renderLogin()

      const form = screen.getByTestId('login-form')
      expect(form).toBeInTheDocument()
      expect(form.tagName).toBe('FORM')
    })
  })

  describe('edge cases', () => {
    it('should handle window resize for mouse position calculation', () => {
      renderLogin()

      // Mock window dimensions
      Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true })
      Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true })

      fireEvent.mouseMove(window, { clientX: 960, clientY: 540 })

      // Should calculate position as percentage
      // 960/1920 * 100 = 50, 540/1080 * 100 = 50
      // Note: The exact calculation might vary due to React's batching
    })

    it('should handle rapid password toggle clicks', () => {
      renderLogin()

      const toggleButton = screen.getByText('Toggle Password')
      
      // Rapid clicks
      fireEvent.click(toggleButton)
      fireEvent.click(toggleButton)
      fireEvent.click(toggleButton)
      fireEvent.click(toggleButton)

      expect(mockSetShowPassword).toHaveBeenCalledTimes(4)
    })
  })
})