import { apiService } from './api';
import { LoginRequest, LoginResponse, UserProfileResponse } from '../types';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiService.post<LoginResponse>('/auth/authenticate', credentials);
    
    if (response.Token) {
      apiService.setToken(response.Token);
    }
    
    return response;
  },

  async logout(): Promise<void> {
    try {
      await apiService.post('/auth/logout');
    } finally {
      apiService.removeToken();
    }
  },

  async refreshToken(username: string, refreshToken: string): Promise<LoginResponse> {
    const response = await apiService.post<LoginResponse>('/auth/refresh-token', {
      Username: username,
      RefreshToken: refreshToken,
    });
    
    if (response.Token) {
      apiService.setToken(response.Token);
    }
    
    return response;
  },

  async validateToken(): Promise<{ isValid: boolean; username: string; message: string }> {
    return apiService.get('/auth/validate');
  },

  async getUserProfile(): Promise<UserProfileResponse> {
    return apiService.get('/user/profile');
  },

  async updateProfile(data: {
    FirstName?: string;
    LastName?: string;
    PhoneNumber?: string;
  }): Promise<UserProfileResponse> {
    return apiService.put('/user/profile', data);
  },

  async changePassword(data: {
    CurrentPassword: string;
    NewPassword: string;
    ConfirmNewPassword: string;
  }): Promise<void> {
    return apiService.post('/user/change-password', data);
  },

  async changeEmail(data: {
    NewEmail: string;
    CurrentPassword: string;
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