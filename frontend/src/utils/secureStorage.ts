import { AUTH_STORAGE_STRATEGY } from '../config/security';

/**
 * Secure storage utility for handling authentication tokens
 * Provides abstraction layer for storage migration from localStorage to httpOnly cookies
 */
export class SecureStorage {
  private static instance: SecureStorage;

  private constructor() {}

  static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }

  /**
   * Get authentication token
   * @returns Token string or null if not found
   */
  getToken(): string | null {
    if (AUTH_STORAGE_STRATEGY.current === 'localStorage') {
      return localStorage.getItem('auth_token');
    }
    // When migrated to httpOnly cookies, this will return null
    // and token will be sent automatically with requests
    return null;
  }

  /**
   * Set authentication token
   * @param token - Token to store
   */
  setToken(token: string): void {
    if (AUTH_STORAGE_STRATEGY.current === 'localStorage') {
      localStorage.setItem('auth_token', token);
    }
    // When migrated to httpOnly cookies, this will be handled by backend
  }

  /**
   * Remove authentication token
   */
  removeToken(): void {
    if (AUTH_STORAGE_STRATEGY.current === 'localStorage') {
      localStorage.removeItem('auth_token');
    }
    // When migrated to httpOnly cookies, this will be handled by backend logout
  }

  /**
   * Check if user is authenticated
   * @returns True if token exists
   */
  isAuthenticated(): boolean {
    if (AUTH_STORAGE_STRATEGY.current === 'localStorage') {
      return !!this.getToken();
    }
    // When migrated to httpOnly cookies, this will need to check auth state differently
    return false;
  }

  /**
   * Clear all auth-related storage
   */
  clearAuthStorage(): void {
    if (AUTH_STORAGE_STRATEGY.current === 'localStorage') {
      // Clear all auth-related items
      const keysToRemove = ['auth_token', 'user_profile', 'refresh_token'];
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
    // When migrated to httpOnly cookies, this will be handled by backend
  }

  /**
   * Store non-sensitive user data
   * @param key - Storage key
   * @param value - Value to store
   */
  setUserData(key: string, value: unknown): void {
    try {
      localStorage.setItem(`user_${key}`, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to store user data:', error);
    }
  }

  /**
   * Retrieve non-sensitive user data
   * @param key - Storage key
   * @returns Parsed value or null
   */
  getUserData<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(`user_${key}`);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Failed to retrieve user data:', error);
      return null;
    }
  }

  /**
   * Remove non-sensitive user data
   * @param key - Storage key
   */
  removeUserData(key: string): void {
    localStorage.removeItem(`user_${key}`);
  }

  /**
   * Clear all user data
   */
  clearUserData(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('user_')) {
        localStorage.removeItem(key);
      }
    });
  }
}

// Export singleton instance
export const secureStorage = SecureStorage.getInstance();