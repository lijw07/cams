import { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { DEFAULT_RETRY_CONFIG, RetryConfig } from '../types/api';

/**
 * Implements exponential backoff with jitter for retry delays
 * Uses exponential growth with random jitter to prevent thundering herd effects
 * 
 * @param attempt - Current retry attempt number (1-based)
 * @param config - Retry configuration with delay settings
 * @returns Calculated delay in milliseconds with jitter applied
 * 
 * @example
 * ```typescript
 * const delay = calculateDelay(2, DEFAULT_RETRY_CONFIG);
 * // Returns something like 2000-2200ms for second attempt
 * ```
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = Math.min(
    config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1),
    config.maxDelay
  );
  
  // Add jitter to prevent thundering herd
  const jitter = exponentialDelay * 0.1 * Math.random();
  return Math.floor(exponentialDelay + jitter);
}

/**
 * Determines if an error should trigger a retry attempt
 * Network errors are always retryable, HTTP errors depend on status code
 * 
 * @param error - Axios error to evaluate for retry eligibility
 * @param config - Retry configuration with retryable status codes
 * @returns True if the error should trigger a retry, false otherwise
 * 
 * @example
 * ```typescript
 * const shouldRetry = shouldRetry(axiosError, DEFAULT_RETRY_CONFIG);
 * // Returns true for 5xx errors, false for 4xx errors
 * ```
 */
function shouldRetry(error: AxiosError, config: RetryConfig): boolean {
  // Don't retry if we've exhausted attempts
  if (!error.response) {
    // Network errors should be retried
    return true;
  }
  
  // Check if status is in retryable list
  return config.retryableStatuses.includes(error.response.status);
}

/**
 * Sleep helper function for implementing delays
 * Creates a promise that resolves after specified milliseconds
 * 
 * @param ms - Number of milliseconds to wait
 * @returns Promise that resolves after the delay
 * 
 * @example
 * ```typescript
 * await sleep(1000); // Wait 1 second
 * console.log('This runs after 1 second');
 * ```
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Adds automatic retry logic to an Axios instance using response interceptors
 * Automatically retries failed requests for network errors and 5xx server errors
 * Uses exponential backoff with jitter to prevent overwhelming the server
 * 
 * @param axiosInstance - Axios instance to add retry logic to
 * @param retryConfig - Configuration for retry behavior (optional, uses defaults)
 * 
 * @example
 * ```typescript
 * const api = axios.create({ baseURL: 'https://api.example.com' });
 * addRetryInterceptor(api, {
 *   maxRetries: 3,
 *   initialDelay: 1000,
 *   retryableStatuses: [500, 502, 503, 504]
 * });
 * 
 * // Now all requests through this instance will auto-retry on failure
 * const response = await api.get('/data');
 * ```
 */
export function addRetryInterceptor(
  axiosInstance: AxiosInstance,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): void {
  axiosInstance.interceptors.response.use(
    response => response,
    async error => {
      const config = error.config as AxiosRequestConfig & { _retry?: number };
      
      // Initialize retry count
      if (!config._retry) {
        config._retry = 0;
      }
      
      // Check if we should retry
      if (
        config._retry >= retryConfig.maxRetries ||
        !shouldRetry(error, retryConfig)
      ) {
        return Promise.reject(error);
      }
      
      // Increment retry count
      config._retry += 1;
      
      // Calculate delay
      const delay = calculateDelay(config._retry, retryConfig);
      
      // Log retry attempt
      console.log(
        `Retrying request to ${config.url} (attempt ${config._retry}/${retryConfig.maxRetries}) after ${delay}ms`
      );
      
      // Wait before retrying
      await sleep(delay);
      
      // Retry the request
      return axiosInstance.request(config);
    }
  );
}

/**
 * Manual retry helper for specific API calls with exponential backoff
 * Executes a function with automatic retry logic on failure
 * Useful for one-off API calls that need retry logic without interceptors
 * 
 * @template T - Return type of the function being retried
 * @param fn - Async function to execute with retry logic
 * @param config - Retry configuration (optional, uses defaults)
 * @returns Promise resolving to the function's result
 * @throws {Error} The last error encountered if all retries fail
 * 
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   () => fetch('/api/critical-data').then(r => r.json()),
 *   { maxRetries: 5, initialDelay: 2000 }
 * );
 * console.log('Data retrieved:', result);
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on the last attempt
      if (attempt > config.maxRetries) {
        break;
      }
      
      // Check if error is retryable
      if (isAxiosError(error) && !shouldRetry(error, config)) {
        throw error;
      }
      
      // Calculate and apply delay
      const delay = calculateDelay(attempt, config);
      console.log(
        `Retry attempt ${attempt}/${config.maxRetries} after ${delay}ms`
      );
      await sleep(delay);
    }
  }
  
  throw lastError!;
}

/**
 * Type guard function to check if an error is an AxiosError
 * Safely narrows unknown error types to AxiosError for proper handling
 * 
 * @param error - Unknown error object to check
 * @returns True if error is an AxiosError, false otherwise
 * 
 * @example
 * ```typescript
 * try {
 *   await apiCall();
 * } catch (error) {
 *   if (isAxiosError(error)) {
 *     console.log('HTTP Status:', error.response?.status);
 *   }
 * }
 * ```
 */
function isAxiosError(error: unknown): error is AxiosError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as AxiosError).isAxiosError === true
  );
}