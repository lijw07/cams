import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createPageViewEvent,
  createAuthEvent,
  createApplicationEvent,
  createConnectionEvent,
  createErrorEvent,
  createPerformanceEvent,
  createNavigationEvent,
  sanitizeEventData
} from './analyticsHelpers'

// Mock the constants
vi.mock('../constants/AnalyticsConstants', () => ({
  ANALYTICS_EVENTS: {
    LOGIN: 'login',
    LOGOUT: 'logout',
    REGISTER: 'sign_up',
    LOGIN_ATTEMPT: 'login_attempt',
    APPLICATION_CREATE: 'application_create',
    APPLICATION_UPDATE: 'application_update',
    APPLICATION_DELETE: 'application_delete',
    APPLICATION_VIEW: 'application_view',
    CONNECTION_CREATE: 'connection_create',
    CONNECTION_TEST: 'connection_test',
    CONNECTION_UPDATE: 'connection_update',
    CONNECTION_DELETE: 'connection_delete',
    ERROR_OCCURRED: 'error_occurred',
    NAVIGATION: 'navigation',
  },
  ANALYTICS_CATEGORIES: {
    AUTHENTICATION: 'Authentication',
    APPLICATION_MANAGEMENT: 'Application Management',
    DATABASE_OPERATIONS: 'Database Operations',
    ERROR_TRACKING: 'Error Tracking',
    PERFORMANCE: 'Performance',
    NAVIGATION: 'Navigation',
  }
}))

// Mock window.location
const mockLocation = {
  href: 'https://example.com/current-page',
  pathname: '/current-page',
  search: '?param=value',
  hash: '#section',
}

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

