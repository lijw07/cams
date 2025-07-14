import { components } from '../types/api.generated';
import { LoginResponse, UserProfileResponse } from '../types';
import { secureStorage } from '../utils/secureStorage';

import { apiService } from './api';

// Type aliases for cleaner code
type LoginRequest = components['schemas']['LoginRequest'];
type RefreshTokenRequest = components['schemas']['RefreshTokenRequest'];
type ChangePasswordRequest = components['schemas']['ChangePasswordRequest'];
type ChangeEmailRequest = components['schemas']['ChangeEmailRequest'];
type UserProfileRequest = components['schemas']['UserProfileRequest'];

/**
 * Authentication service for managing user authentication and profile operations
 * Provides methods for login, logout, token management, and user profile updates
 * 
 * @example
 * ```typescript
 * // Login user
 * const response = await authService.login({ Username: 'user', Password: 'pass' });
 * 
 * // Check authentication status
 * if (authService.isAuthenticated()) {
 *   const profile = await authService.getUserProfile();
 * }
 * ```
 */
export const authService = {
  /**
   * Authenticates a user with the provided credentials
   * Stores the authentication token securely and caches user profile data
   * 
   * @param credentials - User login credentials containing username and password
   * @returns Promise resolving to login response with token and user data
   * @throws {ApiError} When authentication fails or credentials are invalid
   * 
   * @example
   * ```typescript
   * try {
   *   const response = await authService.login({
   *     Username: 'john.doe@example.com',
   *     Password: 'securePassword123'
   *   });
   *   console.log('Login successful:', response.User);
   * } catch (error) {
   *   console.error('Login failed:', error.message);
   * }
   * ```
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiService.post<LoginResponse>('/auth/authenticate', credentials);
    
    if (response.Token) {
      secureStorage.setToken(response.Token);
      // Store user info for session management
      if (response.User) {
        secureStorage.setUserData('profile', response.User);
      }
    }
    
    return response;
  },

  /**
   * Logs out the current user by invalidating the session on the server
   * Clears all stored authentication data and user information from secure storage
   * 
   * @returns Promise that resolves when logout is complete
   * @throws {ApiError} When server logout request fails (local cleanup still occurs)
   * 
   * @example
   * ```typescript
   * try {
   *   await authService.logout();
   *   console.log('User logged out successfully');
   * } catch (error) {
   *   console.error('Logout request failed, but local session cleared');
   * }
   * ```
   */
  async logout(): Promise<void> {
    try {
      // Only call logout endpoint if we have a token
      const token = secureStorage.getToken();
      if (token) {
        await apiService.post('/auth/logout');
      }
    } catch (error) {
      // Log error but don't throw - we still want to clear local storage
      console.warn('Logout API call failed:', error);
    } finally {
      secureStorage.clearAuthStorage();
      secureStorage.clearUserData();
    }
  },

  /**
   * Refreshes an expired authentication token using a refresh token
   * Updates stored authentication data with new token and user information
   * 
   * @param username - Username for the token refresh request
   * @param refreshToken - Valid refresh token for generating new access token
   * @returns Promise resolving to new login response with updated token
   * @throws {ApiError} When refresh token is invalid or expired
   * 
   * @example
   * ```typescript
   * try {
   *   const response = await authService.refreshToken('user@example.com', 'refresh_token_here');
   *   console.log('Token refreshed successfully');
   * } catch (error) {
   *   console.error('Token refresh failed, user needs to re-login');
   * }
   * ```
   */
  async refreshToken(username: string, refreshToken: string): Promise<LoginResponse> {
    const request: RefreshTokenRequest = {
      Username: username,
      RefreshToken: refreshToken,
    };
    
    const response = await apiService.post<LoginResponse>('/auth/refresh-token', request);
    
    if (response.Token) {
      secureStorage.setToken(response.Token);
      // Update user info if provided
      if (response.User) {
        secureStorage.setUserData('profile', response.User);
      }
    }
    
    return response;
  },

  /**
   * Validates the current authentication token with the server
   * Checks if the stored token is still valid and not expired
   * 
   * @returns Promise resolving to validation result with status and user info
   * @throws {ApiError} When token validation request fails
   * 
   * @example
   * ```typescript
   * const validation = await authService.validateToken();
   * if (validation.isValid) {
   *   console.log('Token is valid for user:', validation.username);
   * } else {
   *   console.log('Token is invalid:', validation.message);
   * }
   * ```
   */
  async validateToken(): Promise<{ isValid: boolean; username: string; message: string }> {
    return apiService.get('/auth/validate');
  },

  /**
   * Retrieves the current user's profile information from the server
   * Returns comprehensive user data including roles, permissions, and settings
   * 
   * @returns Promise resolving to complete user profile data
   * @throws {ApiError} When user is not authenticated or profile fetch fails
   * 
   * @example
   * ```typescript
   * if (authService.isAuthenticated()) {
   *   const profile = await authService.getUserProfile();
   *   console.log('User:', profile.FirstName, profile.LastName);
   *   console.log('Roles:', profile.Roles);
   * }
   * ```
   */
  async getUserProfile(): Promise<UserProfileResponse> {
    return apiService.get('/user/profile');
  },

  /**
   * Updates the current user's profile information
   * Allows partial updates of user data fields
   * 
   * @param data - Object containing profile fields to update (all optional)
   * @param data.FirstName - User's first name
   * @param data.LastName - User's last name  
   * @param data.PhoneNumber - User's phone number
   * @returns Promise resolving to updated user profile
   * @throws {ApiError} When update fails due to validation or authorization
   * 
   * @example
   * ```typescript
   * const updatedProfile = await authService.updateProfile({
   *   FirstName: 'John',
   *   PhoneNumber: '+1-555-123-4567'
   * });
   * console.log('Profile updated:', updatedProfile);
   * ```
   */
  async updateProfile(data: UserProfileRequest): Promise<UserProfileResponse> {
    return apiService.put('/user/profile', data);
  },

  /**
   * Changes the current user's password with validation
   * Requires current password for security verification
   * 
   * @param data - Password change request data
   * @param data.CurrentPassword - User's current password for verification
   * @param data.NewPassword - New password to set (must meet security requirements)
   * @param data.ConfirmNewPassword - Confirmation of new password (must match NewPassword)
   * @returns Promise that resolves when password is successfully changed
   * @throws {ApiError} When current password is wrong or new password fails validation
   * 
   * @example
   * ```typescript
   * await authService.changePassword({
   *   CurrentPassword: 'oldPassword123',
   *   NewPassword: 'newSecurePassword456!',
   *   ConfirmNewPassword: 'newSecurePassword456!'
   * });
   * console.log('Password changed successfully');
   * ```
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    return apiService.post('/user/change-password', data);
  },

  /**
   * Changes the current user's email address with password verification
   * Requires current password for security verification
   * 
   * @param data - Email change request data
   * @param data.NewEmail - New email address to set (must be unique)
   * @param data.CurrentPassword - User's current password for verification
   * @returns Promise that resolves when email is successfully changed
   * @throws {ApiError} When password is wrong, email is taken, or email format is invalid
   * 
   * @example
   * ```typescript
   * await authService.changeEmail({
   *   NewEmail: 'newemail@example.com',
   *   CurrentPassword: 'currentPassword123'
   * });
   * console.log('Email changed successfully');
   * ```
   */
  async changeEmail(data: ChangeEmailRequest): Promise<void> {
    return apiService.post('/user/change-email', data);
  },

  /**
   * Checks if an email address is available for registration or account changes
   * Validates email format and checks for existing accounts
   * 
   * @param email - Email address to check for availability
   * @returns Promise resolving to availability status and descriptive message
   * @throws {ApiError} When email format is invalid or check request fails
   * 
   * @example
   * ```typescript
   * const result = await authService.checkEmailAvailability('test@example.com');
   * if (result.isAvailable) {
   *   console.log('Email is available for use');
   * } else {
   *   console.log('Email not available:', result.message);
   * }
   * ```
   */
  async checkEmailAvailability(email: string): Promise<{ isAvailable: boolean; message: string }> {
    return apiService.get(`/user/check-email/${encodeURIComponent(email)}`);
  },

  /**
   * Checks if the current user is authenticated
   * Verifies that a valid authentication token exists in secure storage
   * 
   * @returns True if user has valid authentication token, false otherwise
   * 
   * @example
   * ```typescript
   * if (authService.isAuthenticated()) {
   *   // User is logged in, can access protected resources
   *   const profile = await authService.getUserProfile();
   * } else {
   *   // User needs to log in
   *   window.location.href = '/login';
   * }
   * ```
   */
  isAuthenticated(): boolean {
    return secureStorage.isAuthenticated();
  },
};