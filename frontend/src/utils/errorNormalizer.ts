import { AxiosError } from 'axios';

import { ApiError, ErrorCode, HttpStatus } from '../types/api';

/**
 * Normalizes various error formats into a consistent ApiError structure
 * @param error - The error to normalize (AxiosError, Error, or unknown)
 * @returns Normalized ApiError object
 */
export function normalizeError(error: unknown): ApiError {
  // Handle Axios errors
  if (isAxiosError(error)) {
    return normalizeAxiosError(error);
  }
  
  // Handle standard Error objects
  if (error instanceof Error) {
    return {
      Code: ErrorCode.INTERNAL_ERROR,
      Message: error.message,
      Details: {
        error: [error.stack || 'No stack trace available'],
      },
    };
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return {
      Code: ErrorCode.INTERNAL_ERROR,
      Message: error,
    };
  }
  
  // Handle unknown errors
  return {
    Code: ErrorCode.INTERNAL_ERROR,
    Message: 'An unknown error occurred',
    Details: {
      error: [JSON.stringify(error)],
    },
  };
}

/**
 * Type guard for AxiosError
 */
function isAxiosError(error: unknown): error is AxiosError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as AxiosError).isAxiosError === true
  );
}

/**
 * Normalizes Axios errors into ApiError format
 */
function normalizeAxiosError(error: AxiosError): ApiError {
  // Network error (no response)
  if (!error.response) {
    return {
      Code: ErrorCode.NETWORK_ERROR,
      Message: error.message || 'Network error occurred',
      Details: {
        network: ['Unable to connect to server'],
      },
    };
  }
  
  const { status, data } = error.response;
  
  // Check if the server already returned an ApiError format
  if (isApiError(data)) {
    return data;
  }
  
  // Map HTTP status codes to error codes
  const errorMapping: Record<number, { code: ErrorCode; message: string }> = {
    [HttpStatus.BAD_REQUEST]: {
      code: ErrorCode.VALIDATION_FAILED,
      message: 'Invalid request',
    },
    [HttpStatus.UNAUTHORIZED]: {
      code: ErrorCode.UNAUTHORIZED,
      message: 'Authentication required',
    },
    [HttpStatus.FORBIDDEN]: {
      code: ErrorCode.OPERATION_NOT_ALLOWED,
      message: 'Access denied',
    },
    [HttpStatus.NOT_FOUND]: {
      code: ErrorCode.RESOURCE_NOT_FOUND,
      message: 'Resource not found',
    },
    [HttpStatus.CONFLICT]: {
      code: ErrorCode.DUPLICATE_RESOURCE,
      message: 'Resource already exists',
    },
    [HttpStatus.UNPROCESSABLE_ENTITY]: {
      code: ErrorCode.VALIDATION_FAILED,
      message: 'Validation failed',
    },
    [HttpStatus.INTERNAL_SERVER_ERROR]: {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Internal server error',
    },
    [HttpStatus.BAD_GATEWAY]: {
      code: ErrorCode.EXTERNAL_SERVICE_ERROR,
      message: 'External service error',
    },
    [HttpStatus.SERVICE_UNAVAILABLE]: {
      code: ErrorCode.EXTERNAL_SERVICE_ERROR,
      message: 'Service temporarily unavailable',
    },
    [HttpStatus.GATEWAY_TIMEOUT]: {
      code: ErrorCode.TIMEOUT,
      message: 'Request timeout',
    },
  };
  
  const mapping = errorMapping[status] || {
    code: ErrorCode.INTERNAL_ERROR,
    message: `Unexpected error (${status})`,
  };
  
  // Extract details from response data
  const details: Record<string, string[]> = {};
  
  if (typeof data === 'object' && data !== null) {
    // Handle validation errors from backend
    if ('errors' in data && typeof data.errors === 'object') {
      Object.entries(data.errors as Record<string, unknown>).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          details[key] = value.map(String);
        } else if (typeof value === 'string') {
          details[key] = [value];
        }
      });
    }
    
    // Handle message property
    if ('message' in data && typeof data.message === 'string') {
      mapping.message = data.message;
    }
    
    // Handle traceId if present
    const traceId = 'traceId' in data ? String(data.traceId) : undefined;
    
    return {
      Code: mapping.code,
      Message: mapping.message,
      Details: Object.keys(details).length > 0 ? details : undefined,
      TraceId: traceId,
    };
  }
  
  return {
    Code: mapping.code,
    Message: mapping.message,
  };
}

/**
 * Type guard for ApiError
 */
function isApiError(data: unknown): data is ApiError {
  return (
    typeof data === 'object' &&
    data !== null &&
    'Code' in data &&
    'Message' in data &&
    typeof (data as ApiError).Code === 'string' &&
    typeof (data as ApiError).Message === 'string'
  );
}

/**
 * Gets a user-friendly error message from an ApiError
 */
export function getUserMessage(error: ApiError): string {
  // Check for specific error codes that need custom messages
  switch (error.Code) {
    case ErrorCode.INVALID_CREDENTIALS:
      return 'Invalid username or password';
    case ErrorCode.TOKEN_EXPIRED:
      return 'Your session has expired. Please sign in again.';
    case ErrorCode.NETWORK_ERROR:
      return 'Unable to connect to server. Please check your internet connection.';
    case ErrorCode.TIMEOUT:
      return 'The request took too long. Please try again.';
    default:
      return error.Message;
  }
}