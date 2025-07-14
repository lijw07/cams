import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import Input from '@/components/common/Input'

describe('Input', () => {
  it('should render basic input', () => {
    render(<Input placeholder="Enter text" />)
    
    const input = screen.getByPlaceholderText('Enter text')
    expect(input).toBeInTheDocument()
  })

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>()
    render(<Input ref={ref} />)
    
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  describe('appearance', () => {
    it('should apply full width by default', () => {
      render(<Input />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('w-full')
    })

    it('should not apply full width when fullWidth is false', () => {
      render(<Input fullWidth={false} />)
      
      const input = screen.getByRole('textbox')
      expect(input).not.toHaveClass('w-full')
    })

    it('should apply custom className', () => {
      render(<Input className="custom-class" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('custom-class')
    })

    it('should have base styling classes', () => {
      render(<Input />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('flex h-10 rounded-lg border px-3 py-2 text-sm')
      expect(input).toHaveClass('focus-visible:outline-none')
      expect(input).toHaveClass('focus-visible:ring-2')
    })
  })

  describe('error state', () => {
    it('should apply error styles when error is true', () => {
      render(<Input error />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('border-error-300')
      expect(input).toHaveClass('bg-error-50')
      expect(input).toHaveClass('text-error-900')
      expect(input).toHaveClass('focus-visible:ring-error-500')
    })

    it('should apply normal styles when error is false', () => {
      render(<Input error={false} />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('border-secondary-300')
      expect(input).toHaveClass('bg-white')
      expect(input).toHaveClass('text-secondary-900')
      expect(input).toHaveClass('focus-visible:ring-primary-500')
    })

    it('should set aria-invalid based on error prop', () => {
      const { rerender } = render(<Input error={true} />)
      
      let input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-invalid', 'true')
      
      rerender(<Input error={false} />)
      
      input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-invalid', 'false')
    })
  })

  describe('user interaction', () => {
    it('should handle text input', async () => {
      const user = userEvent.setup()
      render(<Input />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'Hello World')
      
      expect(input).toHaveValue('Hello World')
    })

    it('should call onChange handler', () => {
      const handleChange = vi.fn()
      render(<Input onChange={handleChange} />)
      
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'Test' } })
      
      expect(handleChange).toHaveBeenCalled()
      expect(input).toHaveValue('Test')
    })

    it('should call onFocus handler', () => {
      const handleFocus = vi.fn()
      render(<Input onFocus={handleFocus} />)
      
      const input = screen.getByRole('textbox')
      fireEvent.focus(input)
      
      expect(handleFocus).toHaveBeenCalled()
    })

    it('should call onBlur handler', () => {
      const handleBlur = vi.fn()
      render(<Input onBlur={handleBlur} />)
      
      const input = screen.getByRole('textbox')
      fireEvent.blur(input)
      
      expect(handleBlur).toHaveBeenCalled()
    })
  })

  describe('disabled state', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Input disabled />)
      
      const input = screen.getByRole('textbox')
      expect(input).toBeDisabled()
      expect(input).toHaveClass('disabled:cursor-not-allowed')
      expect(input).toHaveClass('disabled:opacity-50')
    })

    it('should not accept input when disabled', async () => {
      const user = userEvent.setup()
      render(<Input disabled />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'Should not work')
      
      expect(input).toHaveValue('')
    })
  })

  describe('accessibility', () => {
    it('should support aria-describedby', () => {
      render(
        <>
          <Input aria-describedby="help-text" />
          <span id="help-text">This is help text</span>
        </>
      )
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-describedby', 'help-text')
    })

    it('should support aria-required', () => {
      render(<Input aria-required="true" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-required', 'true')
    })

    it('should support explicit aria-invalid over error prop', () => {
      render(<Input error={false} aria-invalid="true" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('should support aria-label', () => {
      render(<Input aria-label="Search input" />)
      
      const input = screen.getByRole('textbox', { name: 'Search input' })
      expect(input).toBeInTheDocument()
    })
  })

  describe('input types', () => {
    it('should support email type', () => {
      render(<Input type="email" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'email')
    })

    it('should support password type', () => {
      render(<Input type="password" placeholder="Password" />)
      
      // Password inputs don't have role="textbox"
      const input = screen.getByPlaceholderText('Password')
      expect(input).toHaveAttribute('type', 'password')
    })

    it('should support number type', () => {
      render(<Input type="number" />)
      
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('type', 'number')
    })

    it('should support search type', () => {
      render(<Input type="search" />)
      
      const input = screen.getByRole('searchbox')
      expect(input).toHaveAttribute('type', 'search')
    })

    it('should support tel type', () => {
      render(<Input type="tel" placeholder="Phone" />)
      
      const input = screen.getByPlaceholderText('Phone')
      expect(input).toHaveAttribute('type', 'tel')
    })

    it('should support url type', () => {
      render(<Input type="url" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'url')
    })
  })

  describe('HTML attributes', () => {
    it('should support placeholder', () => {
      render(<Input placeholder="Enter your name" />)
      
      const input = screen.getByPlaceholderText('Enter your name')
      expect(input).toBeInTheDocument()
    })

    it('should support name attribute', () => {
      render(<Input name="username" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('name', 'username')
    })

    it('should support id attribute', () => {
      render(<Input id="my-input" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('id', 'my-input')
    })

    it('should support maxLength', () => {
      render(<Input maxLength={10} />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('maxLength', '10')
    })

    it('should support pattern', () => {
      render(<Input pattern="[0-9]*" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('pattern', '[0-9]*')
    })

    it('should support autoComplete', () => {
      render(<Input autoComplete="email" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('autoComplete', 'email')
    })

    it('should support readOnly', () => {
      render(<Input readOnly value="Read only text" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('readOnly')
      expect(input).toHaveValue('Read only text')
    })

    it('should support required', () => {
      render(<Input required />)
      
      const input = screen.getByRole('textbox')
      expect(input).toBeRequired()
    })
  })

  describe('controlled vs uncontrolled', () => {
    it('should work as controlled component', () => {
      const { rerender } = render(<Input value="initial" onChange={() => {}} />)
      
      let input = screen.getByRole('textbox')
      expect(input).toHaveValue('initial')
      
      rerender(<Input value="updated" onChange={() => {}} />)
      
      input = screen.getByRole('textbox')
      expect(input).toHaveValue('updated')
    })

    it('should work as uncontrolled component', () => {
      render(<Input defaultValue="default" />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('default')
      
      fireEvent.change(input, { target: { value: 'changed' } })
      expect(input).toHaveValue('changed')
    })
  })

  describe('edge cases', () => {
    it('should handle very long text', async () => {
      const user = userEvent.setup()
      const longText = 'a'.repeat(1000)
      render(<Input />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, longText)
      
      expect(input).toHaveValue(longText)
    })

    it('should handle special characters', async () => {
      const user = userEvent.setup()
      const specialText = '!@#$%^&*()_+-='
      render(<Input />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, specialText)
      
      expect(input).toHaveValue(specialText)
    })

    it('should handle paste events', async () => {
      const user = userEvent.setup()
      render(<Input />)
      
      const input = screen.getByRole('textbox')
      await user.click(input)
      await user.paste('Pasted text')
      
      expect(input).toHaveValue('Pasted text')
    })

    it('should handle keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<Input value="Hello World" />)
      
      const input = screen.getByRole('textbox') as HTMLInputElement
      await user.click(input)
      
      // Move cursor to beginning
      input.setSelectionRange(0, 0)
      
      // Use arrow keys
      await user.keyboard('{ArrowRight}{ArrowRight}')
      
      expect(input.selectionStart).toBe(2)
    })
  })

  describe('file input handling', () => {
    it('should apply file-specific classes', () => {
      const { container } = render(<Input type="file" />)
      
      const input = container.querySelector('input[type="file"]')
      expect(input).toHaveClass('file:border-0')
      expect(input).toHaveClass('file:bg-transparent')
      expect(input).toHaveClass('file:text-sm')
      expect(input).toHaveClass('file:font-medium')
    })
  })
})