import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useApi } from '@/hooks/useApi'

describe('useApi', () => {
  it('should initialize with correct default state', () => {
    const mockApiFunction = vi.fn()
    const { result } = renderHook(() => useApi(mockApiFunction))

    expect(result.current.data).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(typeof result.current.execute).toBe('function')
    expect(typeof result.current.reset).toBe('function')
  })

  it('should handle successful API call', async () => {
    const mockData = { id: 1, name: 'Test' }
    const mockApiFunction = vi.fn().mockResolvedValue(mockData)
    const { result } = renderHook(() => useApi(mockApiFunction))

    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.data).toEqual(mockData)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(mockApiFunction).toHaveBeenCalledTimes(1)
  })

  it('should handle API call with parameters', async () => {
    const mockData = { result: 'success' }
    const mockApiFunction = vi.fn().mockResolvedValue(mockData)
    const { result } = renderHook(() => useApi(mockApiFunction))

    await act(async () => {
      await result.current.execute('param1', 123, { key: 'value' })
    })

    expect(mockApiFunction).toHaveBeenCalledWith('param1', 123, { key: 'value' })
    expect(result.current.data).toEqual(mockData)
  })

  it('should handle API call errors', async () => {
    const errorMessage = 'API Error'
    const mockApiFunction = vi.fn().mockRejectedValue(new Error(errorMessage))
    const { result } = renderHook(() => useApi(mockApiFunction))

    await act(async () => {
      try {
        await result.current.execute()
      } catch (error) {
        // Expected to throw
      }
    })

    expect(result.current.data).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(errorMessage)
  })

  it('should handle non-Error objects thrown', async () => {
    const mockApiFunction = vi.fn().mockRejectedValue('String error')
    const { result } = renderHook(() => useApi(mockApiFunction))

    await act(async () => {
      try {
        await result.current.execute()
      } catch (error) {
        // Expected to throw
      }
    })

    expect(result.current.error).toBe('An error occurred')
  })

  it('should reset state correctly', async () => {
    const mockData = { test: 'data' }
    const mockApiFunction = vi.fn().mockResolvedValue(mockData)
    const { result } = renderHook(() => useApi(mockApiFunction))

    // First execute to get some data
    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.data).toEqual(mockData)

    // Then reset
    act(() => {
      result.current.reset()
    })

    expect(result.current.data).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should clear error on new execution', async () => {
    const mockApiFunction = vi.fn()
      .mockRejectedValueOnce(new Error('First error'))
      .mockResolvedValueOnce('success')

    const { result } = renderHook(() => useApi(mockApiFunction))

    // First call - should error
    await act(async () => {
      try {
        await result.current.execute()
      } catch (error) {
        // Expected
      }
    })

    expect(result.current.error).toBe('First error')

    // Second call - should succeed and clear error
    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.error).toBeNull()
    expect(result.current.data).toBe('success')
  })

  it('should return data from execute function', async () => {
    const mockData = { success: true }
    const mockApiFunction = vi.fn().mockResolvedValue(mockData)
    const { result } = renderHook(() => useApi(mockApiFunction))

    let returnedData
    await act(async () => {
      returnedData = await result.current.execute()
    })

    expect(returnedData).toEqual(mockData)
  })

  it('should throw error from execute function on failure', async () => {
    const error = new Error('Test error')
    const mockApiFunction = vi.fn().mockRejectedValue(error)
    const { result } = renderHook(() => useApi(mockApiFunction))

    await act(async () => {
      await expect(result.current.execute()).rejects.toThrow('Test error')
    })
  })

  it('should maintain stable function references', () => {
    const mockApiFunction = vi.fn()
    const { result, rerender } = renderHook(() => useApi(mockApiFunction))

    const initialExecute = result.current.execute
    const initialReset = result.current.reset

    rerender()

    expect(result.current.execute).toBe(initialExecute)
    expect(result.current.reset).toBe(initialReset)
  })

  it('should handle different parameter types', async () => {
    const mockApiFunction = vi.fn().mockResolvedValue('success')
    const { result } = renderHook(() => useApi(mockApiFunction))

    const testParams = [
      [],
      ['string'],
      [123],
      [true, false],
      [{ object: true }, [1, 2, 3]],
      [null, undefined],
    ]

    for (const params of testParams) {
      await act(async () => {
        await result.current.execute(...params)
      })

      expect(mockApiFunction).toHaveBeenLastCalledWith(...params)
    }
  })

  it('should handle API function changes', async () => {
    const mockApiFunction1 = vi.fn().mockResolvedValue('result1')
    const mockApiFunction2 = vi.fn().mockResolvedValue('result2')

    const { result, rerender } = renderHook(
      ({ apiFunction }) => useApi(apiFunction),
      { initialProps: { apiFunction: mockApiFunction1 } }
    )

    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.data).toBe('result1')

    // Change the API function
    rerender({ apiFunction: mockApiFunction2 })

    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.data).toBe('result2')
    expect(mockApiFunction2).toHaveBeenCalled()
  })

  it('should handle async functions that return different types', async () => {
    const testCases = [
      { fn: vi.fn().mockResolvedValue('string'), expected: 'string' },
      { fn: vi.fn().mockResolvedValue(42), expected: 42 },
      { fn: vi.fn().mockResolvedValue(true), expected: true },
      { fn: vi.fn().mockResolvedValue(null), expected: null },
      { fn: vi.fn().mockResolvedValue(undefined), expected: undefined },
      { fn: vi.fn().mockResolvedValue([1, 2, 3]), expected: [1, 2, 3] },
      { fn: vi.fn().mockResolvedValue({ key: 'value' }), expected: { key: 'value' } },
    ]

    for (const { fn, expected } of testCases) {
      const { result } = renderHook(() => useApi(fn))

      await act(async () => {
        await result.current.execute()
      })

      expect(result.current.data).toEqual(expected)
    }
  })

  describe('edge cases', () => {
    it('should handle API function that throws synchronously', async () => {
      const mockApiFunction = vi.fn().mockImplementation(() => {
        throw new Error('Sync error')
      })

      const { result } = renderHook(() => useApi(mockApiFunction))

      await act(async () => {
        await expect(result.current.execute()).rejects.toThrow('Sync error')
      })

      expect(result.current.error).toBe('Sync error')
      expect(result.current.loading).toBe(false)
    })

    it('should handle API function that returns a rejected promise', async () => {
      const mockApiFunction = vi.fn().mockReturnValue(
        Promise.reject(new Error('Promise rejection'))
      )

      const { result } = renderHook(() => useApi(mockApiFunction))

      await act(async () => {
        await expect(result.current.execute()).rejects.toThrow('Promise rejection')
      })

      expect(result.current.error).toBe('Promise rejection')
    })
  })
})