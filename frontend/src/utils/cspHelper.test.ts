import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  generateCSPHeader,
  createCSPMetaTag,
  injectCSPMetaTag,
  reportCSPViolation,
  initializeCSPMonitoring
} from './cspHelper'

// Mock modules at the top level
vi.mock('../config/environment', () => ({
  env: {
    app: {
      isDevelopment: false,
      isProduction: true,
    }
  }
}))

vi.mock('../config/security', () => ({
  CSP_DIRECTIVES: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", 'https://www.googletagmanager.com'],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'img-src': ["'self'", 'data:', 'https:'],
    'connect-src': ["'self'", 'https://www.google-analytics.com'],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  }
}))

// Mock console methods
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})

// Mock DOM methods
const mockQuerySelector = vi.fn()
const mockCreateElement = vi.fn()
const mockAppendChild = vi.fn()
const mockSetAttribute = vi.fn()
const mockAddEventListener = vi.fn()

// Mock document
Object.defineProperty(global, 'document', {
  value: {
    createElement: mockCreateElement,
    querySelector: mockQuerySelector,
    head: {
      appendChild: mockAppendChild,
    },
    addEventListener: mockAddEventListener,
  },
  writable: true,
})

describe('cspHelper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConsoleWarn.mockClear()
    
    // Reset environment to production mode
    mockEnv.app.isDevelopment = false
    mockEnv.app.isProduction = true
    
    // Reset mock implementations
    mockCreateElement.mockReturnValue({
      setAttribute: mockSetAttribute,
      httpEquiv: '',
      content: '',
    })
    mockQuerySelector.mockReturnValue(null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('generateCSPHeader', () => {
    it('should generate correct CSP header string', () => {
      const result = generateCSPHeader()

      expect(result).toContain("default-src 'self'")
      expect(result).toContain("script-src 'self' 'unsafe-inline' https://www.googletagmanager.com")
      expect(result).toContain("style-src 'self' 'unsafe-inline' https://fonts.googleapis.com")
      expect(result).toContain("font-src 'self' https://fonts.gstatic.com")
      expect(result).toContain("img-src 'self' data: https:")
      expect(result).toContain("connect-src 'self' https://www.google-analytics.com")
      expect(result).toContain("frame-ancestors 'none'")
      expect(result).toContain("base-uri 'self'")
      expect(result).toContain("form-action 'self'")
    })

    it('should separate directives with semicolons', () => {
      const result = generateCSPHeader()

      const directives = result.split('; ')
      expect(directives.length).toBe(9) // Number of directives in mock config
      
      directives.forEach(directive => {
        expect(directive).not.toBe('')
        expect(directive).toContain(' ') // Should have directive name and values
      })
    })

    it('should handle array values correctly', () => {
      const result = generateCSPHeader()

      // script-src has multiple values
      const scriptSrcMatch = result.match(/script-src[^;]+/)
      expect(scriptSrcMatch).toBeTruthy()
      expect(scriptSrcMatch![0]).toContain("'self'")
      expect(scriptSrcMatch![0]).toContain("'unsafe-inline'")
      expect(scriptSrcMatch![0]).toContain('https://www.googletagmanager.com')
    })

    it('should produce deterministic output', () => {
      const result1 = generateCSPHeader()
      const result2 = generateCSPHeader()

      expect(result1).toBe(result2)
    })

    it('should handle single string values', () => {
      // frame-ancestors has a single string value
      const result = generateCSPHeader()
      expect(result).toContain("frame-ancestors 'none'")
    })
  })

  describe('createCSPMetaTag', () => {
    it('should create meta element with correct attributes', () => {
      const mockElement = {
        httpEquiv: '',
        content: '',
        setAttribute: mockSetAttribute,
      }
      mockCreateElement.mockReturnValue(mockElement)

      const result = createCSPMetaTag()

      expect(mockCreateElement).toHaveBeenCalledWith('meta')
      expect(result.httpEquiv).toBe('Content-Security-Policy')
      expect(result.content).toContain("default-src 'self'")
    })

    it('should set content to generated CSP header', () => {
      const mockElement = {
        httpEquiv: '',
        content: '',
        setAttribute: mockSetAttribute,
      }
      mockCreateElement.mockReturnValue(mockElement)

      const result = createCSPMetaTag()
      const expectedCSP = generateCSPHeader()

      expect(result.content).toBe(expectedCSP)
    })

    it('should return proper meta element structure', () => {
      const mockElement = {
        httpEquiv: '',
        content: '',
        setAttribute: mockSetAttribute,
      }
      mockCreateElement.mockReturnValue(mockElement)

      const result = createCSPMetaTag()

      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
      expect(result.httpEquiv).toBeDefined()
      expect(result.content).toBeDefined()
    })
  })

  describe('injectCSPMetaTag', () => {
    it('should create and append new meta tag when none exists', () => {
      mockQuerySelector.mockReturnValue(null) // No existing CSP tag
      const mockElement = {
        httpEquiv: '',
        content: '',
        setAttribute: mockSetAttribute,
      }
      mockCreateElement.mockReturnValue(mockElement)

      injectCSPMetaTag()

      expect(mockQuerySelector).toHaveBeenCalledWith('meta[http-equiv="Content-Security-Policy"]')
      expect(mockCreateElement).toHaveBeenCalledWith('meta')
      expect(mockAppendChild).toHaveBeenCalledWith(mockElement)
    })

    it('should update existing meta tag when one exists', () => {
      const existingElement = {
        setAttribute: mockSetAttribute,
      }
      mockQuerySelector.mockReturnValue(existingElement)

      injectCSPMetaTag()

      expect(mockQuerySelector).toHaveBeenCalledWith('meta[http-equiv="Content-Security-Policy"]')
      expect(existingElement.setAttribute).toHaveBeenCalledWith('content', generateCSPHeader())
      expect(mockCreateElement).not.toHaveBeenCalled()
      expect(mockAppendChild).not.toHaveBeenCalled()
    })

    it('should update content with current CSP configuration', () => {
      const existingElement = {
        setAttribute: mockSetAttribute,
      }
      mockQuerySelector.mockReturnValue(existingElement)

      injectCSPMetaTag()

      const expectedCSP = generateCSPHeader()
      expect(existingElement.setAttribute).toHaveBeenCalledWith('content', expectedCSP)
    })
  })

  describe('reportCSPViolation', () => {
    let mockViolation: SecurityPolicyViolationEvent

    beforeEach(() => {
      mockViolation = {
        blockedURI: 'https://evil.com/script.js',
        violatedDirective: 'script-src',
        effectiveDirective: 'script-src',
        originalPolicy: "default-src 'self'",
        disposition: 'enforce',
        documentURI: 'https://example.com/page',
        referrer: 'https://example.com',
        statusCode: 0,
        sourceFile: 'https://example.com/app.js',
        lineNumber: 42,
        columnNumber: 10,
      } as SecurityPolicyViolationEvent
    })

    it('should create comprehensive violation report in development', () => {
      mockEnv.app.isDevelopment = true
      mockEnv.app.isProduction = false

      reportCSPViolation(mockViolation)

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'CSP Violation:',
        expect.objectContaining({
          blockedUri: 'https://evil.com/script.js',
          violatedDirective: 'script-src',
          effectiveDirective: 'script-src',
          originalPolicy: "default-src 'self'",
          disposition: 'enforce',
          documentUri: 'https://example.com/page',
          referrer: 'https://example.com',
          statusCode: 0,
          sourceFile: 'https://example.com/app.js',
          lineNumber: 42,
          columnNumber: 10,
          timestamp: expect.any(String),
        })
      )
    })

    it('should include timestamp in ISO format', () => {
      mockEnv.app.isDevelopment = true

      const beforeTime = new Date().toISOString()
      reportCSPViolation(mockViolation)
      const afterTime = new Date().toISOString()

      expect(mockConsoleWarn).toHaveBeenCalled()
      const reportCall = mockConsoleWarn.mock.calls[0]
      const report = reportCall[1]
      
      expect(report.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(report.timestamp).toBeGreaterThanOrEqual(beforeTime)
      expect(report.timestamp).toBeLessThanOrEqual(afterTime)
    })

    it('should log to console in development mode', () => {
      mockEnv.app.isDevelopment = true
      mockEnv.app.isProduction = false

      reportCSPViolation(mockViolation)

      expect(mockConsoleWarn).toHaveBeenCalledWith('CSP Violation:', expect.any(Object))
    })

    it('should not log to console in production mode', () => {
      mockEnv.app.isDevelopment = false
      mockEnv.app.isProduction = true

      reportCSPViolation(mockViolation)

      expect(mockConsoleWarn).not.toHaveBeenCalled()
    })

    it('should handle violations with missing properties', () => {
      mockEnv.app.isDevelopment = true
      
      const incompleteViolation = {
        blockedURI: 'https://evil.com/script.js',
        violatedDirective: 'script-src',
        // Missing other properties
      } as SecurityPolicyViolationEvent

      expect(() => reportCSPViolation(incompleteViolation)).not.toThrow()
      expect(mockConsoleWarn).toHaveBeenCalled()
    })

    it('should handle violations with null/undefined values', () => {
      mockEnv.app.isDevelopment = true
      
      const nullViolation = {
        blockedURI: null,
        violatedDirective: undefined,
        effectiveDirective: 'script-src',
        originalPolicy: '',
      } as any

      expect(() => reportCSPViolation(nullViolation)).not.toThrow()
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'CSP Violation:',
        expect.objectContaining({
          blockedUri: null,
          violatedDirective: undefined,
        })
      )
    })

    it('should handle very long violation data', () => {
      mockEnv.app.isDevelopment = true
      
      const longViolation = {
        ...mockViolation,
        blockedURI: 'https://evil.com/' + 'A'.repeat(1000),
        originalPolicy: 'default-src ' + "'self' ".repeat(100),
      }

      expect(() => reportCSPViolation(longViolation)).not.toThrow()
      expect(mockConsoleWarn).toHaveBeenCalled()
    })
  })

  describe('initializeCSPMonitoring', () => {
    it('should add event listener for CSP violations', () => {
      initializeCSPMonitoring()

      expect(mockAddEventListener).toHaveBeenCalledWith(
        'securitypolicyviolation',
        reportCSPViolation
      )
    })

    it('should only add one event listener per call', () => {
      initializeCSPMonitoring()

      expect(mockAddEventListener).toHaveBeenCalledTimes(1)
    })

    it('should handle multiple initializations', () => {
      initializeCSPMonitoring()
      initializeCSPMonitoring()
      initializeCSPMonitoring()

      expect(mockAddEventListener).toHaveBeenCalledTimes(3)
      expect(mockAddEventListener).toHaveBeenCalledWith(
        'securitypolicyviolation',
        reportCSPViolation
      )
    })
  })

  describe('integration scenarios', () => {
    it('should work with complete CSP workflow', () => {
      // 1. Generate CSP header
      const cspHeader = generateCSPHeader()
      expect(cspHeader).toBeTruthy()

      // 2. Create meta tag
      const mockElement = {
        httpEquiv: '',
        content: '',
        setAttribute: mockSetAttribute,
      }
      mockCreateElement.mockReturnValue(mockElement)
      const metaTag = createCSPMetaTag()
      expect(metaTag.content).toBe(cspHeader)

      // 3. Inject meta tag
      mockQuerySelector.mockReturnValue(null)
      injectCSPMetaTag()
      expect(mockAppendChild).toHaveBeenCalledWith(mockElement)

      // 4. Initialize monitoring
      initializeCSPMonitoring()
      expect(mockAddEventListener).toHaveBeenCalledWith(
        'securitypolicyviolation',
        reportCSPViolation
      )
    })

    it('should handle updating existing CSP configuration', () => {
      // First injection
      mockQuerySelector.mockReturnValue(null)
      const mockElement = {
        httpEquiv: '',
        content: '',
        setAttribute: mockSetAttribute,
      }
      mockCreateElement.mockReturnValue(mockElement)
      
      injectCSPMetaTag()
      expect(mockAppendChild).toHaveBeenCalledWith(mockElement)

      // Second injection should update existing
      mockQuerySelector.mockReturnValue({
        setAttribute: mockSetAttribute,
      })
      mockCreateElement.mockClear()
      mockAppendChild.mockClear()

      injectCSPMetaTag()
      expect(mockCreateElement).not.toHaveBeenCalled()
      expect(mockAppendChild).not.toHaveBeenCalled()
      expect(mockSetAttribute).toHaveBeenCalledWith('content', generateCSPHeader())
    })

    it('should maintain consistency between header generation and meta tag', () => {
      const directHeader = generateCSPHeader()
      
      const mockElement = {
        httpEquiv: '',
        content: '',
        setAttribute: mockSetAttribute,
      }
      mockCreateElement.mockReturnValue(mockElement)
      
      const metaTag = createCSPMetaTag()

      expect(metaTag.content).toBe(directHeader)
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle DOM manipulation errors gracefully', () => {
      mockQuerySelector.mockImplementation(() => {
        throw new Error('DOM error')
      })

      expect(() => injectCSPMetaTag()).toThrow('DOM error')
    })

    it('should handle event listener errors gracefully', () => {
      mockAddEventListener.mockImplementation(() => {
        throw new Error('Event listener error')
      })

      expect(() => initializeCSPMonitoring()).toThrow('Event listener error')
    })

    it('should handle very long CSP headers', () => {
      const result = generateCSPHeader()
      
      // CSP should be substantial but manageable
      expect(result.length).toBeGreaterThan(100)
      expect(result.length).toBeLessThan(10000)
      expect(result).toContain('script-src')
      expect(result).toContain('connect-src')
    })

    it('should handle special characters in CSP directives', () => {
      const result = generateCSPHeader()
      
      expect(result).toContain("'unsafe-inline'")
      expect(result).toContain("'self'")
      expect(result).toContain("'none'")
    })

    it('should handle browser compatibility issues', () => {
      // Mock browser without CSP support
      const originalDocument = global.document
      global.document = {
        ...originalDocument,
        querySelector: undefined,
      } as any

      expect(() => injectCSPMetaTag()).toThrow()

      global.document = originalDocument
    })

    it('should handle malformed violation events', () => {
      mockEnv.app.isDevelopment = true
      
      const malformedViolation = {} as SecurityPolicyViolationEvent

      expect(() => reportCSPViolation(malformedViolation)).not.toThrow()
      expect(mockConsoleWarn).toHaveBeenCalled()
    })

    it('should handle unicode and special characters in violations', () => {
      mockEnv.app.isDevelopment = true
      
      const unicodeViolation = {
        ...mockViolation,
        blockedURI: 'https://example.com/测试.js',
        documentURI: 'https://example.com/页面',
      }

      expect(() => reportCSPViolation(unicodeViolation)).not.toThrow()
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'CSP Violation:',
        expect.objectContaining({
          blockedUri: 'https://example.com/测试.js',
          documentUri: 'https://example.com/页面',
        })
      )
    })
  })
})