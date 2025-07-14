import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useDebounce } from '@/hooks/useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500))
    
    expect(result.current).toBe('initial')
  })

  it('should debounce string values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 }
      }
    )

    expect(result.current).toBe('initial')

    // Change value
    rerender({ value: 'updated', delay: 500 })
    expect(result.current).toBe('initial') // Should still be initial

    // Advance time but not enough
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current).toBe('initial')

    // Advance enough time
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current).toBe('updated')
  })

  it('should debounce number values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 0, delay: 300 }
      }
    )

    expect(result.current).toBe(0)

    rerender({ value: 42, delay: 300 })
    expect(result.current).toBe(0)

    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current).toBe(42)
  })

  it('should debounce boolean values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: false, delay: 200 }
      }
    )

    expect(result.current).toBe(false)

    rerender({ value: true, delay: 200 })
    expect(result.current).toBe(false)

    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current).toBe(true)
  })

  it('should debounce object values', () => {
    const initialObj = { name: 'initial' }
    const updatedObj = { name: 'updated' }

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: initialObj, delay: 400 }
      }
    )

    expect(result.current).toBe(initialObj)

    rerender({ value: updatedObj, delay: 400 })
    expect(result.current).toBe(initialObj)

    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(result.current).toBe(updatedObj)
  })

  it('should reset timer when value changes multiple times', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'first', delay: 500 }
      }
    )

    expect(result.current).toBe('first')

    // First change
    rerender({ value: 'second', delay: 500 })
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current).toBe('first') // Still first

    // Second change before debounce completes
    rerender({ value: 'third', delay: 500 })
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current).toBe('first') // Still first

    // Complete the debounce
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current).toBe('third') // Should be third, not second
  })

  it('should handle delay changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 }
      }
    )

    rerender({ value: 'updated', delay: 200 }) // Change both value and delay

    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current).toBe('updated')
  })

  it('should handle zero delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 0 }
      }
    )

    rerender({ value: 'immediate', delay: 0 })

    act(() => {
      vi.advanceTimersByTime(0)
    })
    expect(result.current).toBe('immediate')
  })

  it('should handle undefined values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: undefined, delay: 300 }
      }
    )

    expect(result.current).toBeUndefined()

    rerender({ value: 'defined', delay: 300 })

    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current).toBe('defined')
  })

  it('should handle null values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: null, delay: 250 }
      }
    )

    expect(result.current).toBeNull()

    rerender({ value: 'not null', delay: 250 })

    act(() => {
      vi.advanceTimersByTime(250)
    })
    expect(result.current).toBe('not null')
  })

  it('should cleanup timeout on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
    
    const { result, rerender, unmount } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 }
      }
    )

    rerender({ value: 'updated', delay: 500 })
    
    unmount()

    expect(clearTimeoutSpy).toHaveBeenCalled()
  })

  it('should handle rapid successive changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'v1', delay: 300 }
      }
    )

    // Rapid changes
    rerender({ value: 'v2', delay: 300 })
    act(() => vi.advanceTimersByTime(100))
    
    rerender({ value: 'v3', delay: 300 })
    act(() => vi.advanceTimersByTime(100))
    
    rerender({ value: 'v4', delay: 300 })
    act(() => vi.advanceTimersByTime(100))
    
    rerender({ value: 'final', delay: 300 })

    // Still original value
    expect(result.current).toBe('v1')

    // Complete debounce
    act(() => {
      vi.advanceTimersByTime(300)
    })

    // Should be the last value
    expect(result.current).toBe('final')
  })

  it('should work with array values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: [1, 2, 3], delay: 400 }
      }
    )

    expect(result.current).toEqual([1, 2, 3])

    rerender({ value: [4, 5, 6], delay: 400 })

    act(() => {
      vi.advanceTimersByTime(400)
    })

    expect(result.current).toEqual([4, 5, 6])
  })

  it('should handle very short delays', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 1 }
      }
    )

    rerender({ value: 'quick', delay: 1 })

    act(() => {
      vi.advanceTimersByTime(1)
    })

    expect(result.current).toBe('quick')
  })

  it('should handle very long delays', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 10000 }
      }
    )

    rerender({ value: 'eventual', delay: 10000 })

    act(() => {
      vi.advanceTimersByTime(9999)
    })
    expect(result.current).toBe('initial')

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe('eventual')
  })
})