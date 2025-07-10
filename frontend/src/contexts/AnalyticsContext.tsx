import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useAnalytics } from '../hooks/useAnalytics';
import { CUSTOM_DIMENSIONS } from '../constants/AnalyticsConstants';

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
        user_id: user.id.toString(),
        user_role: user.roles?.[0] || 'user',
      });

      // Set custom dimensions
      setUserProperties({
        [CUSTOM_DIMENSIONS.USER_ROLE]: user.roles?.[0] || 'user',
        [CUSTOM_DIMENSIONS.USER_PERMISSIONS]: user.roles?.join(',') || '',
        [CUSTOM_DIMENSIONS.ENVIRONMENT]: import.meta.env.MODE,
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