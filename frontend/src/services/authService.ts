import { apiService } from './api';
import { LoginRequest, LoginResponse, UserProfileResponse } from '../types';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiService.post<LoginResponse>('/login/authenticate', credentials);
    
    if (response.token) {
      apiService.setToken(response.token);
    }
    
    return response;
  },

  async logout(): Promise<void> {
    try {
      await apiService.post('/login/logout');
    } finally {
      apiService.removeToken();
    }
  },

  async refreshToken(username: string, refreshToken: string): Promise<LoginResponse> {
    const response = await apiService.post<LoginResponse>('/login/refresh-token', {
      username,
      refreshToken,
    });
    
    if (response.token) {
      apiService.setToken(response.token);
    }
    
    return response;
  },

  async validateToken(): Promise<{ isValid: boolean; username: string; message: string }> {
    return apiService.get('/login/validate');
  },

  async getUserProfile(): Promise<UserProfileResponse> {
    return apiService.get('/user/profile');
  },

  async updateProfile(data: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  }): Promise<UserProfileResponse> {
    return apiService.put('/user/profile', data);
  },

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }): Promise<void> {
    return apiService.post('/user/change-password', data);
  },

  async changeEmail(data: {
    newEmail: string;
    password: string;
  }): Promise<void> {
    return apiService.post('/user/change-email', data);
  },

  async checkEmailAvailability(email: string): Promise<{ isAvailable: boolean; message: string }> {
    return apiService.get(`/user/check-email/${encodeURIComponent(email)}`);
  },

  isAuthenticated(): boolean {
    return apiService.isAuthenticated();
  },
};