describe('analyticsHelpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset window.location to default
    window.location.href = 'https://example.com/current-page'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createPageViewEvent', () => {
    it('should create a basic page view event', () => {
      const result = createPageViewEvent('Home Page', '/home')

      expect(result).toEqual({
        page_title: 'Home Page',
        page_path: '/home',
        page_location: 'https://example.com/current-page',
      })
    })

    it('should use provided location over window.location', () => {
      const customLocation = 'https://custom.com/page'
      const result = createPageViewEvent('Custom Page', '/custom', customLocation)

      expect(result).toEqual({
        page_title: 'Custom Page',
        page_path: '/custom',
        page_location: customLocation,
      })
    })

    it('should handle empty strings', () => {
      const result = createPageViewEvent('', '')

      expect(result).toEqual({
        page_title: '',
        page_path: '',
        page_location: 'https://example.com/current-page',
      })
    })

    it('should handle special characters in title and path', () => {
      const title = 'Page with "Special" & <Characters>'
      const path = '/path/with spaces/and-symbols@#$'
      
      const result = createPageViewEvent(title, path)

      expect(result.page_title).toBe(title)
      expect(result.page_path).toBe(path)
    })

    it('should handle very long title and path', () => {
      const longTitle = 'A'.repeat(1000)
      const longPath = '/' + 'B'.repeat(999)
      
      const result = createPageViewEvent(longTitle, longPath)

      expect(result.page_title).toBe(longTitle)
      expect(result.page_path).toBe(longPath)
    })
  })

  describe('createAuthEvent', () => {
    it('should create login event', () => {
      const result = createAuthEvent('login', true, 'email')

      expect(result).toEqual({
        event_name: 'login',
        event_category: 'Authentication',
        success: true,
        login_method: 'email',
      })
    })

    it('should create logout event', () => {
      const result = createAuthEvent('logout')

      expect(result).toEqual({
        event_name: 'logout',
        event_category: 'Authentication',
        success: undefined,
        login_method: undefined,
      })
    })

    it('should create register event', () => {
      const result = createAuthEvent('register', true, 'oauth')

      expect(result).toEqual({
        event_name: 'sign_up',
        event_category: 'Authentication',
        success: true,
        login_method: 'oauth',
      })
    })

    it('should create login attempt event', () => {
      const result = createAuthEvent('login_attempt', false, 'password')

      expect(result).toEqual({
        event_name: 'login_attempt',
        event_category: 'Authentication',
        success: false,
        login_method: 'password',
      })
    })

    it('should handle all authentication event types', () => {
      const eventTypes = ['login', 'logout', 'register', 'login_attempt'] as const
      
      eventTypes.forEach(eventType => {
        const result = createAuthEvent(eventType)
        expect(result.event_category).toBe('Authentication')
        expect(result.event_name).toBeDefined()
      })
    })

    it('should handle boolean success values correctly', () => {
      const successEvent = createAuthEvent('login', true)
      const failureEvent = createAuthEvent('login', false)
      const undefinedEvent = createAuthEvent('login')

      expect(successEvent.success).toBe(true)
      expect(failureEvent.success).toBe(false)
      expect(undefinedEvent.success).toBeUndefined()
    })

    it('should handle various login methods', () => {
      const methods = ['email', 'oauth', 'sso', 'ldap', 'two-factor', '']
      
      methods.forEach(method => {
        const result = createAuthEvent('login', true, method)
        expect(result.login_method).toBe(method)
      })
    })
  })

  describe('createApplicationEvent', () => {
    it('should create application create event', () => {
      const result = createApplicationEvent('create', 'app-123', 'My App', 'PostgreSQL')

      expect(result).toEqual({
        event_name: 'application_create',
        event_category: 'Application Management',
        application_id: 'app-123',
        application_name: 'My App',
        database_type: 'PostgreSQL',
      })
    })

    it('should create application update event', () => {
      const result = createApplicationEvent('update', 'app-456', 'Updated App')

      expect(result).toEqual({
        event_name: 'application_update',
        event_category: 'Application Management',
        application_id: 'app-456',
        application_name: 'Updated App',
        database_type: undefined,
      })
    })

    it('should create application delete event', () => {
      const result = createApplicationEvent('delete')

      expect(result).toEqual({
        event_name: 'application_delete',
        event_category: 'Application Management',
        application_id: undefined,
        application_name: undefined,
        database_type: undefined,
      })
    })

    it('should create application view event', () => {
      const result = createApplicationEvent('view', 'app-789', 'Viewed App', 'MySQL')

      expect(result).toEqual({
        event_name: 'application_view',
        event_category: 'Application Management',
        application_id: 'app-789',
        application_name: 'Viewed App',
        database_type: 'MySQL',
      })
    })

    it('should handle all application actions', () => {
      const actions = ['create', 'update', 'delete', 'view'] as const
      
      actions.forEach(action => {
        const result = createApplicationEvent(action)
        expect(result.event_category).toBe('Application Management')
        expect(result.event_name).toContain('application_')
      })
    })

    it('should handle special characters in application data', () => {
      const appName = 'App with "Special" & <Characters>'
      const dbType = 'Custom DB (v2.0)'
      
      const result = createApplicationEvent('create', 'app-special', appName, dbType)

      expect(result.application_name).toBe(appName)
      expect(result.database_type).toBe(dbType)
    })
  })

  describe('createConnectionEvent', () => {
    it('should create connection create event', () => {
      const result = createConnectionEvent('create', true, 'PostgreSQL')

      expect(result).toEqual({
        event_name: 'connection_create',
        event_category: 'Database Operations',
        custom_parameters: {
          success: true,
          database_type: 'PostgreSQL',
        },
      })
    })

    it('should create connection test event', () => {
      const result = createConnectionEvent('test', false, 'MySQL')

      expect(result).toEqual({
        event_name: 'connection_test',
        event_category: 'Database Operations',
        custom_parameters: {
          success: false,
          database_type: 'MySQL',
        },
      })
    })

    it('should create connection update event', () => {
      const result = createConnectionEvent('update')

      expect(result).toEqual({
        event_name: 'connection_update',
        event_category: 'Database Operations',
        custom_parameters: {
          success: undefined,
          database_type: undefined,
        },
      })
    })

    it('should create connection delete event', () => {
      const result = createConnectionEvent('delete', true)

      expect(result).toEqual({
        event_name: 'connection_delete',
        event_category: 'Database Operations',
        custom_parameters: {
          success: true,
          database_type: undefined,
        },
      })
    })

    it('should handle all connection actions', () => {
      const actions = ['create', 'test', 'update', 'delete'] as const
      
      actions.forEach(action => {
        const result = createConnectionEvent(action)
        expect(result.event_category).toBe('Database Operations')
        expect(result.event_name).toContain('connection_')
        expect(result.custom_parameters).toBeDefined()
      })
    })

    it('should handle various database types', () => {
      const dbTypes = ['PostgreSQL', 'MySQL', 'SQL Server', 'Oracle', 'MongoDB', 'Redis']
      
      dbTypes.forEach(dbType => {
        const result = createConnectionEvent('test', true, dbType)
        expect(result.custom_parameters?.database_type).toBe(dbType)
      })
    })
  })

  describe('createErrorEvent', () => {
    it('should create basic error event', () => {
      const result = createErrorEvent('Something went wrong')

      expect(result).toEqual({
        event_name: 'error_occurred',
        event_category: 'Error Tracking',
        error_message: 'Something went wrong',
        error_code: undefined,
        error_location: undefined,
      })
    })

    it('should create detailed error event', () => {
      const result = createErrorEvent(
        'Validation failed',
        'VAL_001',
        'UserForm.validateInput'
      )

      expect(result).toEqual({
        event_name: 'error_occurred',
        event_category: 'Error Tracking',
        error_message: 'Validation failed',
        error_code: 'VAL_001',
        error_location: 'UserForm.validateInput',
      })
    })

    it('should handle empty error message', () => {
      const result = createErrorEvent('')

      expect(result.error_message).toBe('')
      expect(result.event_name).toBe('error_occurred')
    })

    it('should handle very long error messages', () => {
      const longMessage = 'Error: ' + 'A'.repeat(5000)
      const result = createErrorEvent(longMessage)

      expect(result.error_message).toBe(longMessage)
    })

    it('should handle special characters in error data', () => {
      const message = 'Error with "quotes" & <brackets> and UTF-8: 测试'
      const code = 'ERR_SPECIAL_CHARS'
      const location = 'Component.method():line:42'
      
      const result = createErrorEvent(message, code, location)

      expect(result.error_message).toBe(message)
      expect(result.error_code).toBe(code)
      expect(result.error_location).toBe(location)
    })
  })

  describe('createPerformanceEvent', () => {
    it('should create basic performance event', () => {
      const result = createPerformanceEvent('page_load_time', 1234)

      expect(result).toEqual({
        event_name: 'page_load_time',
        event_category: 'Performance',
        value: 1234,
        custom_parameters: {
          component_name: undefined,
        },
      })
    })

    it('should create performance event with component', () => {
      const result = createPerformanceEvent('component_render_time', 56.78, 'UserList')

      expect(result).toEqual({
        event_name: 'component_render_time',
        event_category: 'Performance',
        value: 56.78,
        custom_parameters: {
          component_name: 'UserList',
        },
      })
    })

    it('should handle zero and negative values', () => {
      const zeroResult = createPerformanceEvent('metric', 0)
      const negativeResult = createPerformanceEvent('metric', -123.45)

      expect(zeroResult.value).toBe(0)
      expect(negativeResult.value).toBe(-123.45)
    })

    it('should handle very large values', () => {
      const largeValue = 999999999.999
      const result = createPerformanceEvent('large_metric', largeValue)

      expect(result.value).toBe(largeValue)
    })

    it('should handle various metric names', () => {
      const metrics = [
        'api_response_time',
        'component_mount_time',
        'database_query_time',
        'file_upload_size',
        'memory_usage',
      ]
      
      metrics.forEach(metric => {
        const result = createPerformanceEvent(metric, 100)
        expect(result.event_name).toBe(metric)
        expect(result.event_category).toBe('Performance')
      })
    })
  })

  describe('createNavigationEvent', () => {
    it('should create basic navigation event', () => {
      const result = createNavigationEvent('/dashboard')

      expect(result).toEqual({
        event_name: 'navigation',
        event_category: 'Navigation',
        event_label: '/dashboard',
        custom_parameters: {
          source: undefined,
          destination: '/dashboard',
        },
      })
    })

    it('should create navigation event with source', () => {
      const result = createNavigationEvent('/users', '/dashboard')

      expect(result).toEqual({
        event_name: 'navigation',
        event_category: 'Navigation',
        event_label: '/users',
        custom_parameters: {
          source: '/dashboard',
          destination: '/users',
        },
      })
    })

    it('should handle empty destination', () => {
      const result = createNavigationEvent('')

      expect(result.event_label).toBe('')
      expect(result.custom_parameters?.destination).toBe('')
    })

    it('should handle complex navigation paths', () => {
      const destination = '/applications/123/connections/456?tab=settings&view=detailed'
      const source = '/applications/123'
      
      const result = createNavigationEvent(destination, source)

      expect(result.event_label).toBe(destination)
      expect(result.custom_parameters?.destination).toBe(destination)
      expect(result.custom_parameters?.source).toBe(source)
    })

    it('should handle special characters in paths', () => {
      const destination = '/search?q=test query&filter=type:app'
      const source = '/dashboard#recent'
      
      const result = createNavigationEvent(destination, source)

      expect(result.custom_parameters?.destination).toBe(destination)
      expect(result.custom_parameters?.source).toBe(source)
    })
  })

  describe('sanitizeEventData', () => {
    it('should remove sensitive data keys', () => {
      const data = {
        username: 'user123',
        password: 'secret123',
        auth_token: 'token123',
        api_secret: 'secret456',
        description: 'Safe data',
      }

      const result = sanitizeEventData(data)

      expect(result).toEqual({
        username: 'user123',
        description: 'Safe data',
      })
      expect(result).not.toHaveProperty('password')
      expect(result).not.toHaveProperty('auth_token')
      expect(result).not.toHaveProperty('api_secret')
    })

    it('should handle case-insensitive sensitive key detection', () => {
      const data = {
        PASSWORD: 'secret',
        Token: 'token',
        API_SECRET: 'secret',
        SECRET_KEY: 'key',
        safe_data: 'value',
      }

      const result = sanitizeEventData(data)

      expect(result).toEqual({
        safe_data: 'value',
      })
    })

    it('should convert objects to JSON strings', () => {
      const data = {
        user_info: { id: 123, name: 'John' },
        settings: { theme: 'dark', notifications: true },
        simple_string: 'text',
      }

      const result = sanitizeEventData(data)

      expect(result).toEqual({
        user_info: '{"id":123,"name":"John"}',
        settings: '{"theme":"dark","notifications":true}',
        simple_string: 'text',
      })
    })

    it('should convert all values to strings', () => {
      const data = {
        number_value: 42,
        boolean_value: true,
        string_value: 'text',
        array_value: [1, 2, 3],
      }

      const result = sanitizeEventData(data)

      expect(result).toEqual({
        number_value: '42',
        boolean_value: 'true',
        string_value: 'text',
        array_value: '[1,2,3]',
      })
    })

    it('should handle null and undefined values', () => {
      const data = {
        null_value: null,
        undefined_value: undefined,
        empty_string: '',
        zero_value: 0,
        false_value: false,
      }

      const result = sanitizeEventData(data)

      expect(result).toEqual({
        empty_string: '',
        zero_value: '0',
        false_value: 'false',
      })
      expect(result).not.toHaveProperty('null_value')
      expect(result).not.toHaveProperty('undefined_value')
    })

    it('should handle circular references in objects', () => {
      const data: any = {
        safe_value: 'text',
        circular_object: { name: 'test' },
      }
      data.circular_object.self = data.circular_object

      expect(() => sanitizeEventData(data)).toThrow()
    })

    it('should handle empty object', () => {
      const result = sanitizeEventData({})

      expect(result).toEqual({})
    })

    it('should handle complex nested objects', () => {
      const data = {
        user: {
          profile: {
            id: 123,
            preferences: {
              theme: 'dark',
              language: 'en',
            },
          },
        },
        password: 'secret', // Should be removed
      }

      const result = sanitizeEventData(data)

      expect(result).toHaveProperty('user')
      expect(result).not.toHaveProperty('password')
      expect(typeof result.user).toBe('string')
      expect(JSON.parse(result.user)).toEqual(data.user)
    })

    it('should handle large objects efficiently', () => {
      const largeData: Record<string, any> = {}
      for (let i = 0; i < 1000; i++) {
        largeData[`key_${i}`] = `value_${i}`
      }
      largeData.password = 'secret' // Should be removed

      const result = sanitizeEventData(largeData)

      expect(Object.keys(result)).toHaveLength(1000)
      expect(result).not.toHaveProperty('password')
    })

    it('should handle special characters in keys and values', () => {
      const data = {
        'key with spaces': 'value',
        'key-with-dashes': 'value',
        'key_with_underscores': 'value',
        'key.with.dots': 'value',
        'key@with#symbols': 'value',
        normal_key: 'value with special chars: 测试 & <tags>',
      }

      const result = sanitizeEventData(data)

      expect(Object.keys(result)).toHaveLength(6)
      Object.values(result).forEach(value => {
        expect(typeof value).toBe('string')
      })
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle undefined window.location gracefully', () => {
      const originalLocation = window.location
      delete (window as any).location

      expect(() => createPageViewEvent('Test', '/test')).toThrow()

      window.location = originalLocation
    })

    it('should handle malformed event types', () => {
      // Test with invalid event type that would create a malformed key
      const result = createAuthEvent('invalid_type' as any)
      
      // Should still work but might have undefined event_name
      expect(result.event_category).toBe('Authentication')
    })

    it('should handle extremely long strings', () => {
      const veryLongString = 'A'.repeat(100000)
      
      const pageViewResult = createPageViewEvent(veryLongString, veryLongString)
      expect(pageViewResult.page_title).toBe(veryLongString)
      
      const errorResult = createErrorEvent(veryLongString)
      expect(errorResult.error_message).toBe(veryLongString)
    })

    it('should handle non-string inputs gracefully', () => {
      // TypeScript would prevent this, but testing runtime behavior
      const result = createPageViewEvent(123 as any, null as any)
      
      expect(result.page_title).toBe(123)
      expect(result.page_path).toBe(null)
    })

    it('should handle unicode and emoji characters', () => {
      const unicodeTitle = '测试页面 🚀 Страница тест'
      const emojiPath = '/page/with/🎯/emojis/💯'
      
      const result = createPageViewEvent(unicodeTitle, emojiPath)
      
      expect(result.page_title).toBe(unicodeTitle)
      expect(result.page_path).toBe(emojiPath)
    })
  })
})