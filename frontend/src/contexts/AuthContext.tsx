import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';

import { SESSION_CONFIG } from '../config/security';
import { authService } from '../services/authService';
import { UserProfileResponse } from '../types';

import { useNotifications } from './NotificationContext';

interface AuthContextType {
  user: UserProfileResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  }) => Promise<void>;
  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }) => Promise<void>;
  changeEmail: (data: {
    newEmail: string;
    password: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addNotification } = useNotifications();
  const sessionTimeoutRef = useRef<number | null>(null);
  const sessionWarningRef = useRef<number | null>(null);
  const tokenRefreshRef = useRef<number | null>(null);

  const isAuthenticated = !!user && authService.isAuthenticated();

  // Clear all session timers
  const clearSessionTimers = useCallback(() => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }
    if (sessionWarningRef.current) {
      clearTimeout(sessionWarningRef.current);
      sessionWarningRef.current = null;
    }
    if (tokenRefreshRef.current) {
      clearInterval(tokenRefreshRef.current);
      tokenRefreshRef.current = null;
    }
  }, []);

  // Setup session management
  const setupSessionManagement = useCallback(() => {
    clearSessionTimers();

    // Session timeout warning
    sessionWarningRef.current = setTimeout(() => {
      addNotification({
        title: 'Session Expiring',
        message: 'Your session will expire in 5 minutes. Please save your work.',
        type: 'warning',
        source: 'Authentication'
      });
    }, SESSION_CONFIG.timeout - SESSION_CONFIG.warningTime);

    // Session timeout
    sessionTimeoutRef.current = setTimeout(() => {
      addNotification({
        title: 'Session Expired',
        message: 'Your session has expired. Please log in again.',
        type: 'error',
        source: 'Authentication'
      });
      // Trigger logout through event to avoid circular dependency
      window.dispatchEvent(new Event('auth:unauthorized'));
    }, SESSION_CONFIG.timeout);

    // Token refresh interval
    tokenRefreshRef.current = setInterval(async () => {
      try {
        // TODO: Implement token refresh when backend supports it
        // await authService.refreshToken();
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    }, SESSION_CONFIG.refreshInterval);
  }, [addNotification, clearSessionTimers]);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          // Validate token and get user profile
          const validation = await authService.validateToken();
          if (validation.isValid) {
            const userProfile = await authService.getUserProfile();
            setUser(userProfile);
            setupSessionManagement();
          } else {
            // Invalid token, clear it
            authService.logout();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear invalid auth state
        authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [setupSessionManagement]);

  // Listen for unauthorized events
  useEffect(() => {
    const handleUnauthorized = async () => {
      clearSessionTimers();
      setUser(null);
      authService.logout(); // Clear token
      // Only show notification if not from session timeout (which already shows its own)
      if (!window.event || window.event.type !== 'auth:unauthorized') {
        addNotification({
          title: 'Authentication Required',
          message: 'Please log in to continue.',
          type: 'error',
          source: 'Authentication'
        });
      }
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      clearSessionTimers();
    };
  }, [addNotification, clearSessionTimers]);

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authService.login({ Username: username, Password: password });
      
      if (response.Token) {
        // Get user profile after successful login
        const userProfile = await authService.getUserProfile();
        setUser(userProfile);
        setupSessionManagement();
        addNotification({
          title: 'Login Successful',
          message: 'Successfully logged in',
          type: 'success',
          source: 'Authentication'
        });
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      const message = error instanceof Error ? error.message : 'Login failed';
      addNotification({
        title: 'Login Failed',
        message: message,
        type: 'error',
        source: 'Authentication'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      clearSessionTimers();
      await authService.logout();
      setUser(null);
      addNotification({
        title: 'Logout Successful',
        message: 'Successfully logged out',
        type: 'success',
        source: 'Authentication'
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if API call fails
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserProfile = async () => {
    try {
      if (!isAuthenticated) return;
      
      const userProfile = await authService.getUserProfile();
      setUser(userProfile);
    } catch (error) {
      console.error('Profile refresh error:', error);
      addNotification({
        title: 'Profile Refresh Failed',
        message: 'Failed to refresh profile',
        type: 'error',
        source: 'Profile'
      });
    }
  };

  const updateProfile = async (data: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  }) => {
    try {
      const updatedProfile = await authService.updateProfile({
        FirstName: data.firstName,
        LastName: data.lastName,
        PhoneNumber: data.phoneNumber
      });
      setUser(updatedProfile);
      addNotification({
        title: 'Profile Updated',
        message: 'Profile updated successfully',
        type: 'success',
        source: 'Profile'
      });
    } catch (error) {
      console.error('Profile update error:', error);
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      addNotification({
        title: 'Profile Update Failed',
        message: message,
        type: 'error',
        source: 'Profile'
      });
      throw error;
    }
  };

  const changePassword = async (data: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }) => {
    try {
      await authService.changePassword({
        CurrentPassword: data.currentPassword,
        NewPassword: data.newPassword,
        ConfirmNewPassword: data.confirmNewPassword
      });
      addNotification({
        title: 'Password Changed',
        message: 'Password changed successfully',
        type: 'success',
        source: 'Profile'
      });
    } catch (error) {
      console.error('Password change error:', error);
      const message = error instanceof Error ? error.message : 'Failed to change password';
      addNotification({
        title: 'Password Change Failed',
        message: message,
        type: 'error',
        source: 'Profile'
      });
      throw error;
    }
  };

  const changeEmail = async (data: {
    newEmail: string;
    password: string;
  }) => {
    try {
      await authService.changeEmail({
        NewEmail: data.newEmail,
        CurrentPassword: data.password
      });
      // Refresh profile to get updated email
      await refreshUserProfile();
      addNotification({
        title: 'Email Changed',
        message: 'Email changed successfully',
        type: 'success',
        source: 'Profile'
      });
    } catch (error) {
      console.error('Email change error:', error);
      const message = error instanceof Error ? error.message : 'Failed to change email';
      addNotification({
        title: 'Email Change Failed',
        message: message,
        type: 'error',
        source: 'Profile'
      });
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshUserProfile,
    updateProfile,
    changePassword,
    changeEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};