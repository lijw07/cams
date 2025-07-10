import { useCallback, useEffect } from 'react';
import { analyticsService } from '../services/analyticsService';
import { 
  CustomEvent, 
  UserEvent, 
  PageViewEvent 
} from '../types/analytics';
import { DEFAULT_CONFIG } from '../constants/AnalyticsConstants';

export const useAnalytics = () => {
  // Initialize analytics on mount
  useEffect(() => {
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    
    if (measurementId) {
      analyticsService.initialize({
        measurementId,
        enabled: DEFAULT_CONFIG.ENABLED,
        debug: DEFAULT_CONFIG.DEBUG,
      });
    } else if (DEFAULT_CONFIG.DEBUG) {
      console.warn('Google Analytics measurement ID not found in environment variables');
    }
  }, []);

  const trackEvent = useCallback((event: CustomEvent) => {
    analyticsService.trackEvent(event);
  }, []);

  const trackPageView = useCallback((event: PageViewEvent) => {
    analyticsService.trackPageView(event);
  }, []);

  const trackUser = useCallback((event: UserEvent) => {
    analyticsService.trackUser(event);
  }, []);

  const setUserProperties = useCallback((properties: Record<string, any>) => {
    analyticsService.setUserProperties(properties);
  }, []);

  const optOut = useCallback(() => {
    analyticsService.optOut();
  }, []);

  const optIn = useCallback(() => {
    analyticsService.optIn();
  }, []);

  const isInitialized = useCallback(() => {
    return analyticsService.isInitialized();
  }, []);

  return {
    trackEvent,
    trackPageView,
    trackUser,
    setUserProperties,
    optOut,
    optIn,
    isInitialized,
  };
};