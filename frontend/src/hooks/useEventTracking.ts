import { useCallback } from 'react';

import {
  createAuthEvent,
  createApplicationEvent,
  createConnectionEvent,
  createErrorEvent,
  createPerformanceEvent,
  createNavigationEvent,
  sanitizeEventData,
} from '../utils/analyticsHelpers';

import { useAnalytics } from './useAnalytics';

export const useEventTracking = () => {
  const { trackEvent } = useAnalytics();

  const trackAuthentication = useCallback((
    action: 'login' | 'logout' | 'register' | 'login_attempt',
    success?: boolean,
    method?: string
  ) => {
    const event = createAuthEvent(action, success, method);
    trackEvent(event);
  }, [trackEvent]);

  const trackApplication = useCallback((
    action: 'create' | 'update' | 'delete' | 'view',
    applicationId?: string,
    applicationName?: string,
    databaseType?: string
  ) => {
    const event = createApplicationEvent(action, applicationId, applicationName, databaseType);
    trackEvent(event);
  }, [trackEvent]);

  const trackConnection = useCallback((
    action: 'create' | 'test' | 'update' | 'delete',
    success?: boolean,
    databaseType?: string
  ) => {
    const event = createConnectionEvent(action, success, databaseType);
    trackEvent(event);
  }, [trackEvent]);

  const trackError = useCallback((
    errorMessage: string,
    errorCode?: string,
    errorLocation?: string
  ) => {
    const event = createErrorEvent(errorMessage, errorCode, errorLocation);
    trackEvent(event);
  }, [trackEvent]);

  const trackPerformance = useCallback((
    metricName: string,
    value: number,
    componentName?: string
  ) => {
    const event = createPerformanceEvent(metricName, value, componentName);
    trackEvent(event);
  }, [trackEvent]);

  const trackNavigation = useCallback((
    destination: string,
    source?: string
  ) => {
    const event = createNavigationEvent(destination, source);
    trackEvent(event);
  }, [trackEvent]);

  const trackCustomEvent = useCallback((
    eventName: string,
    eventCategory: string,
    eventLabel?: string,
    value?: number,
    customParameters?: Record<string, any>
  ) => {
    const sanitizedParams = customParameters ? sanitizeEventData(customParameters) : undefined;
    
    trackEvent({
      event_name: eventName,
      event_category: eventCategory,
      event_label: eventLabel,
      value,
      custom_parameters: sanitizedParams,
    });
  }, [trackEvent]);

  return {
    trackAuthentication,
    trackApplication,
    trackConnection,
    trackError,
    trackPerformance,
    trackNavigation,
    trackCustomEvent,
  };
};