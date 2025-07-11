// Re-export from new apiService for backward compatibility
// Legacy implementation (deprecated - will be removed)
import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

import { env } from '../config/environment';

export { apiService as default, apiService } from './apiService';

const API_BASE_URL = env.api.baseUrl;

class LegacyApiService {
  private _client: AxiosInstance;
  
  get client(): AxiosInstance {
    return this._client;
  }
  private tokenStorage = {
    get: () => localStorage.getItem('auth_token'),
    set: (token: string) => localStorage.setItem('auth_token', token),
    remove: () => localStorage.removeItem('auth_token'),
  };

  constructor() {
    this._client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this._client.interceptors.request.use(
      (config) => {
        const token = this.tokenStorage.get();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this._client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error: AxiosError) => {
        this.handleApiError(error);
        return Promise.reject(error);
      }
    );
  }

  private handleApiError(error: AxiosError) {
    // Log detailed error information for debugging
    if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    }
    
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      this.tokenStorage.remove();
      window.location.href = '/login';
      return;
    }

    if (error.response?.status === 403) {
      console.error('Permission denied: You do not have permission to perform this action');
      return;
    }

    if (error.response?.status && error.response.status >= 500) {
      console.error('Server error occurred. Please try again later.');
      return;
    }

    // For other errors, let the component handle them
  }

  // Generic methods
  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const response = await this._client.get<T>(url, { params });
    return response.data;
  }

  async post<T, D = unknown>(url: string, data?: D): Promise<T> {
    if (url.includes('change-password')) {
      console.log('API POST to', url, 'with data:', data);
    }
    const response = await this._client.post<T>(url, data);
    return response.data;
  }

  async put<T, D = unknown>(url: string, data?: D): Promise<T> {
    const response = await this._client.put<T>(url, data);
    return response.data;
  }

  async patch<T, D = unknown>(url: string, data?: D): Promise<T> {
    const response = await this._client.patch<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this._client.delete<T>(url);
    return response.data;
  }

  // Auth methods
  setToken(token: string) {
    this.tokenStorage.set(token);
  }

  getToken(): string | null {
    return this.tokenStorage.get();
  }

  removeToken() {
    this.tokenStorage.remove();
  }

  isAuthenticated(): boolean {
    return !!this.tokenStorage.get();
  }
}

// Legacy export (deprecated)
export const legacyApiService = new LegacyApiService();