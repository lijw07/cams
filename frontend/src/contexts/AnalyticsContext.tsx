import React, { createContext, useContext, useEffect, ReactNode } from 'react';

import { env } from '../config/environment';
import { CUSTOM_DIMENSIONS } from '../constants/AnalyticsConstants';
import { useAnalytics } from '../hooks/useAnalytics';

import { useAuth } from './AuthContext';

interface AnalyticsContextType {
  isInitialized: boolean;
  optOut: () => void;
  optIn: () => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

interface AnalyticsProviderProps {
  children: ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { trackUser, setUserProperties, optOut, optIn, isInitialized } = useAnalytics();

  // Track user authentication and set user properties
  useEffect(() => {
    if (!isInitialized()) return;

    if (isAuthenticated && user) {
      // Set user ID and properties
      trackUser({
        user_id: user.Id.toString(),
        user_role: user.Roles?.[0] || 'user',
      });

      // Set custom dimensions
      setUserProperties({
        [CUSTOM_DIMENSIONS.USER_ROLE]: user.Roles?.[0] || 'user',
        [CUSTOM_DIMENSIONS.USER_PERMISSIONS]: user.Roles?.join(',') || '',
        [CUSTOM_DIMENSIONS.ENVIRONMENT]: env.app.environment,
      });
    }
  }, [isAuthenticated, user, trackUser, setUserProperties, isInitialized]);

  const contextValue: AnalyticsContextType = {
    isInitialized: isInitialized(),
    optOut,
    optIn,
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalyticsContext = (): AnalyticsContextType => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  }
  return context;
};