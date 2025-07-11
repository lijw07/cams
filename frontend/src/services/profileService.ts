import { apiService } from './api';
import { User, UserProfileResponse } from '../types';

export interface UserProfileUpdateRequest {
  FirstName?: string | null;
  LastName?: string | null;
  PhoneNumber?: string | null;
}

export interface ChangePasswordRequest {
  CurrentPassword: string;
  NewPassword: string;
  ConfirmNewPassword: string;
}

export interface ChangeEmailRequest {
  CurrentPassword: string;
  NewEmail: string;
}

export interface ValidatePasswordRequest {
  Password: string;
}

export interface DeactivateAccountRequest {
  CurrentPassword: string;
}

export const profileService = {
  // Get user profile
  async getProfile(): Promise<UserProfileResponse> {
    return apiService.get('/user/profile');
  },

  // Get profile summary
  async getProfileSummary(): Promise<UserProfileResponse> {
    return apiService.get('/user/profile/summary');
  },

  // Update user profile
  async updateProfile(data: UserProfileUpdateRequest): Promise<User> {
    return apiService.put('/user/profile', data);
  },

  // Change password
  async changePassword(data: ChangePasswordRequest): Promise<{ success: boolean; message: string }> {
    console.log('ProfileService - Sending password change request:', {
      CurrentPassword: data.CurrentPassword ? '[REDACTED]' : undefined,
      NewPassword: data.NewPassword ? '[REDACTED]' : undefined,
      ConfirmNewPassword: data.ConfirmNewPassword ? '[REDACTED]' : undefined
    });
    return apiService.post('/user/change-password', data);
  },

  // Change email
  async changeEmail(data: ChangeEmailRequest): Promise<{ success: boolean; message: string }> {
    return apiService.post('/user/change-email', data);
  },

  // Validate current password
  async validatePassword(data: ValidatePasswordRequest): Promise<{ isValid: boolean; message: string }> {
    return apiService.post('/user/validate-password', data);
  },

  // Check email availability
  async checkEmailAvailability(email: string): Promise<{ email: string; isAvailable: boolean; message: string }> {
    return apiService.get(`/user/check-email/${encodeURIComponent(email)}`);
  },

  // Deactivate account
  async deactivateAccount(data: DeactivateAccountRequest): Promise<{ message: string }> {
    return apiService.post('/user/deactivate', data);
  }
};