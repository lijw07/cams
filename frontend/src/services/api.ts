import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiService {
  private client: AxiosInstance;
  private tokenStorage = {
    get: () => localStorage.getItem('auth_token'),
    set: (token: string) => localStorage.setItem('auth_token', token),
    remove: () => localStorage.removeItem('auth_token'),
  };

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
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
    this.client.interceptors.response.use(
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
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      this.tokenStorage.remove();
      window.location.href = '/login';
      return;
    }

    if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action');
      return;
    }

    if (error.response?.status >= 500) {
      toast.error('Server error occurred. Please try again later.');
      return;
    }

    // For other errors, let the component handle them
  }

  // Generic methods
  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.patch<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
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

export const apiService = new ApiService();
export default apiService;