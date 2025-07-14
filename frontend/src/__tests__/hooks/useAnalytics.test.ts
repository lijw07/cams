import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock dependencies before importing the hook
const mockAnalyticsService = {
  initialize: vi.fn(),
  trackEvent: vi.fn(),
  trackPageView: vi.fn(),
  trackUser: vi.fn(),
  setUserProperties: vi.fn(),
  optOut: vi.fn(),
  optIn: vi.fn(),
  isInitialized: vi.fn().mockReturnValue(true),
}

const mockEnv = {
  analytics: {
    measurementId: 'GA_MEASUREMENT_ID',
  }
}

const mockDefaultConfig = {
  ENABLED: true,
  DEBUG: false,
}

vi.mock('@/config/environment', () => ({
  env: mockEnv
}))

vi.mock('@/constants/AnalyticsConstants', () => ({
  DEFAULT_CONFIG: mockDefaultConfig
}))

vi.mock('@/services/analyticsService', () => ({
  analyticsService: mockAnalyticsService
}))

// Import the hook after all mocks are set up
import { useAnalytics } from '@/hooks/useAnalytics'

// Mock console.warn
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})

describe('useAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConsoleWarn.mockClear()
    
    // Reset mock values
    mockEnv.analytics.measurementId = 'GA_MEASUREMENT_ID'
    mockDefaultConfig.ENABLED = true
    mockDefaultConfig.DEBUG = false
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize analytics service with measurement ID', () => {
    renderHook(() => useAnalytics())

    expect(mockAnalyticsService.initialize).toHaveBeenCalledWith({
      measurementId: 'GA_MEASUREMENT_ID',
      enabled: true,
      debug: false,
    })
  })

  it('should not initialize when measurement ID is missing', () => {
    mockEnv.analytics.measurementId = null

    renderHook(() => useAnalytics())

    expect(mockAnalyticsService.initialize).not.toHaveBeenCalled()
  })

  it('should warn when measurement ID is missing in debug mode', () => {
    mockEnv.analytics.measurementId = ''
    mockDefaultConfig.DEBUG = true

    renderHook(() => useAnalytics())

    expect(mockConsoleWarn).toHaveBeenCalledWith(
      'Google Analytics measurement ID not found in environment variables'
    )
  })

  it('should return all analytics functions', () => {
    const { result } = renderHook(() => useAnalytics())

    expect(result.current).toHaveProperty('trackEvent')
    expect(result.current).toHaveProperty('trackPageView')
    expect(result.current).toHaveProperty('trackUser')
    expect(result.current).toHaveProperty('setUserProperties')
    expect(result.current).toHaveProperty('optOut')
    expect(result.current).toHaveProperty('optIn')
    expect(result.current).toHaveProperty('isInitialized')

    // All should be functions
    Object.values(result.current).forEach(fn => {
      expect(typeof fn).toBe('function')
    })
  })

  it('should track custom events', () => {
    const { result } = renderHook(() => useAnalytics())
    const mockEvent = {
      event_name: 'test_event',
      event_category: 'Test',
    }

    act(() => {
      result.current.trackEvent(mockEvent)
    })

    expect(mockAnalyticsService.trackEvent).toHaveBeenCalledWith(mockEvent)
  })

  it('should track page views', () => {
    const { result } = renderHook(() => useAnalytics())
    const mockPageView = {
      page_title: 'Test Page',
      page_location: 'https://example.com/test',
      page_path: '/test',
    }

    act(() => {
      result.current.trackPageView(mockPageView)
    })

    expect(mockAnalyticsService.trackPageView).toHaveBeenCalledWith(mockPageView)
  })

  it('should track user events', () => {
    const { result } = renderHook(() => useAnalytics())
    const mockUserEvent = {
      user_id: 'user123',
      user_role: 'admin',
    }

    act(() => {
      result.current.trackUser(mockUserEvent)
    })

    expect(mockAnalyticsService.trackUser).toHaveBeenCalledWith(mockUserEvent)
  })

  it('should set user properties', () => {
    const { result } = renderHook(() => useAnalytics())
    const mockProperties = {
      subscription_type: 'premium',
      user_role: 'admin',
    }

    act(() => {
      result.current.setUserProperties(mockProperties)
    })

    expect(mockAnalyticsService.setUserProperties).toHaveBeenCalledWith(mockProperties)
  })

  it('should handle opt out', () => {
    const { result } = renderHook(() => useAnalytics())

    act(() => {
      result.current.optOut()
    })

    expect(mockAnalyticsService.optOut).toHaveBeenCalled()
  })

  it('should handle opt in', () => {
    const { result } = renderHook(() => useAnalytics())

    act(() => {
      result.current.optIn()
    })

    expect(mockAnalyticsService.optIn).toHaveBeenCalled()
  })

  it('should check initialization status', () => {
    const { result } = renderHook(() => useAnalytics())

    const isInitialized = result.current.isInitialized()

    expect(mockAnalyticsService.isInitialized).toHaveBeenCalled()
    expect(isInitialized).toBe(true)
  })

  it('should maintain stable function references', () => {
    const { result, rerender } = renderHook(() => useAnalytics())

    const initialFunctions = {
      trackEvent: result.current.trackEvent,
      trackPageView: result.current.trackPageView,
      trackUser: result.current.trackUser,
      setUserProperties: result.current.setUserProperties,
      optOut: result.current.optOut,
      optIn: result.current.optIn,
      isInitialized: result.current.isInitialized,
    }

    rerender()

    expect(result.current.trackEvent).toBe(initialFunctions.trackEvent)
    expect(result.current.trackPageView).toBe(initialFunctions.trackPageView)
    expect(result.current.trackUser).toBe(initialFunctions.trackUser)
    expect(result.current.setUserProperties).toBe(initialFunctions.setUserProperties)
    expect(result.current.optOut).toBe(initialFunctions.optOut)
    expect(result.current.optIn).toBe(initialFunctions.optIn)
    expect(result.current.isInitialized).toBe(initialFunctions.isInitialized)
  })

  it('should initialize only once', () => {
    const { rerender } = renderHook(() => useAnalytics())

    rerender()
    rerender()

    // Should only initialize once
    expect(mockAnalyticsService.initialize).toHaveBeenCalledTimes(1)
  })

  it('should handle multiple tracking calls', () => {
    const { result } = renderHook(() => useAnalytics())

    const events = [
      { event_name: 'event1', event_category: 'Category1' },
      { event_name: 'event2', event_category: 'Category2' },
      { event_name: 'event3', event_category: 'Category3' },
    ]

    act(() => {
      events.forEach(event => result.current.trackEvent(event))
    })

    expect(mockAnalyticsService.trackEvent).toHaveBeenCalledTimes(3)
    events.forEach((event, index) => {
      expect(mockAnalyticsService.trackEvent).toHaveBeenNthCalledWith(index + 1, event)
    })
  })

  it('should handle complex event objects', () => {
    const { result } = renderHook(() => useAnalytics())
    
    const complexEvent = {
      event_name: 'complex_event',
      event_category: 'Complex',
      event_label: 'Test Label',
      value: 42,
      custom_parameters: {
        user_id: 'user123',
        application_type: 'web',
        nested_object: {
          key: 'value',
          array: [1, 2, 3],
        },
      },
    }

    act(() => {
      result.current.trackEvent(complexEvent)
    })

    expect(mockAnalyticsService.trackEvent).toHaveBeenCalledWith(complexEvent)
  })

  it('should handle empty user properties', () => {
    const { result } = renderHook(() => useAnalytics())

    act(() => {
      result.current.setUserProperties({})
    })

    expect(mockAnalyticsService.setUserProperties).toHaveBeenCalledWith({})
  })

  it('should handle user properties with various data types', () => {
    const { result } = renderHook(() => useAnalytics())
    
    const properties = {
      string_prop: 'value',
      number_prop: 123,
      boolean_prop: true,
      null_prop: null,
      undefined_prop: undefined,
      array_prop: [1, 2, 3],
      object_prop: { nested: 'value' },
    }

    act(() => {
      result.current.setUserProperties(properties)
    })

    expect(mockAnalyticsService.setUserProperties).toHaveBeenCalledWith(properties)
  })

  describe('edge cases', () => {
    it('should handle when analytics service methods throw errors', () => {
      mockAnalyticsService.trackEvent.mockImplementation(() => {
        throw new Error('Analytics error')
      })

      const { result } = renderHook(() => useAnalytics())

      expect(() => {
        act(() => {
          result.current.trackEvent({ event_name: 'test' })
        })
      }).toThrow('Analytics error')
    })

    it('should handle undefined measurement ID', () => {
      mockEnv.analytics.measurementId = undefined

      renderHook(() => useAnalytics())

      expect(mockAnalyticsService.initialize).not.toHaveBeenCalled()
    })

    it('should work when isInitialized returns false', () => {
      mockAnalyticsService.isInitialized.mockReturnValue(false)

      const { result } = renderHook(() => useAnalytics())

      const isInitialized = result.current.isInitialized()

      expect(isInitialized).toBe(false)
    })

    it('should handle rapid successive calls', () => {
      const { result } = renderHook(() => useAnalytics())

      act(() => {
        // Rapid calls to various methods
        result.current.trackEvent({ event_name: 'rapid1' })
        result.current.trackEvent({ event_name: 'rapid2' })
        result.current.optOut()
        result.current.optIn()
        result.current.setUserProperties({ rapid: 'test' })
        result.current.isInitialized()
      })

      expect(mockAnalyticsService.trackEvent).toHaveBeenCalledTimes(2)
      expect(mockAnalyticsService.optOut).toHaveBeenCalledTimes(1)
      expect(mockAnalyticsService.optIn).toHaveBeenCalledTimes(1)
      expect(mockAnalyticsService.setUserProperties).toHaveBeenCalledTimes(1)
      expect(mockAnalyticsService.isInitialized).toHaveBeenCalledTimes(1)
    })
  })
})