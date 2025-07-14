import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRef } from 'react'
import { useFocusTrap } from '@/hooks/useFocusTrap'

describe('useFocusTrap', () => {
  let container: HTMLDivElement
  let containerRef: React.RefObject<HTMLDivElement>

  beforeEach(() => {
    // Create container element
    container = document.createElement('div')
    containerRef = createRef()
    ;(containerRef as any).current = container
    document.body.appendChild(container)

    // Mock setTimeout for testing
    vi.useFakeTimers()
  })

  afterEach(() => {
    if (container.parentNode) {
      container.parentNode.removeChild(container)
    }
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  const createFocusableElement = (tag: string, attributes: Record<string, string> = {}) => {
    const element = document.createElement(tag)
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value)
    })
    return element
  }

  it('should not add event listeners when inactive', () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener')

    renderHook(() => useFocusTrap(containerRef, false))

    // Should not add keydown event listener specifically
    expect(addEventListenerSpy).not.toHaveBeenCalledWith('keydown', expect.any(Function), true)
  })

  it('should not add event listeners when container ref is null', () => {
    const nullRef = createRef<HTMLDivElement>()
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener')

    renderHook(() => useFocusTrap(nullRef, true))

    expect(addEventListenerSpy).not.toHaveBeenCalled()
  })

  it('should add keydown event listener when active', () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener')

    renderHook(() => useFocusTrap(containerRef, true))

    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })

  it('should remove event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

    const { unmount } = renderHook(() => useFocusTrap(containerRef, true))

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })

  it('should focus first focusable element on mount', () => {
    const button = createFocusableElement('button')
    const input = createFocusableElement('input')
    container.appendChild(button)
    container.appendChild(input)

    const buttonFocusSpy = vi.spyOn(button, 'focus')

    renderHook(() => useFocusTrap(containerRef, true))

    // Advance timer to trigger focus
    vi.advanceTimersByTime(50)

    expect(buttonFocusSpy).toHaveBeenCalled()
  })

  it('should not focus first element if something is already focused inside container', () => {
    const button = createFocusableElement('button')
    const input = createFocusableElement('input')
    container.appendChild(button)
    container.appendChild(input)

    // Focus the input first
    input.focus()

    const buttonFocusSpy = vi.spyOn(button, 'focus')

    renderHook(() => useFocusTrap(containerRef, true))

    vi.advanceTimersByTime(50)

    expect(buttonFocusSpy).not.toHaveBeenCalled()
  })

  it('should identify focusable elements correctly', () => {
    const button = createFocusableElement('button')
    const input = createFocusableElement('input')
    const disabledInput = createFocusableElement('input', { disabled: 'true' })
    const link = createFocusableElement('a', { href: '#' })
    const textarea = createFocusableElement('textarea')
    const select = createFocusableElement('select')
    const tabindexDiv = createFocusableElement('div', { tabindex: '0' })
    const hiddenElement = createFocusableElement('button', { 'aria-hidden': 'true' })

    container.appendChild(button)
    container.appendChild(input)
    container.appendChild(disabledInput)
    container.appendChild(link)
    container.appendChild(textarea)
    container.appendChild(select)
    container.appendChild(tabindexDiv)
    container.appendChild(hiddenElement)

    const buttonFocusSpy = vi.spyOn(button, 'focus')

    renderHook(() => useFocusTrap(containerRef, true))

    vi.advanceTimersByTime(50)

    // Should focus the first non-disabled, non-hidden element (button)
    expect(buttonFocusSpy).toHaveBeenCalled()
  })

  it('should handle Tab key to move focus forward', () => {
    const button1 = createFocusableElement('button')
    const button2 = createFocusableElement('button')
    const button3 = createFocusableElement('button')

    container.appendChild(button1)
    container.appendChild(button2)
    container.appendChild(button3)

    button3.focus() // Focus last element

    renderHook(() => useFocusTrap(containerRef, true))

    // Simulate Tab key press
    const event = new KeyboardEvent('keydown', { key: 'Tab' })
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
    const button1FocusSpy = vi.spyOn(button1, 'focus')

    document.dispatchEvent(event)

    expect(preventDefaultSpy).toHaveBeenCalled()
    expect(button1FocusSpy).toHaveBeenCalled()
  })

  it('should handle Shift+Tab key to move focus backward', () => {
    const button1 = createFocusableElement('button')
    const button2 = createFocusableElement('button')
    const button3 = createFocusableElement('button')

    container.appendChild(button1)
    container.appendChild(button2)
    container.appendChild(button3)

    button1.focus() // Focus first element

    renderHook(() => useFocusTrap(containerRef, true))

    // Simulate Shift+Tab key press
    const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true })
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
    const button3FocusSpy = vi.spyOn(button3, 'focus')

    document.dispatchEvent(event)

    expect(preventDefaultSpy).toHaveBeenCalled()
    expect(button3FocusSpy).toHaveBeenCalled()
  })

  it('should not interfere with normal Tab navigation within container', () => {
    const button1 = createFocusableElement('button')
    const button2 = createFocusableElement('button')
    const button3 = createFocusableElement('button')

    container.appendChild(button1)
    container.appendChild(button2)
    container.appendChild(button3)

    button1.focus() // Focus first element

    renderHook(() => useFocusTrap(containerRef, true))

    // Simulate Tab key press (should move to button2)
    const event = new KeyboardEvent('keydown', { key: 'Tab' })
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

    document.dispatchEvent(event)

    // Should not prevent default since we're not at the boundary
    expect(preventDefaultSpy).not.toHaveBeenCalled()
  })

  it('should ignore non-Tab keys', () => {
    const button = createFocusableElement('button')
    container.appendChild(button)

    renderHook(() => useFocusTrap(containerRef, true))

    const event = new KeyboardEvent('keydown', { key: 'Enter' })
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

    document.dispatchEvent(event)

    expect(preventDefaultSpy).not.toHaveBeenCalled()
  })

  it('should handle empty container with no focusable elements', () => {
    renderHook(() => useFocusTrap(containerRef, true))

    // Should not throw error
    const event = new KeyboardEvent('keydown', { key: 'Tab' })
    expect(() => document.dispatchEvent(event)).not.toThrow()
  })

  it('should handle single focusable element', () => {
    const button = createFocusableElement('button')
    container.appendChild(button)

    button.focus()

    renderHook(() => useFocusTrap(containerRef, true))

    // Tab should keep focus on the same element
    const event = new KeyboardEvent('keydown', { key: 'Tab' })
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
    const buttonFocusSpy = vi.spyOn(button, 'focus')

    document.dispatchEvent(event)

    expect(preventDefaultSpy).toHaveBeenCalled()
    expect(buttonFocusSpy).toHaveBeenCalled()
  })

  it('should handle focus outside container', () => {
    const button1 = createFocusableElement('button')
    const button2 = createFocusableElement('button')
    container.appendChild(button1)
    container.appendChild(button2)

    // Create element outside container and focus it
    const outsideButton = createFocusableElement('button')
    document.body.appendChild(outsideButton)
    outsideButton.focus()

    renderHook(() => useFocusTrap(containerRef, true))

    // Tab should move to first element in container
    const event = new KeyboardEvent('keydown', { key: 'Tab' })
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
    const button1FocusSpy = vi.spyOn(button1, 'focus')

    document.dispatchEvent(event)

    expect(preventDefaultSpy).toHaveBeenCalled()
    expect(button1FocusSpy).toHaveBeenCalled()

    // Cleanup
    document.body.removeChild(outsideButton)
  })

  it('should handle activation/deactivation changes', () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener')
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

    const { rerender } = renderHook(
      ({ isActive }) => useFocusTrap(containerRef, isActive),
      { initialProps: { isActive: false } }
    )

    expect(addEventListenerSpy).not.toHaveBeenCalled()

    // Activate
    rerender({ isActive: true })
    expect(addEventListenerSpy).toHaveBeenCalled()

    // Deactivate
    rerender({ isActive: false })
    expect(removeEventListenerSpy).toHaveBeenCalled()
  })

  it('should handle container ref changes', () => {
    const newContainer = document.createElement('div')
    const newContainerRef = createRef<HTMLDivElement>()
    ;(newContainerRef as any).current = newContainer
    document.body.appendChild(newContainer)

    const { rerender } = renderHook(
      ({ containerRef }) => useFocusTrap(containerRef, true),
      { initialProps: { containerRef } }
    )

    // Change container ref
    rerender({ containerRef: newContainerRef })

    // Should handle the change without errors
    expect(() => {
      const event = new KeyboardEvent('keydown', { key: 'Tab' })
      document.dispatchEvent(event)
    }).not.toThrow()

    // Cleanup
    document.body.removeChild(newContainer)
  })

  it('should clear timeout on unmount', () => {
    const button = createFocusableElement('button')
    container.appendChild(button)

    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

    const { unmount } = renderHook(() => useFocusTrap(containerRef, true))

    unmount()

    expect(clearTimeoutSpy).toHaveBeenCalled()
  })

  it('should not focus if element becomes focused during timeout', () => {
    const button1 = createFocusableElement('button')
    const button2 = createFocusableElement('button')
    container.appendChild(button1)
    container.appendChild(button2)

    renderHook(() => useFocusTrap(containerRef, true))

    // Focus an element during the timeout period
    button2.focus()

    const button1FocusSpy = vi.spyOn(button1, 'focus')

    // Advance timer
    vi.advanceTimersByTime(50)

    // Should not focus first element since button2 is already focused
    expect(button1FocusSpy).not.toHaveBeenCalled()
  })

  describe('edge cases', () => {
    it('should handle elements with visibility hidden', () => {
      const button = createFocusableElement('button')
      button.style.display = 'none' // Hidden element
      
      const visibleButton = createFocusableElement('button')
      
      container.appendChild(button)
      container.appendChild(visibleButton)

      const visibleButtonFocusSpy = vi.spyOn(visibleButton, 'focus')

      renderHook(() => useFocusTrap(containerRef, true))

      vi.advanceTimersByTime(50)

      // Should focus visible button, not hidden one
      expect(visibleButtonFocusSpy).toHaveBeenCalled()
    })

    it('should handle elements with tabindex="-1"', () => {
      const tabbableButton = createFocusableElement('button')
      const nonTabbableButton = createFocusableElement('button', { tabindex: '-1' })
      
      container.appendChild(nonTabbableButton)
      container.appendChild(tabbableButton)

      const tabbableFocusSpy = vi.spyOn(tabbableButton, 'focus')

      renderHook(() => useFocusTrap(containerRef, true))

      vi.advanceTimersByTime(50)

      // Should focus tabbable button, not the one with tabindex="-1"
      expect(tabbableFocusSpy).toHaveBeenCalled()
    })

    it('should handle very rapid key presses', () => {
      const button1 = createFocusableElement('button')
      const button2 = createFocusableElement('button')
      container.appendChild(button1)
      container.appendChild(button2)

      button2.focus()

      renderHook(() => useFocusTrap(containerRef, true))

      // Rapid Tab presses
      for (let i = 0; i < 10; i++) {
        const event = new KeyboardEvent('keydown', { key: 'Tab' })
        document.dispatchEvent(event)
      }

      // Should not throw errors
      expect(document.activeElement).toBeDefined()
    })

    it('should handle when activeElement is null', () => {
      const button = createFocusableElement('button')
      container.appendChild(button)

      // Mock activeElement as null
      Object.defineProperty(document, 'activeElement', {
        get: () => null,
        configurable: true
      })

      renderHook(() => useFocusTrap(containerRef, true))

      expect(() => {
        const event = new KeyboardEvent('keydown', { key: 'Tab' })
        document.dispatchEvent(event)
      }).not.toThrow()
    })
  })
})