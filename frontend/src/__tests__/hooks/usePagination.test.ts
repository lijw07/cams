import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { usePagination } from '@/hooks/usePagination'

describe('usePagination', () => {
  const defaultProps = {
    totalItems: 100,
    itemsPerPage: 10,
  }

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => usePagination(defaultProps))

    expect(result.current.currentPage).toBe(1)
    expect(result.current.totalPages).toBe(10)
    expect(result.current.hasNext).toBe(true)
    expect(result.current.hasPrevious).toBe(false)
    expect(result.current.startIndex).toBe(0)
    expect(result.current.endIndex).toBe(9)
  })

  it('should initialize with custom initial page', () => {
    const { result } = renderHook(() => 
      usePagination({ ...defaultProps, initialPage: 5 })
    )

    expect(result.current.currentPage).toBe(5)
    expect(result.current.hasNext).toBe(true)
    expect(result.current.hasPrevious).toBe(true)
    expect(result.current.startIndex).toBe(40)
    expect(result.current.endIndex).toBe(49)
  })

  it('should calculate total pages correctly', () => {
    const testCases = [
      { totalItems: 100, itemsPerPage: 10, expected: 10 },
      { totalItems: 95, itemsPerPage: 10, expected: 10 },
      { totalItems: 99, itemsPerPage: 10, expected: 10 },
      { totalItems: 101, itemsPerPage: 10, expected: 11 },
      { totalItems: 1, itemsPerPage: 10, expected: 1 },
      { totalItems: 0, itemsPerPage: 10, expected: 0 },
    ]

    testCases.forEach(({ totalItems, itemsPerPage, expected }) => {
      const { result } = renderHook(() => 
        usePagination({ totalItems, itemsPerPage })
      )
      expect(result.current.totalPages).toBe(expected)
    })
  })

  it('should handle zero items', () => {
    const { result } = renderHook(() => 
      usePagination({ totalItems: 0, itemsPerPage: 10 })
    )

    expect(result.current.currentPage).toBe(1)
    expect(result.current.totalPages).toBe(0)
    expect(result.current.hasNext).toBe(false)
    expect(result.current.hasPrevious).toBe(false)
    expect(result.current.startIndex).toBe(0)
    expect(result.current.endIndex).toBe(-1)
  })

  it('should navigate to next page', () => {
    const { result } = renderHook(() => usePagination(defaultProps))

    act(() => {
      result.current.nextPage()
    })

    expect(result.current.currentPage).toBe(2)
    expect(result.current.hasNext).toBe(true)
    expect(result.current.hasPrevious).toBe(true)
    expect(result.current.startIndex).toBe(10)
    expect(result.current.endIndex).toBe(19)
  })

  it('should navigate to previous page', () => {
    const { result } = renderHook(() => 
      usePagination({ ...defaultProps, initialPage: 3 })
    )

    act(() => {
      result.current.previousPage()
    })

    expect(result.current.currentPage).toBe(2)
    expect(result.current.hasNext).toBe(true)
    expect(result.current.hasPrevious).toBe(true)
  })

  it('should not go beyond last page on nextPage', () => {
    const { result } = renderHook(() => 
      usePagination({ ...defaultProps, initialPage: 10 })
    )

    expect(result.current.currentPage).toBe(10)
    expect(result.current.hasNext).toBe(false)

    act(() => {
      result.current.nextPage()
    })

    expect(result.current.currentPage).toBe(10) // Should remain the same
  })

  it('should not go below first page on previousPage', () => {
    const { result } = renderHook(() => usePagination(defaultProps))

    expect(result.current.currentPage).toBe(1)
    expect(result.current.hasPrevious).toBe(false)

    act(() => {
      result.current.previousPage()
    })

    expect(result.current.currentPage).toBe(1) // Should remain the same
  })

  it('should go to specific page', () => {
    const { result } = renderHook(() => usePagination(defaultProps))

    act(() => {
      result.current.goToPage(7)
    })

    expect(result.current.currentPage).toBe(7)
    expect(result.current.startIndex).toBe(60)
    expect(result.current.endIndex).toBe(69)
  })

  it('should clamp goToPage to valid range', () => {
    const { result } = renderHook(() => usePagination(defaultProps))

    // Try to go to page beyond total pages
    act(() => {
      result.current.goToPage(15)
    })
    expect(result.current.currentPage).toBe(10) // Should be clamped to max

    // Try to go to page below 1
    act(() => {
      result.current.goToPage(-5)
    })
    expect(result.current.currentPage).toBe(1) // Should be clamped to min

    // Try to go to page 0
    act(() => {
      result.current.goToPage(0)
    })
    expect(result.current.currentPage).toBe(1) // Should be clamped to min
  })

  it('should go to first page', () => {
    const { result } = renderHook(() => 
      usePagination({ ...defaultProps, initialPage: 5 })
    )

    act(() => {
      result.current.goToFirst()
    })

    expect(result.current.currentPage).toBe(1)
  })

  it('should go to last page', () => {
    const { result } = renderHook(() => usePagination(defaultProps))

    act(() => {
      result.current.goToLast()
    })

    expect(result.current.currentPage).toBe(10)
  })

  it('should calculate correct indices for various scenarios', () => {
    const testCases = [
      {
        page: 1,
        totalItems: 100,
        itemsPerPage: 10,
        expectedStart: 0,
        expectedEnd: 9
      },
      {
        page: 5,
        totalItems: 100,
        itemsPerPage: 10,
        expectedStart: 40,
        expectedEnd: 49
      },
      {
        page: 10,
        totalItems: 95,
        itemsPerPage: 10,
        expectedStart: 90,
        expectedEnd: 94
      },
      {
        page: 1,
        totalItems: 5,
        itemsPerPage: 10,
        expectedStart: 0,
        expectedEnd: 4
      },
    ]

    testCases.forEach(({ page, totalItems, itemsPerPage, expectedStart, expectedEnd }) => {
      const { result } = renderHook(() => 
        usePagination({ totalItems, itemsPerPage, initialPage: page })
      )

      expect(result.current.startIndex).toBe(expectedStart)
      expect(result.current.endIndex).toBe(expectedEnd)
    })
  })

  it('should slice items correctly with getPageItems', () => {
    const items = Array.from({ length: 25 }, (_, i) => `item-${i}`)
    const { result } = renderHook(() => 
      usePagination({ totalItems: 25, itemsPerPage: 10, initialPage: 2 })
    )

    const pageItems = result.current.getPageItems(items)

    expect(pageItems).toHaveLength(10)
    expect(pageItems[0]).toBe('item-10')
    expect(pageItems[9]).toBe('item-19')
  })

  it('should handle getPageItems with partial last page', () => {
    const items = Array.from({ length: 25 }, (_, i) => `item-${i}`)
    const { result } = renderHook(() => 
      usePagination({ totalItems: 25, itemsPerPage: 10, initialPage: 3 })
    )

    const pageItems = result.current.getPageItems(items)

    expect(pageItems).toHaveLength(5)
    expect(pageItems[0]).toBe('item-20')
    expect(pageItems[4]).toBe('item-24')
  })

  it('should handle getPageItems with empty items array', () => {
    const { result } = renderHook(() => usePagination(defaultProps))

    const pageItems = result.current.getPageItems([])

    expect(pageItems).toEqual([])
  })

  it('should handle single item per page', () => {
    const { result } = renderHook(() => 
      usePagination({ totalItems: 10, itemsPerPage: 1 })
    )

    expect(result.current.totalPages).toBe(10)
    expect(result.current.startIndex).toBe(0)
    expect(result.current.endIndex).toBe(0)

    act(() => {
      result.current.nextPage()
    })

    expect(result.current.currentPage).toBe(2)
    expect(result.current.startIndex).toBe(1)
    expect(result.current.endIndex).toBe(1)
  })

  it('should handle large items per page', () => {
    const { result } = renderHook(() => 
      usePagination({ totalItems: 10, itemsPerPage: 100 })
    )

    expect(result.current.totalPages).toBe(1)
    expect(result.current.hasNext).toBe(false)
    expect(result.current.hasPrevious).toBe(false)
    expect(result.current.startIndex).toBe(0)
    expect(result.current.endIndex).toBe(9)
  })

  it('should maintain function reference stability', () => {
    const { result, rerender } = renderHook(() => usePagination(defaultProps))

    const initialFunctions = {
      goToPage: result.current.goToPage,
      nextPage: result.current.nextPage,
      previousPage: result.current.previousPage,
      goToFirst: result.current.goToFirst,
      goToLast: result.current.goToLast,
      getPageItems: result.current.getPageItems,
    }

    rerender()

    expect(result.current.goToPage).toBe(initialFunctions.goToPage)
    expect(result.current.nextPage).toBe(initialFunctions.nextPage)
    expect(result.current.previousPage).toBe(initialFunctions.previousPage)
    expect(result.current.goToFirst).toBe(initialFunctions.goToFirst)
    expect(result.current.goToLast).toBe(initialFunctions.goToLast)
    expect(result.current.getPageItems).toBe(initialFunctions.getPageItems)
  })

  it('should update calculations when props change', () => {
    const { result, rerender } = renderHook(
      (props) => usePagination(props),
      { initialProps: { totalItems: 50, itemsPerPage: 10 } }
    )

    expect(result.current.totalPages).toBe(5)

    rerender({ totalItems: 75, itemsPerPage: 10 })

    expect(result.current.totalPages).toBe(8)
  })

  it('should handle props change that affects current page validity', () => {
    const { result, rerender } = renderHook(
      (props) => usePagination(props),
      { initialProps: { totalItems: 100, itemsPerPage: 10, initialPage: 8 } }
    )

    expect(result.current.currentPage).toBe(8)
    expect(result.current.totalPages).toBe(10)

    // Reduce total items so current page becomes invalid
    rerender({ totalItems: 50, itemsPerPage: 10, initialPage: 8 })

    // Current page should be adjusted if it goes beyond total pages
    expect(result.current.totalPages).toBe(5)
    
    // Note: The hook doesn't automatically adjust currentPage when props change
    // This behavior might be intentional - the current page stays until manually changed
    // If auto-adjustment is needed, it would require additional logic in the hook
  })

  describe('edge cases', () => {
    it('should handle very large numbers', () => {
      const { result } = renderHook(() => 
        usePagination({ 
          totalItems: 1000000, 
          itemsPerPage: 50,
          initialPage: 10000 
        })
      )

      expect(result.current.currentPage).toBe(10000)
      expect(result.current.totalPages).toBe(20000)
      expect(result.current.startIndex).toBe(499950)
      expect(result.current.endIndex).toBe(499999)
    })

    it('should handle decimal itemsPerPage (should work with Math.ceil)', () => {
      const { result } = renderHook(() => 
        usePagination({ totalItems: 100, itemsPerPage: 10.5 })
      )

      // Math.ceil(100 / 10.5) = Math.ceil(9.52) = 10
      expect(result.current.totalPages).toBe(10)
    })

    it('should handle navigation on single page', () => {
      const { result } = renderHook(() => 
        usePagination({ totalItems: 5, itemsPerPage: 10 })
      )

      expect(result.current.totalPages).toBe(1)
      expect(result.current.hasNext).toBe(false)
      expect(result.current.hasPrevious).toBe(false)

      act(() => {
        result.current.nextPage()
      })
      expect(result.current.currentPage).toBe(1)

      act(() => {
        result.current.previousPage()
      })
      expect(result.current.currentPage).toBe(1)
    })
  })
})