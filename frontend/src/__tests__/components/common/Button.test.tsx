import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Button from '@/components/common/Button'

describe('Button', () => {
  it('should render with children text', () => {
    render(<Button>Click me</Button>)
    
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
  })

  it('should render with default variant and size', () => {
    render(<Button>Default Button</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-primary-600')
    expect(button).toHaveClass('px-4 py-2')
  })

  describe('variants', () => {
    it('should render primary variant', () => {
      render(<Button variant="primary">Primary</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-primary-600 text-white hover:bg-primary-700')
    })

    it('should render secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-secondary-200')
    })

    it('should render outline variant', () => {
      render(<Button variant="outline">Outline</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('border border-secondary-300')
    })

    it('should render success variant', () => {
      render(<Button variant="success">Success</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-success-600')
    })

    it('should render warning variant', () => {
      render(<Button variant="warning">Warning</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-warning-600')
    })

    it('should render error variant', () => {
      render(<Button variant="error">Error</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-error-600')
    })
  })

  describe('sizes', () => {
    it('should render small size', () => {
      render(<Button size="sm">Small</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-3 py-1.5 text-xs')
    })

    it('should render medium size', () => {
      render(<Button size="md">Medium</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-4 py-2 text-sm')
    })

    it('should render large size', () => {
      render(<Button size="lg">Large</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-6 py-3 text-base')
    })
  })

  describe('loading state', () => {
    it('should show loading spinner when loading', () => {
      render(<Button loading>Loading</Button>)
      
      const button = screen.getByRole('button')
      const spinner = button.querySelector('.animate-spin')
      
      expect(spinner).toBeInTheDocument()
      expect(button).toHaveAttribute('aria-busy', 'true')
    })

    it('should be disabled when loading', () => {
      render(<Button loading>Loading</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should not show spinner when not loading', () => {
      render(<Button>Not Loading</Button>)
      
      const button = screen.getByRole('button')
      const spinner = button.querySelector('.animate-spin')
      
      expect(spinner).not.toBeInTheDocument()
      expect(button).toHaveAttribute('aria-busy', 'false')
    })
  })

  describe('disabled state', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:opacity-50')
    })

    it('should not trigger onClick when disabled', () => {
      const handleClick = vi.fn()
      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      )
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('click handling', () => {
    it('should call onClick handler when clicked', () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Click me</Button>)
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should not call onClick when loading', () => {
      const handleClick = vi.fn()
      render(
        <Button loading onClick={handleClick}>
          Loading
        </Button>
      )
      
      const button = screen.getByRole('button')
      fireEvent.click(button)
      
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('custom props', () => {
    it('should apply custom className', () => {
      render(<Button className="custom-class">Custom</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })

    it('should pass through aria-label', () => {
      render(<Button aria-label="Custom label">Icon</Button>)
      
      const button = screen.getByRole('button', { name: 'Custom label' })
      expect(button).toBeInTheDocument()
    })

    it('should pass through other HTML button attributes', () => {
      render(
        <Button 
          type="submit" 
          form="myForm" 
          name="submitButton"
          value="submitted"
        >
          Submit
        </Button>
      )
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'submit')
      expect(button).toHaveAttribute('form', 'myForm')
      expect(button).toHaveAttribute('name', 'submitButton')
      expect(button).toHaveAttribute('value', 'submitted')
    })
  })

  describe('focus behavior', () => {
    it('should have focus-visible styles', () => {
      render(<Button>Focus me</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('focus-visible:outline-none')
      expect(button).toHaveClass('focus-visible:ring-2')
      expect(button).toHaveClass('focus-visible:ring-offset-2')
    })
  })

  describe('complex children', () => {
    it('should render with icon and text', () => {
      render(
        <Button>
          <span className="icon">🚀</span>
          <span>Launch</span>
        </Button>
      )
      
      const button = screen.getByRole('button')
      expect(button).toHaveTextContent('🚀Launch')
    })

    it('should render with nested elements', () => {
      render(
        <Button>
          <div>
            <strong>Bold</strong> text
          </div>
        </Button>
      )
      
      const button = screen.getByRole('button')
      expect(button.querySelector('strong')).toBeInTheDocument()
      expect(button).toHaveTextContent('Bold text')
    })
  })

  describe('accessibility', () => {
    it('should be keyboard accessible', () => {
      render(<Button>Keyboard accessible</Button>)
      
      const button = screen.getByRole('button')
      button.focus()
      
      expect(document.activeElement).toBe(button)
    })

    it('should announce loading state to screen readers', () => {
      const { rerender } = render(<Button>Save</Button>)
      
      let button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-busy', 'false')
      
      rerender(<Button loading>Save</Button>)
      
      button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-busy', 'true')
    })

    it('should have appropriate ARIA attributes when disabled', () => {
      render(<Button disabled>Disabled</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })
  })

  describe('edge cases', () => {
    it('should handle empty children gracefully', () => {
      render(<Button>{''}</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should handle multiple classNames correctly', () => {
      render(
        <Button 
          variant="secondary" 
          size="lg" 
          className="extra-class another-class"
        >
          Multi-class
        </Button>
      )
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-secondary-200')
      expect(button).toHaveClass('px-6 py-3')
      expect(button).toHaveClass('extra-class')
      expect(button).toHaveClass('another-class')
    })

    it('should handle rapid clicks', () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Rapid Click</Button>)
      
      const button = screen.getByRole('button')
      
      // Simulate rapid clicks
      for (let i = 0; i < 10; i++) {
        fireEvent.click(button)
      }
      
      expect(handleClick).toHaveBeenCalledTimes(10)
    })
  })
})