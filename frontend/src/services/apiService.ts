import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

import { env } from '../config/environment';
import { ApiError, ApiResponse } from '../types/api';
import { normalizeError } from '../utils/errorNormalizer';
import { addRetryInterceptor } from '../utils/retryHelper';
import { secureStorage } from '../utils/secureStorage';

/**
 * Enhanced API Service with standardized error handling and retry logic
 * Implements CLAUDE.md requirements for API error handling, authentication, and performance
 * Provides HTTP methods with automatic token management and error normalization
 * 
 * Features:
 * - Automatic authentication token injection
 * - Standardized error handling and normalization  
 * - Automatic retry logic for server errors (5xx)
 * - Request tracing with unique IDs
 * - Prepared for httpOnly cookie migration
 * - Built-in timeout and monitoring
 * 
 * @example
 * ```typescript
 * // GET request with automatic auth
 * const users = await apiService.get<User[]>('/users');
 * 
 * // POST request with data
 * const newUser = await apiService.post<User>('/users', userData);
 * 
 * // Error handling
 * try {
 *   await apiService.delete('/users/123');
 * } catch (error) {
 *   if (apiService.isApiError(error)) {
 *     console.log('API Error:', error.Code, error.Message);
 *   }
 * }
 * ```
 */
class ApiService {
  private _client: AxiosInstance;
  
  get client(): AxiosInstance {
    return this._client;
  }
  
  // Token storage abstraction (prepared for httpOnly cookie migration)
  private tokenStorage = {
    get: () => secureStorage.getToken(),
    set: (token: string) => secureStorage.setToken(token),
    remove: () => secureStorage.removeToken(),
  };

  constructor() {
    this._client = axios.create({
      baseURL: env.api.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: env.api.timeout,
      withCredentials: true, // Enable cookies for future httpOnly implementation
    });

    this.setupInterceptors();
    
    // Add retry logic for 5xx errors
    addRetryInterceptor(this._client);
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this._client.interceptors.request.use(
      (config) => {
        const token = this.tokenStorage.get();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add request ID for tracing
        config.headers['X-Request-ID'] = this.generateRequestId();
        
        return config;
      },
      (error) => {
        return Promise.reject(normalizeError(error));
      }
    );

    // Response interceptor to handle errors
    this._client.interceptors.response.use(
      (response: AxiosResponse) => {
        // If response is already in ApiResponse format, return as is
        if (this.isApiResponse(response.data)) {
          if (!response.data.Success && response.data.Error) {
            return Promise.reject(response.data.Error);
          }
        }
        return response;
      },
      (error: AxiosError) => {
        const normalizedError = this.handleApiError(error);
        
        // Log to monitoring service (placeholder for Sentry/etc)
        this.logErrorToMonitoring(normalizedError, error);
        
        return Promise.reject(normalizedError);
      }
    );
  }

  private handleApiError(error: AxiosError): ApiError {
    const normalizedError = normalizeError(error);
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Don't trigger unauthorized handling for logout requests (prevents infinite loop)
      const isLogoutRequest = error.config?.url?.includes('/auth/logout');
      if (!isLogoutRequest) {
        this.handleUnauthorized();
      }
    }
    
    // Handle server errors (5xx)
    if (error.response?.status && error.response.status >= 500) {
      // These will be retried automatically by retry interceptor
      console.error('Server error:', normalizedError);
    }
    
    return normalizedError;
  }
  
  private handleUnauthorized() {
    // Clear token
    this.tokenStorage.remove();
    
    // Dispatch event for auth context to handle
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    
    // Don't use window.location.href, let router handle it
    // The auth context should listen to this event and navigate
  }
  
  private logErrorToMonitoring(error: ApiError, originalError: AxiosError) {
    // Placeholder for Sentry or other monitoring service
    if (env.app.isProduction) {
      // TODO: Integrate with monitoring service
      console.error('API Error:', {
        error,
        request: originalError.config,
        response: originalError.response,
      });
    }
  }
  
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private isApiResponse(data: unknown): data is ApiResponse<unknown> {
    return (
      typeof data === 'object' &&
      data !== null &&
      'Success' in data &&
      typeof (data as ApiResponse<unknown>).Success === 'boolean'
    );
  }

  // Generic methods with enhanced error handling
  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    try {
      const response = await this._client.get<T>(url, { params });
      return response.data;
    } catch (error) {
      throw this.isApiError(error) ? error : normalizeError(error);
    }
  }

  async post<T, D = unknown>(url: string, data?: D): Promise<T> {
    try {
      const response = await this._client.post<T>(url, data);
      return response.data;
    } catch (error) {
      throw this.isApiError(error) ? error : normalizeError(error);
    }
  }

  async put<T, D = unknown>(url: string, data?: D): Promise<T> {
    try {
      const response = await this._client.put<T>(url, data);
      return response.data;
    } catch (error) {
      throw this.isApiError(error) ? error : normalizeError(error);
    }
  }

  async patch<T, D = unknown>(url: string, data?: D): Promise<T> {
    try {
      const response = await this._client.patch<T>(url, data);
      return response.data;
    } catch (error) {
      throw this.isApiError(error) ? error : normalizeError(error);
    }
  }

  async delete<T>(url: string): Promise<T> {
    try {
      const response = await this._client.delete<T>(url);
      return response.data;
    } catch (error) {
      throw this.isApiError(error) ? error : normalizeError(error);
    }
  }
  
  private isApiError(error: unknown): error is ApiError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'Code' in error &&
      'Message' in error
    );
  }

  // Auth methods (prepared for httpOnly cookie migration)
  setToken(token: string) {
    this.tokenStorage.set(token);
    // TODO: When migrating to httpOnly cookies, this will be handled by backend
  }

  getToken(): string | null {
    return this.tokenStorage.get();
    // TODO: When using httpOnly cookies, this will check cookie existence differently
  }

  removeToken() {
    this.tokenStorage.remove();
    // TODO: When migrating to httpOnly cookies, call logout endpoint
  }

  isAuthenticated(): boolean {
    return secureStorage.isAuthenticated();
    // TODO: When using httpOnly cookies, check via API call or cookie flag
  }
}

export const apiService = new ApiService();
export default apiService;