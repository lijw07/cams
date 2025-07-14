import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Setup environment variables for testing
Object.defineProperty(import.meta, 'env', {
  value: {
    MODE: 'test',
    VITE_APP_NAME: 'CAMS Test',
    VITE_APP_VERSION: '1.0.0-test',
    VITE_APP_ENVIRONMENT: 'test',
    VITE_APP_BUILD_NUMBER: 'test-build',
    VITE_APP_API_URL: 'http://localhost:8080',
    VITE_APP_API_TIMEOUT: '30000',
    VITE_APP_API_RETRY_ATTEMPTS: '3',
    VITE_APP_API_RETRY_DELAY: '1000',
    VITE_APP_AUTH_STORAGE_TYPE: 'localStorage',
    VITE_APP_SESSION_TIMEOUT: '1800000',
    VITE_APP_SESSION_WARNING_TIME: '300000',
    VITE_APP_TOKEN_REFRESH_INTERVAL: '600000',
    VITE_APP_FEATURE_ANALYTICS: 'false',
    VITE_APP_FEATURE_SIGNALR: 'false',
    VITE_APP_FEATURE_BULK_OPERATIONS: 'true',
    VITE_APP_FEATURE_ADVANCED_LOGGING: 'false',
    VITE_APP_GA_MEASUREMENT_ID: '',
    VITE_APP_ANALYTICS_DEBUG: 'false',
    VITE_APP_ANALYTICS_SAMPLING_RATE: '1.0',
    VITE_APP_PERFORMANCE_MONITORING: 'false',
    VITE_APP_LOG_LEVEL: 'error',
    VITE_APP_SENTRY_DSN: '',
    VITE_APP_THEME_MODE: 'system',
    VITE_APP_DEFAULT_PAGE_SIZE: '20',
    VITE_APP_MAX_FILE_UPLOAD_SIZE: '10485760',
  },
  writable: true,
})

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup()
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
})) as any

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
})) as any

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
})

// Mock localStorage with actual storage behavior
const localStorageData: { [key: string]: string } = {}
const localStorageMock = {
  getItem: vi.fn((key: string) => localStorageData[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageData[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageData[key]
  }),
  clear: vi.fn(() => {
    for (const key in localStorageData) {
      delete localStorageData[key]
    }
  }),
  length: 0,
  key: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock sessionStorage with actual storage behavior
const sessionStorageData: { [key: string]: string } = {}
const sessionStorageMock = {
  getItem: vi.fn((key: string) => sessionStorageData[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    sessionStorageData[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete sessionStorageData[key]
  }),
  clear: vi.fn(() => {
    for (const key in sessionStorageData) {
      delete sessionStorageData[key]
    }
  }),
  length: 0,
  key: vi.fn(),
}
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
})

// Mock fetch
global.fetch = vi.fn()

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mocked-url')
global.URL.revokeObjectURL = vi.fn()

// Suppress console.error and console.warn in tests
global.console.error = vi.fn()
global.console.warn = vi.fn()