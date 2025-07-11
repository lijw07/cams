/**
 * Standardized API error format as per CLAUDE.md requirements
 */
export interface ApiError {
  Code: string;
  Message: string;
  Details?: Record<string, string[]>;
  TraceId?: string;
}

/**
 * Standardized API response wrapper
 */
export interface ApiResponse<T> {
  Success: boolean;
  Data?: T;
  Error?: ApiError;
}

/**
 * HTTP status codes for common scenarios
 */
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

/**
 * Error codes for common scenarios
 */
export enum ErrorCode {
  // Authentication errors
  INVALID_CREDENTIALS = 'AUTH001',
  TOKEN_EXPIRED = 'AUTH002',
  TOKEN_INVALID = 'AUTH003',
  UNAUTHORIZED = 'AUTH004',
  
  // Validation errors
  VALIDATION_FAILED = 'VAL001',
  REQUIRED_FIELD_MISSING = 'VAL002',
  INVALID_FORMAT = 'VAL003',
  
  // Business logic errors
  RESOURCE_NOT_FOUND = 'BUS001',
  DUPLICATE_RESOURCE = 'BUS002',
  OPERATION_NOT_ALLOWED = 'BUS003',
  
  // Server errors
  INTERNAL_ERROR = 'SRV001',
  DATABASE_ERROR = 'SRV002',
  EXTERNAL_SERVICE_ERROR = 'SRV003',
  
  // Network errors
  NETWORK_ERROR = 'NET001',
  TIMEOUT = 'NET002',
  CONNECTION_REFUSED = 'NET003',
}

/**
 * Retry configuration for API calls
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableStatuses: number[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableStatuses: [502, 503, 504],
};