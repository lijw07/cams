import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AxiosError, AxiosResponse } from 'axios'
import { normalizeError, getUserMessage } from '@/utils/errorNormalizer'
import { ApiError, ErrorCode, HttpStatus } from '@/types/api'

describe('errorNormalizer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('normalizeError', () => {
    describe('AxiosError handling', () => {
      it('should normalize network errors (no response)', () => {
        const axiosError: AxiosError = {
          name: 'AxiosError',
          message: 'Network Error',
          isAxiosError: true,
          config: {},
          toJSON: () => ({}),
          response: undefined,
          request: {},
        }

        const result = normalizeError(axiosError)

        expect(result).toEqual({
          Code: ErrorCode.NETWORK_ERROR,
          Message: 'Network Error',
          Details: {
            network: ['Unable to connect to server'],
          },
        })
      })

      it('should handle network errors with no message', () => {
        const axiosError: AxiosError = {
          name: 'AxiosError',
          message: '',
          isAxiosError: true,
          config: {},
          toJSON: () => ({}),
          response: undefined,
          request: {},
        }

        const result = normalizeError(axiosError)

        expect(result).toEqual({
          Code: ErrorCode.NETWORK_ERROR,
          Message: 'Network error occurred',
          Details: {
            network: ['Unable to connect to server'],
          },
        })
      })

      it('should pass through server ApiError responses unchanged', () => {
        const serverApiError: ApiError = {
          Code: ErrorCode.VALIDATION_FAILED,
          Message: 'Custom validation error',
          Details: {
            name: ['Name is required'],
            email: ['Invalid email format'],
          },
          TraceId: 'trace-123',
        }

        const axiosError: AxiosError = {
          name: 'AxiosError',
          message: 'Request failed',
          isAxiosError: true,
          config: {},
          toJSON: () => ({}),
          response: {
            status: 400,
            data: serverApiError,
          } as AxiosResponse,
          request: {},
        }

        const result = normalizeError(axiosError)

        expect(result).toEqual(serverApiError)
      })

      it('should map HTTP status codes correctly', () => {
        const statusMappings = [
          {
            status: HttpStatus.BAD_REQUEST,
            expectedCode: ErrorCode.VALIDATION_FAILED,
            expectedMessage: 'Invalid request',
          },
          {
            status: HttpStatus.UNAUTHORIZED,
            expectedCode: ErrorCode.UNAUTHORIZED,
            expectedMessage: 'Authentication required',
          },
          {
            status: HttpStatus.FORBIDDEN,
            expectedCode: ErrorCode.OPERATION_NOT_ALLOWED,
            expectedMessage: 'Access denied',
          },
          {
            status: HttpStatus.NOT_FOUND,
            expectedCode: ErrorCode.RESOURCE_NOT_FOUND,
            expectedMessage: 'Resource not found',
          },
          {
            status: HttpStatus.CONFLICT,
            expectedCode: ErrorCode.DUPLICATE_RESOURCE,
            expectedMessage: 'Resource already exists',
          },
          {
            status: HttpStatus.UNPROCESSABLE_ENTITY,
            expectedCode: ErrorCode.VALIDATION_FAILED,
            expectedMessage: 'Validation failed',
          },
          {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            expectedCode: ErrorCode.INTERNAL_ERROR,
            expectedMessage: 'Internal server error',
          },
          {
            status: HttpStatus.BAD_GATEWAY,
            expectedCode: ErrorCode.EXTERNAL_SERVICE_ERROR,
            expectedMessage: 'External service error',
          },
          {
            status: HttpStatus.SERVICE_UNAVAILABLE,
            expectedCode: ErrorCode.EXTERNAL_SERVICE_ERROR,
            expectedMessage: 'Service temporarily unavailable',
          },
          {
            status: HttpStatus.GATEWAY_TIMEOUT,
            expectedCode: ErrorCode.TIMEOUT,
            expectedMessage: 'Request timeout',
          },
        ]

        statusMappings.forEach(({ status, expectedCode, expectedMessage }) => {
          const axiosError: AxiosError = {
            name: 'AxiosError',
            message: 'Request failed',
            isAxiosError: true,
            config: {},
            toJSON: () => ({}),
            response: {
              status,
              data: {},
            } as AxiosResponse,
            request: {},
          }

          const result = normalizeError(axiosError)

          expect(result.Code).toBe(expectedCode)
          expect(result.Message).toBe(expectedMessage)
        })
      })

      it('should handle unknown HTTP status codes', () => {
        const axiosError: AxiosError = {
          name: 'AxiosError',
          message: 'Request failed',
          isAxiosError: true,
          config: {},
          toJSON: () => ({}),
          response: {
            status: 418, // I'm a teapot
            data: {},
          } as AxiosResponse,
          request: {},
        }

        const result = normalizeError(axiosError)

        expect(result).toEqual({
          Code: ErrorCode.INTERNAL_ERROR,
          Message: 'Unexpected error (418)',
        })
      })

      it('should extract validation errors from response data', () => {
        const responseData = {
          errors: {
            name: ['Name is required', 'Name must be at least 3 characters'],
            email: 'Invalid email format',
            age: [25], // Non-string value should be converted
          },
        }

        const axiosError: AxiosError = {
          name: 'AxiosError',
          message: 'Request failed',
          isAxiosError: true,
          config: {},
          toJSON: () => ({}),
          response: {
            status: 400,
            data: responseData,
          } as AxiosResponse,
          request: {},
        }

        const result = normalizeError(axiosError)

        expect(result.Details).toEqual({
          name: ['Name is required', 'Name must be at least 3 characters'],
          email: ['Invalid email format'],
          age: ['25'],
        })
      })

      it('should override default message with response message', () => {
        const responseData = {
          message: 'Custom error message from server',
        }

        const axiosError: AxiosError = {
          name: 'AxiosError',
          message: 'Request failed',
          isAxiosError: true,
          config: {},
          toJSON: () => ({}),
          response: {
            status: 400,
            data: responseData,
          } as AxiosResponse,
          request: {},
        }

        const result = normalizeError(axiosError)

        expect(result.Message).toBe('Custom error message from server')
      })

      it('should extract traceId from response data', () => {
        const responseData = {
          traceId: 'trace-abc-123',
        }

        const axiosError: AxiosError = {
          name: 'AxiosError',
          message: 'Request failed',
          isAxiosError: true,
          config: {},
          toJSON: () => ({}),
          response: {
            status: 500,
            data: responseData,
          } as AxiosResponse,
          request: {},
        }

        const result = normalizeError(axiosError)

        expect(result.TraceId).toBe('trace-abc-123')
      })

      it('should handle non-object response data', () => {
        const axiosError: AxiosError = {
          name: 'AxiosError',
          message: 'Request failed',
          isAxiosError: true,
          config: {},
          toJSON: () => ({}),
          response: {
            status: 400,
            data: 'Simple string error',
          } as AxiosResponse,
          request: {},
        }

        const result = normalizeError(axiosError)

        expect(result).toEqual({
          Code: ErrorCode.VALIDATION_FAILED,
          Message: 'Invalid request',
        })
      })
    })

    describe('Error object handling', () => {
      it('should normalize standard Error objects', () => {
        const error = new Error('Something went wrong')
        error.stack = 'Error: Something went wrong\n  at test.js:1:1'

        const result = normalizeError(error)

        expect(result).toEqual({
          Code: ErrorCode.INTERNAL_ERROR,
          Message: 'Something went wrong',
          Details: {
            error: ['Error: Something went wrong\n  at test.js:1:1'],
          },
        })
      })

      it('should handle Error objects without stack trace', () => {
        const error = new Error('No stack error')
        error.stack = undefined

        const result = normalizeError(error)

        expect(result).toEqual({
          Code: ErrorCode.INTERNAL_ERROR,
          Message: 'No stack error',
          Details: {
            error: ['No stack trace available'],
          },
        })
      })

      it('should handle custom Error types', () => {
        class CustomError extends Error {
          constructor(message: string) {
            super(message)
            this.name = 'CustomError'
          }
        }

        const error = new CustomError('Custom error occurred')

        const result = normalizeError(error)

        expect(result.Code).toBe(ErrorCode.INTERNAL_ERROR)
        expect(result.Message).toBe('Custom error occurred')
        expect(result.Details?.error).toBeDefined()
      })
    })

    describe('String error handling', () => {
      it('should normalize string errors', () => {
        const error = 'Simple string error'

        const result = normalizeError(error)

        expect(result).toEqual({
          Code: ErrorCode.INTERNAL_ERROR,
          Message: 'Simple string error',
        })
      })

      it('should handle empty string errors', () => {
        const error = ''

        const result = normalizeError(error)

        expect(result).toEqual({
          Code: ErrorCode.INTERNAL_ERROR,
          Message: '',
        })
      })
    })

    describe('Unknown error handling', () => {
      it('should handle null errors', () => {
        const result = normalizeError(null)

        expect(result).toEqual({
          Code: ErrorCode.INTERNAL_ERROR,
          Message: 'An unknown error occurred',
          Details: {
            error: ['null'],
          },
        })
      })

      it('should handle undefined errors', () => {
        const result = normalizeError(undefined)

        expect(result).toEqual({
          Code: ErrorCode.INTERNAL_ERROR,
          Message: 'An unknown error occurred',
          Details: {
            error: [undefined],
          },
        })
      })

      it('should handle complex object errors', () => {
        const complexError = {
          type: 'CustomError',
          details: {
            nested: 'value',
            array: [1, 2, 3],
          },
        }

        const result = normalizeError(complexError)

        expect(result.Code).toBe(ErrorCode.INTERNAL_ERROR)
        expect(result.Message).toBe('An unknown error occurred')
        expect(result.Details?.error).toEqual([JSON.stringify(complexError)])
      })

      it('should handle circular reference objects safely', () => {
        const circularError: any = { name: 'CircularError' }
        circularError.self = circularError

        // This should throw an error because JSON.stringify can't handle circular refs
        expect(() => normalizeError(circularError)).toThrow('Converting circular structure to JSON')
      })
    })

    describe('isAxiosError type guard', () => {
      it('should correctly identify AxiosError objects', () => {
        const axiosError: AxiosError = {
          name: 'AxiosError',
          message: 'Test error',
          isAxiosError: true,
          config: {},
          toJSON: () => ({}),
        }

        const result = normalizeError(axiosError)

        expect(result.Code).toBe(ErrorCode.NETWORK_ERROR) // No response case
      })

      it('should reject objects without isAxiosError property', () => {
        const fakeAxiosError = {
          name: 'AxiosError',
          message: 'Test error',
          config: {},
        }

        const result = normalizeError(fakeAxiosError)

        expect(result.Code).toBe(ErrorCode.INTERNAL_ERROR)
        expect(result.Message).toBe('An unknown error occurred')
      })

      it('should reject objects with false isAxiosError', () => {
        const fakeAxiosError = {
          name: 'AxiosError',
          message: 'Test error',
          isAxiosError: false,
          config: {},
        }

        const result = normalizeError(fakeAxiosError)

        expect(result.Code).toBe(ErrorCode.INTERNAL_ERROR)
        expect(result.Message).toBe('An unknown error occurred')
      })
    })

    describe('isApiError type guard', () => {
      it('should correctly identify valid ApiError objects', () => {
        const serverApiError: ApiError = {
          Code: ErrorCode.VALIDATION_FAILED,
          Message: 'Validation failed',
        }

        const axiosError: AxiosError = {
          name: 'AxiosError',
          message: 'Request failed',
          isAxiosError: true,
          config: {},
          toJSON: () => ({}),
          response: {
            status: 400,
            data: serverApiError,
          } as AxiosResponse,
          request: {},
        }

        const result = normalizeError(axiosError)

        expect(result).toEqual(serverApiError)
      })

      it('should reject objects without Code property', () => {
        const invalidApiError = {
          Message: 'Error message',
        }

        const axiosError: AxiosError = {
          name: 'AxiosError',
          message: 'Request failed',
          isAxiosError: true,
          config: {},
          toJSON: () => ({}),
          response: {
            status: 400,
            data: invalidApiError,
          } as AxiosResponse,
          request: {},
        }

        const result = normalizeError(axiosError)

        expect(result.Code).toBe(ErrorCode.VALIDATION_FAILED)
        expect(result.Message).toBe('Invalid request')
      })

      it('should reject objects with non-string Code', () => {
        const invalidApiError = {
          Code: 123,
          Message: 'Error message',
        }

        const axiosError: AxiosError = {
          name: 'AxiosError',
          message: 'Request failed',
          isAxiosError: true,
          config: {},
          toJSON: () => ({}),
          response: {
            status: 400,
            data: invalidApiError,
          } as AxiosResponse,
          request: {},
        }

        const result = normalizeError(axiosError)

        expect(result.Code).toBe(ErrorCode.VALIDATION_FAILED)
        expect(result.Message).toBe('Invalid request')
      })
    })
  })

  describe('getUserMessage', () => {
    it('should return custom message for INVALID_CREDENTIALS', () => {
      const error: ApiError = {
        Code: ErrorCode.INVALID_CREDENTIALS,
        Message: 'Authentication failed',
      }

      const result = getUserMessage(error)

      expect(result).toBe('Invalid username or password')
    })

    it('should return custom message for TOKEN_EXPIRED', () => {
      const error: ApiError = {
        Code: ErrorCode.TOKEN_EXPIRED,
        Message: 'Token has expired',
      }

      const result = getUserMessage(error)

      expect(result).toBe('Your session has expired. Please sign in again.')
    })

    it('should return custom message for NETWORK_ERROR', () => {
      const error: ApiError = {
        Code: ErrorCode.NETWORK_ERROR,
        Message: 'Network connection failed',
      }

      const result = getUserMessage(error)

      expect(result).toBe('Unable to connect to server. Please check your internet connection.')
    })

    it('should return custom message for TIMEOUT', () => {
      const error: ApiError = {
        Code: ErrorCode.TIMEOUT,
        Message: 'Request timed out',
      }

      const result = getUserMessage(error)

      expect(result).toBe('The request took too long. Please try again.')
    })

    it('should return original message for other error codes', () => {
      const error: ApiError = {
        Code: ErrorCode.VALIDATION_FAILED,
        Message: 'Custom validation message',
      }

      const result = getUserMessage(error)

      expect(result).toBe('Custom validation message')
    })

    it('should handle unknown error codes', () => {
      const error: ApiError = {
        Code: 'UNKNOWN_ERROR' as ErrorCode,
        Message: 'Unknown error message',
      }

      const result = getUserMessage(error)

      expect(result).toBe('Unknown error message')
    })
  })

  describe('edge cases', () => {
    it('should handle malformed axios error objects', () => {
      const malformedError = {
        isAxiosError: true,
        message: 'Malformed error',
        // Missing required properties
      }

      const result = normalizeError(malformedError)

      expect(result.Code).toBe(ErrorCode.NETWORK_ERROR)
      expect(result.Message).toBe('Malformed error')
    })

    it('should handle response data with circular references', () => {
      const circularData: any = { name: 'test' }
      circularData.self = circularData

      const axiosError: AxiosError = {
        name: 'AxiosError',
        message: 'Request failed',
        isAxiosError: true,
        config: {},
        toJSON: () => ({}),
        response: {
          status: 400,
          data: circularData,
        } as AxiosResponse,
        request: {},
      }

      // The implementation doesn't use JSON.stringify for axios error data processing
      // so circular references in response data don't cause issues
      const result = normalizeError(axiosError)

      expect(result.Code).toBe(ErrorCode.VALIDATION_FAILED)
      expect(result.Message).toBe('Invalid request')
    })

    it('should handle empty Details object properly', () => {
      const responseData = {
        errors: {},
      }

      const axiosError: AxiosError = {
        name: 'AxiosError',
        message: 'Request failed',
        isAxiosError: true,
        config: {},
        toJSON: () => ({}),
        response: {
          status: 400,
          data: responseData,
        } as AxiosResponse,
        request: {},
      }

      const result = normalizeError(axiosError)

      expect(result.Details).toBeUndefined()
    })

    it('should handle mixed validation error formats', () => {
      const responseData = {
        errors: {
          field1: ['Error 1', 'Error 2'],
          field2: 'Single error',
          field3: null,
          field4: undefined,
          field5: 123,
          field6: { nested: 'object' },
        },
      }

      const axiosError: AxiosError = {
        name: 'AxiosError',
        message: 'Request failed',
        isAxiosError: true,
        config: {},
        toJSON: () => ({}),
        response: {
          status: 400,
          data: responseData,
        } as AxiosResponse,
        request: {},
      }

      const result = normalizeError(axiosError)

      expect(result.Details).toEqual({
        field1: ['Error 1', 'Error 2'],
        field2: ['Single error'],
        // field3, field4, field5, field6 are ignored because they're not strings or arrays
      })
    })
  })
})