import type { components } from '../types/api.generated';
import type { User, UserProfileResponse } from '../types/auth';

import { apiService } from './api';

// Type aliases for cleaner code
type UserProfileRequest = components['schemas']['UserProfileRequest'];
type ChangePasswordRequest = components['schemas']['ChangePasswordRequest'];
type ChangeEmailRequest = components['schemas']['ChangeEmailRequest'];
type ValidatePasswordRequest = components['schemas']['ValidatePasswordRequest'];
type DeactivateAccountRequest = components['schemas']['DeactivateAccountRequest'];

// Re-export types for component usage
export type {
  UserProfileRequest,
  UserProfileRequest as UserProfileUpdateRequest, // Alias for backwards compatibility
  ChangePasswordRequest,
  ChangeEmailRequest,
  ValidatePasswordRequest,
  DeactivateAccountRequest
};

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
  async updateProfile(data: UserProfileRequest): Promise<User> {
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