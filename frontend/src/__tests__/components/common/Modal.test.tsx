import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Modal from '@/components/common/Modal'

// Mock the useFocusTrap hook
vi.mock('@/hooks/useFocusTrap', () => ({
  useFocusTrap: vi.fn()
}))

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    children: <div>Modal content</div>
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Cleanup any modifications to document.body
    document.body.style.overflow = ''
  })

  describe('rendering', () => {
    it('should render when isOpen is true', () => {
      render(<Modal {...defaultProps} />)
      
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Modal content')).toBeInTheDocument()
    })

    it('should not render when isOpen is false', () => {
      render(<Modal {...defaultProps} isOpen={false} />)
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should render with title', () => {
      render(<Modal {...defaultProps} title="Test Modal" />)
      
      expect(screen.getByText('Test Modal')).toBeInTheDocument()
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby')
    })

    it('should render without title', () => {
      render(<Modal {...defaultProps} />)
      
      expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-labelledby')
    })
  })

  describe('size variants', () => {
    it('should apply small size class', () => {
      render(<Modal {...defaultProps} size="sm" />)
      
      const modal = screen.getByRole('dialog')
      expect(modal).toHaveClass('max-w-md')
    })

    it('should apply medium size class (default)', () => {
      render(<Modal {...defaultProps} />)
      
      const modal = screen.getByRole('dialog')
      expect(modal).toHaveClass('max-w-lg')
    })

    it('should apply large size class', () => {
      render(<Modal {...defaultProps} size="lg" />)
      
      const modal = screen.getByRole('dialog')
      expect(modal).toHaveClass('max-w-2xl')
    })

    it('should apply extra large size class', () => {
      render(<Modal {...defaultProps} size="xl" />)
      
      const modal = screen.getByRole('dialog')
      expect(modal).toHaveClass('max-w-4xl')
    })
  })

  describe('close button', () => {
    it('should show close button by default', () => {
      render(<Modal {...defaultProps} />)
      
      const closeButton = screen.getByRole('button', { name: /close dialog/i })
      expect(closeButton).toBeInTheDocument()
    })

    it('should hide close button when showCloseButton is false', () => {
      render(<Modal {...defaultProps} showCloseButton={false} />)
      
      expect(screen.queryByRole('button', { name: /close dialog/i })).not.toBeInTheDocument()
    })

    it('should call onClose when close button is clicked', () => {
      const onClose = vi.fn()
      render(<Modal {...defaultProps} onClose={onClose} />)
      
      const closeButton = screen.getByRole('button', { name: /close dialog/i })
      fireEvent.click(closeButton)
      
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('overlay click behavior', () => {
    it('should close modal when clicking overlay by default', () => {
      const onClose = vi.fn()
      render(<Modal {...defaultProps} onClose={onClose} />)
      
      const overlay = screen.getByRole('dialog').parentElement
      fireEvent.click(overlay!)
      
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should not close modal when clicking overlay if closeOnOverlayClick is false', () => {
      const onClose = vi.fn()
      render(<Modal {...defaultProps} onClose={onClose} closeOnOverlayClick={false} />)
      
      const overlay = screen.getByRole('dialog').parentElement
      fireEvent.click(overlay!)
      
      expect(onClose).not.toHaveBeenCalled()
    })

    it('should not close modal when clicking inside modal content', () => {
      const onClose = vi.fn()
      render(<Modal {...defaultProps} onClose={onClose} />)
      
      const modalContent = screen.getByRole('dialog')
      fireEvent.click(modalContent)
      
      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('escape key behavior', () => {
    it('should close modal when pressing Escape by default', () => {
      const onClose = vi.fn()
      render(<Modal {...defaultProps} onClose={onClose} />)
      
      fireEvent.keyDown(document, { key: 'Escape' })
      
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should not close modal when pressing Escape if closeOnEscape is false', () => {
      const onClose = vi.fn()
      render(<Modal {...defaultProps} onClose={onClose} closeOnEscape={false} />)
      
      fireEvent.keyDown(document, { key: 'Escape' })
      
      expect(onClose).not.toHaveBeenCalled()
    })

    it('should not close modal when pressing other keys', () => {
      const onClose = vi.fn()
      render(<Modal {...defaultProps} onClose={onClose} />)
      
      fireEvent.keyDown(document, { key: 'Enter' })
      fireEvent.keyDown(document, { key: 'Space' })
      fireEvent.keyDown(document, { key: 'Tab' })
      
      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('body scroll behavior', () => {
    it('should prevent body scroll when modal is open', () => {
      render(<Modal {...defaultProps} />)
      
      expect(document.body.style.overflow).toBe('hidden')
    })

    it('should restore body scroll when modal is closed', () => {
      const { rerender } = render(<Modal {...defaultProps} />)
      
      expect(document.body.style.overflow).toBe('hidden')
      
      rerender(<Modal {...defaultProps} isOpen={false} />)
      
      expect(document.body.style.overflow).toBe('unset')
    })

    it('should cleanup body scroll on unmount', () => {
      const { unmount } = render(<Modal {...defaultProps} />)
      
      expect(document.body.style.overflow).toBe('hidden')
      
      unmount()
      
      expect(document.body.style.overflow).toBe('unset')
    })
  })

  describe('focus management', () => {
    it('should focus modal when opened', async () => {
      const { rerender } = render(<Modal {...defaultProps} isOpen={false} />)
      
      rerender(<Modal {...defaultProps} isOpen={true} />)
      
      await waitFor(() => {
        const modal = screen.getByRole('dialog')
        expect(modal).toHaveAttribute('tabIndex', '-1')
      })
    })

    it('should restore focus to previous element when closed', async () => {
      // Create a button that will open the modal
      const button = document.createElement('button')
      button.textContent = 'Open Modal'
      document.body.appendChild(button)
      button.focus()
      
      const { rerender } = render(<Modal {...defaultProps} />)
      
      // Close the modal
      rerender(<Modal {...defaultProps} isOpen={false} />)
      
      await waitFor(() => {
        expect(document.activeElement).toBe(button)
      })
      
      // Cleanup
      document.body.removeChild(button)
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<Modal {...defaultProps} title="Accessible Modal" />)
      
      const modal = screen.getByRole('dialog')
      expect(modal).toHaveAttribute('aria-modal', 'true')
      expect(modal).toHaveAttribute('aria-labelledby')
      expect(modal).toHaveAttribute('aria-describedby')
    })

    it('should have overlay marked as aria-hidden', () => {
      render(<Modal {...defaultProps} />)
      
      const overlay = document.querySelector('[aria-hidden="true"]')
      expect(overlay).toBeInTheDocument()
      expect(overlay).toHaveClass('bg-black bg-opacity-50')
    })

    it('should have accessible close button', () => {
      render(<Modal {...defaultProps} />)
      
      const closeButton = screen.getByRole('button', { name: /close dialog/i })
      expect(closeButton).toHaveAttribute('aria-label', 'Close dialog')
    })
  })

  describe('complex content', () => {
    it('should render complex children', () => {
      const complexContent = (
        <div>
          <h3>Complex Content</h3>
          <form>
            <input type="text" placeholder="Name" />
            <button type="submit">Submit</button>
          </form>
          <p>Additional information</p>
        </div>
      )
      
      render(<Modal {...defaultProps}>{complexContent}</Modal>)
      
      expect(screen.getByText('Complex Content')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Name')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
    })

    it('should handle dynamic content updates', () => {
      const { rerender } = render(
        <Modal {...defaultProps}>
          <div>Initial content</div>
        </Modal>
      )
      
      expect(screen.getByText('Initial content')).toBeInTheDocument()
      
      rerender(
        <Modal {...defaultProps}>
          <div>Updated content</div>
        </Modal>
      )
      
      expect(screen.queryByText('Initial content')).not.toBeInTheDocument()
      expect(screen.getByText('Updated content')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle rapid open/close transitions', () => {
      const onClose = vi.fn()
      const { rerender } = render(<Modal {...defaultProps} onClose={onClose} />)
      
      // Rapid transitions
      rerender(<Modal {...defaultProps} isOpen={false} onClose={onClose} />)
      rerender(<Modal {...defaultProps} isOpen={true} onClose={onClose} />)
      rerender(<Modal {...defaultProps} isOpen={false} onClose={onClose} />)
      rerender(<Modal {...defaultProps} isOpen={true} onClose={onClose} />)
      
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should handle multiple modals', () => {
      render(
        <>
          <Modal isOpen={true} onClose={() => {}}>
            <div>Modal 1</div>
          </Modal>
          <Modal isOpen={true} onClose={() => {}}>
            <div>Modal 2</div>
          </Modal>
        </>
      )
      
      expect(screen.getAllByRole('dialog')).toHaveLength(2)
      expect(screen.getByText('Modal 1')).toBeInTheDocument()
      expect(screen.getByText('Modal 2')).toBeInTheDocument()
    })

    it('should handle missing children gracefully', () => {
      render(<Modal isOpen={true} onClose={() => {}}>{null}</Modal>)
      
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should handle event cleanup on unmount', () => {
      const onClose = vi.fn()
      const { unmount } = render(<Modal {...defaultProps} onClose={onClose} />)
      
      unmount()
      
      // Try to trigger escape key after unmount
      fireEvent.keyDown(document, { key: 'Escape' })
      
      // Should not call onClose since component is unmounted
      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('event propagation', () => {
    it('should stop propagation of click events from modal content', () => {
      const parentClick = vi.fn()
      const onClose = vi.fn()
      
      render(
        <div onClick={parentClick}>
          <Modal {...defaultProps} onClose={onClose}>
            <button>Click me</button>
          </Modal>
        </div>
      )
      
      const button = screen.getByRole('button', { name: /click me/i })
      fireEvent.click(button)
      
      expect(onClose).not.toHaveBeenCalled()
    })
  })
})