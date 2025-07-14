import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useModal } from '@/hooks/useModal'

describe('useModal', () => {
  it('should initialize with default closed state', () => {
    const { result } = renderHook(() => useModal())

    expect(result.current.isOpen).toBe(false)
  })

  it('should initialize with provided initial state', () => {
    const { result } = renderHook(() => useModal(true))

    expect(result.current.isOpen).toBe(true)
  })

  it('should open modal', () => {
    const { result } = renderHook(() => useModal())

    expect(result.current.isOpen).toBe(false)

    act(() => {
      result.current.open()
    })

    expect(result.current.isOpen).toBe(true)
  })

  it('should close modal', () => {
    const { result } = renderHook(() => useModal(true))

    expect(result.current.isOpen).toBe(true)

    act(() => {
      result.current.close()
    })

    expect(result.current.isOpen).toBe(false)
  })

  it('should toggle modal state', () => {
    const { result } = renderHook(() => useModal())

    expect(result.current.isOpen).toBe(false)

    act(() => {
      result.current.toggle()
    })

    expect(result.current.isOpen).toBe(true)

    act(() => {
      result.current.toggle()
    })

    expect(result.current.isOpen).toBe(false)
  })

  it('should return stable function references', () => {
    const { result, rerender } = renderHook(() => useModal())

    const initialOpen = result.current.open
    const initialClose = result.current.close
    const initialToggle = result.current.toggle

    rerender()

    expect(result.current.open).toBe(initialOpen)
    expect(result.current.close).toBe(initialClose)
    expect(result.current.toggle).toBe(initialToggle)
  })

  it('should handle multiple operations in sequence', () => {
    const { result } = renderHook(() => useModal())

    expect(result.current.isOpen).toBe(false)

    act(() => {
      result.current.open()
    })
    expect(result.current.isOpen).toBe(true)

    act(() => {
      result.current.open() // Should remain open
    })
    expect(result.current.isOpen).toBe(true)

    act(() => {
      result.current.close()
    })
    expect(result.current.isOpen).toBe(false)

    act(() => {
      result.current.close() // Should remain closed
    })
    expect(result.current.isOpen).toBe(false)

    act(() => {
      result.current.toggle()
    })
    expect(result.current.isOpen).toBe(true)

    act(() => {
      result.current.toggle()
    })
    expect(result.current.isOpen).toBe(false)
  })

  it('should maintain state independence between multiple instances', () => {
    const { result: result1 } = renderHook(() => useModal())
    const { result: result2 } = renderHook(() => useModal(true))

    expect(result1.current.isOpen).toBe(false)
    expect(result2.current.isOpen).toBe(true)

    act(() => {
      result1.current.open()
    })

    expect(result1.current.isOpen).toBe(true)
    expect(result2.current.isOpen).toBe(true) // Should not affect other instance

    act(() => {
      result2.current.close()
    })

    expect(result1.current.isOpen).toBe(true) // Should not affect other instance
    expect(result2.current.isOpen).toBe(false)
  })

  it('should handle rapid state changes', () => {
    const { result } = renderHook(() => useModal())

    act(() => {
      result.current.open()
      result.current.close()
      result.current.toggle()
      result.current.toggle()
      result.current.open()
    })

    expect(result.current.isOpen).toBe(true)
  })

  it('should work with different initial states', () => {
    const testCases = [true, false, undefined]

    testCases.forEach(initialState => {
      const { result } = renderHook(() => useModal(initialState))
      const expectedState = initialState ?? false
      
      expect(result.current.isOpen).toBe(expectedState)
    })
  })

  describe('return object structure', () => {
    it('should return object with correct properties', () => {
      const { result } = renderHook(() => useModal())

      expect(result.current).toHaveProperty('isOpen')
      expect(result.current).toHaveProperty('open')
      expect(result.current).toHaveProperty('close')
      expect(result.current).toHaveProperty('toggle')
    })

    it('should have correct property types', () => {
      const { result } = renderHook(() => useModal())

      expect(typeof result.current.isOpen).toBe('boolean')
      expect(typeof result.current.open).toBe('function')
      expect(typeof result.current.close).toBe('function')
      expect(typeof result.current.toggle).toBe('function')
    })

    it('should return functions that do not throw when called', () => {
      const { result } = renderHook(() => useModal())

      expect(() => result.current.open()).not.toThrow()
      expect(() => result.current.close()).not.toThrow()
      expect(() => result.current.toggle()).not.toThrow()
    })
  })

  describe('edge cases', () => {
    it('should handle calls without act wrapper in test environment', () => {
      const { result } = renderHook(() => useModal())

      // These should not throw, though they might show warnings in test output
      expect(() => {
        result.current.open()
        result.current.close()
        result.current.toggle()
      }).not.toThrow()
    })

    it('should maintain consistency after many operations', () => {
      const { result } = renderHook(() => useModal())

      // Perform many operations
      for (let i = 0; i < 100; i++) {
        act(() => {
          if (i % 3 === 0) result.current.open()
          else if (i % 3 === 1) result.current.close()
          else result.current.toggle()
        })
      }

      // State should still be a boolean
      expect(typeof result.current.isOpen).toBe('boolean')
      expect([true, false]).toContain(result.current.isOpen)
    })
  })
})