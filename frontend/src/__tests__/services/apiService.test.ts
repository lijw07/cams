import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { apiService } from '@/services/apiService'

// Mock dependencies
const mockAxiosCreate = vi.fn(() => ({
  interceptors: {
    request: {
      use: vi.fn(),
    },
    response: {
      use: vi.fn(),
    }
  },
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('axios', () => ({
  default: {
    create: mockAxiosCreate,
    isAxiosError: vi.fn(),
  },
  isAxiosError: vi.fn(),
}))

vi.mock('@/config/environment', () => ({
  env: {
    api: {
      baseUrl: 'https://api.example.com',
      timeout: 30000,
    },
    app: {
      isProduction: false,
    }
  }
}))

vi.mock('@/utils/errorNormalizer', () => ({
  normalizeError: vi.fn((error) => ({
    Code: 'NORMALIZED_ERROR',
    Message: error.message || 'Normalized error',
    Details: {},
    TraceId: '123',
  }))
}))

vi.mock('@/utils/retryHelper', () => ({
  addRetryInterceptor: vi.fn()
}))

vi.mock('@/utils/secureStorage', () => ({
  secureStorage: {
    getToken: vi.fn(),
    setToken: vi.fn(),
    removeToken: vi.fn(),
    isAuthenticated: vi.fn(),
  }
}))

// Get mocked dependencies
import { secureStorage } from '@/utils/secureStorage'
import { normalizeError } from '@/utils/errorNormalizer'
import { addRetryInterceptor } from '@/utils/retryHelper'

describe('ApiService', () => {
  let mockAxiosInstance: any
  let requestInterceptor: any
  let responseInterceptor: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset window event listeners
    window.dispatchEvent = vi.fn()
    
    // Mock axios instance
    mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: {
          use: vi.fn((onFulfilled, onRejected) => {
            requestInterceptor = { onFulfilled, onRejected }
            return 0
          })
        },
        response: {
          use: vi.fn((onFulfilled, onRejected) => {
            responseInterceptor = { onFulfilled, onRejected }
            return 1
          })
        }
      }
    }
    
    ;(axios.create as any).mockReturnValue(mockAxiosInstance)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('should create axios instance with correct config', () => {
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.example.com',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
        withCredentials: true,
      })
    })

    it('should setup interceptors', () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled()
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled()
    })

    it('should add retry interceptor', () => {
      expect(addRetryInterceptor).toHaveBeenCalledWith(mockAxiosInstance)
    })
  })

  describe('request interceptor', () => {
    it('should add auth token to requests', () => {
      ;(secureStorage.getToken as any).mockReturnValue('test-token')
      
      const config = { headers: {} }
      const result = requestInterceptor.onFulfilled(config)
      
      expect(result.headers.Authorization).toBe('Bearer test-token')
    })

    it('should not add auth header when no token', () => {
      ;(secureStorage.getToken as any).mockReturnValue(null)
      
      const config = { headers: {} }
      const result = requestInterceptor.onFulfilled(config)
      
      expect(result.headers.Authorization).toBeUndefined()
    })

    it('should add request ID header', () => {
      const config = { headers: {} }
      const result = requestInterceptor.onFulfilled(config)
      
      expect(result.headers['X-Request-ID']).toMatch(/^\d+-[a-z0-9]+$/)
    })

    it('should handle request errors', async () => {
      const error = new Error('Request error')
      
      await expect(requestInterceptor.onRejected(error)).rejects.toEqual({
        Code: 'NORMALIZED_ERROR',
        Message: 'Request error',
        Details: {},
        TraceId: '123',
      })
    })
  })

  describe('response interceptor', () => {
    it('should pass through successful responses', async () => {
      const response = { data: { success: true } }
      
      const result = await responseInterceptor.onFulfilled(response)
      
      expect(result).toBe(response)
    })

    it('should reject failed ApiResponse format', async () => {
      const response = {
        data: {
          Success: false,
          Error: {
            Code: 'API_ERROR',
            Message: 'Something went wrong',
          }
        }
      }
      
      await expect(responseInterceptor.onFulfilled(response)).rejects.toEqual({
        Code: 'API_ERROR',
        Message: 'Something went wrong',
      })
    })

    it('should handle 401 unauthorized errors', async () => {
      const error = {
        response: { status: 401 },
        config: { url: '/some-endpoint' }
      } as AxiosError
      
      await expect(responseInterceptor.onRejected(error)).rejects.toBeDefined()
      
      expect(secureStorage.removeToken).toHaveBeenCalled()
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'auth:unauthorized'
        })
      )
    })

    it('should not handle unauthorized for logout requests', async () => {
      const error = {
        response: { status: 401 },
        config: { url: '/auth/logout' }
      } as AxiosError
      
      await expect(responseInterceptor.onRejected(error)).rejects.toBeDefined()
      
      expect(window.dispatchEvent).not.toHaveBeenCalled()
    })

    it('should log server errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const error = {
        response: { status: 500 },
        config: { url: '/api/test' }
      } as AxiosError
      
      await expect(responseInterceptor.onRejected(error)).rejects.toBeDefined()
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Server error:',
        expect.objectContaining({
          Code: 'NORMALIZED_ERROR'
        })
      )
      
      consoleErrorSpy.mockRestore()
    })
  })

  describe('HTTP methods', () => {
    describe('get', () => {
      it('should make GET request and return data', async () => {
        const mockData = { id: 1, name: 'Test' }
        mockAxiosInstance.get.mockResolvedValue({ data: mockData })
        
        const result = await apiService.get('/test')
        
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', { params: undefined })
        expect(result).toEqual(mockData)
      })

      it('should pass query parameters', async () => {
        const mockData = { results: [] }
        const params = { page: 1, limit: 10 }
        mockAxiosInstance.get.mockResolvedValue({ data: mockData })
        
        await apiService.get('/test', params)
        
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', { params })
      })

      it('should handle errors', async () => {
        const error = new Error('Network error')
        mockAxiosInstance.get.mockRejectedValue(error)
        
        await expect(apiService.get('/test')).rejects.toEqual({
          Code: 'NORMALIZED_ERROR',
          Message: 'Network error',
          Details: {},
          TraceId: '123',
        })
      })
    })

    describe('post', () => {
      it('should make POST request with data', async () => {
        const requestData = { name: 'New Item' }
        const responseData = { id: 1, ...requestData }
        mockAxiosInstance.post.mockResolvedValue({ data: responseData })
        
        const result = await apiService.post('/test', requestData)
        
        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', requestData)
        expect(result).toEqual(responseData)
      })

      it('should handle POST without data', async () => {
        const responseData = { success: true }
        mockAxiosInstance.post.mockResolvedValue({ data: responseData })
        
        const result = await apiService.post('/test')
        
        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', undefined)
        expect(result).toEqual(responseData)
      })

      it('should handle API errors', async () => {
        const apiError = {
          Code: 'VALIDATION_ERROR',
          Message: 'Invalid data',
        }
        mockAxiosInstance.post.mockRejectedValue(apiError)
        
        await expect(apiService.post('/test', {})).rejects.toEqual(apiError)
      })
    })

    describe('put', () => {
      it('should make PUT request with data', async () => {
        const requestData = { id: 1, name: 'Updated' }
        const responseData = { ...requestData, updatedAt: new Date() }
        mockAxiosInstance.put.mockResolvedValue({ data: responseData })
        
        const result = await apiService.put('/test/1', requestData)
        
        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test/1', requestData)
        expect(result).toEqual(responseData)
      })
    })

    describe('patch', () => {
      it('should make PATCH request with partial data', async () => {
        const requestData = { name: 'Partially Updated' }
        const responseData = { id: 1, ...requestData }
        mockAxiosInstance.patch.mockResolvedValue({ data: responseData })
        
        const result = await apiService.patch('/test/1', requestData)
        
        expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/test/1', requestData)
        expect(result).toEqual(responseData)
      })
    })

    describe('delete', () => {
      it('should make DELETE request', async () => {
        const responseData = { success: true }
        mockAxiosInstance.delete.mockResolvedValue({ data: responseData })
        
        const result = await apiService.delete('/test/1')
        
        expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test/1')
        expect(result).toEqual(responseData)
      })
    })
  })

  describe('token management', () => {
    it('should set token', () => {
      apiService.setToken('new-token')
      
      expect(secureStorage.setToken).toHaveBeenCalledWith('new-token')
    })

    it('should get token', () => {
      ;(secureStorage.getToken as any).mockReturnValue('stored-token')
      
      const token = apiService.getToken()
      
      expect(token).toBe('stored-token')
    })

    it('should remove token', () => {
      apiService.removeToken()
      
      expect(secureStorage.removeToken).toHaveBeenCalled()
    })

    it('should check authentication status', () => {
      ;(secureStorage.isAuthenticated as any).mockReturnValue(true)
      
      const isAuth = apiService.isAuthenticated()
      
      expect(isAuth).toBe(true)
      expect(secureStorage.isAuthenticated).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network Error')
      networkError.name = 'NetworkError'
      mockAxiosInstance.get.mockRejectedValue(networkError)
      
      await expect(apiService.get('/test')).rejects.toEqual({
        Code: 'NORMALIZED_ERROR',
        Message: 'Network Error',
        Details: {},
        TraceId: '123',
      })
    })

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('timeout of 30000ms exceeded')
      timeoutError.name = 'AxiosError'
      ;(timeoutError as any).code = 'ECONNABORTED'
      mockAxiosInstance.get.mockRejectedValue(timeoutError)
      
      await expect(apiService.get('/test')).rejects.toBeDefined()
    })

    it('should handle JSON parse errors', async () => {
      const parseError = new SyntaxError('Unexpected token < in JSON')
      mockAxiosInstance.get.mockRejectedValue(parseError)
      
      await expect(apiService.get('/test')).rejects.toBeDefined()
    })
  })

  describe('monitoring', () => {
    it('should log errors in production', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Mock production environment
      vi.doMock('../config/environment', () => ({
        env: {
          api: {
            baseUrl: 'https://api.example.com',
            timeout: 30000,
          },
          app: {
            isProduction: true,
          }
        }
      }))
      
      const error = {
        response: { status: 500, data: { error: 'Server Error' } },
        config: { url: '/api/test', method: 'GET' }
      } as AxiosError
      
      await expect(responseInterceptor.onRejected(error)).rejects.toBeDefined()
      
      // In real implementation would send to monitoring service
      expect(consoleErrorSpy).toHaveBeenCalled()
      
      consoleErrorSpy.mockRestore()
    })
  })

  describe('request ID generation', () => {
    it('should generate unique request IDs', () => {
      const config1 = { headers: {} }
      const config2 = { headers: {} }
      
      const result1 = requestInterceptor.onFulfilled(config1)
      const result2 = requestInterceptor.onFulfilled(config2)
      
      expect(result1.headers['X-Request-ID']).toBeDefined()
      expect(result2.headers['X-Request-ID']).toBeDefined()
      expect(result1.headers['X-Request-ID']).not.toBe(result2.headers['X-Request-ID'])
    })
  })

  describe('ApiResponse format detection', () => {
    it('should detect valid ApiResponse format', async () => {
      const validApiResponse = {
        data: {
          Success: true,
          Data: { id: 1 },
          Error: null
        }
      }
      
      const result = await responseInterceptor.onFulfilled(validApiResponse)
      expect(result).toBe(validApiResponse)
    })

    it('should pass through non-ApiResponse format', async () => {
      const regularResponse = {
        data: { id: 1, name: 'Test' }
      }
      
      const result = await responseInterceptor.onFulfilled(regularResponse)
      expect(result).toBe(regularResponse)
    })
  })
})