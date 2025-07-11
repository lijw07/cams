import { ANALYTICS_EVENTS, ANALYTICS_CATEGORIES } from '../constants/AnalyticsConstants';
import { PageViewEvent, CustomEvent, ApplicationEvent, AuthEvent, ErrorEvent } from '../types/analytics';

export const createPageViewEvent = (
  title: string, 
  path: string, 
  location: string = window.location.href
): PageViewEvent => ({
  page_title: title,
  page_path: path,
  page_location: location,
});

export const createAuthEvent = (
  eventType: 'login' | 'logout' | 'register' | 'login_attempt',
  success?: boolean,
  method?: string
): AuthEvent => ({
  event_name: ANALYTICS_EVENTS[eventType.toUpperCase() as keyof typeof ANALYTICS_EVENTS],
  event_category: ANALYTICS_CATEGORIES.AUTHENTICATION,
  success,
  login_method: method,
});

export const createApplicationEvent = (
  action: 'create' | 'update' | 'delete' | 'view',
  applicationId?: string,
  applicationName?: string,
  databaseType?: string
): ApplicationEvent => ({
  event_name: ANALYTICS_EVENTS[`APPLICATION_${action.toUpperCase()}` as keyof typeof ANALYTICS_EVENTS],
  event_category: ANALYTICS_CATEGORIES.APPLICATION_MANAGEMENT,
  application_id: applicationId,
  application_name: applicationName,
  database_type: databaseType,
});

export const createConnectionEvent = (
  action: 'create' | 'test' | 'update' | 'delete',
  success?: boolean,
  databaseType?: string
): CustomEvent => ({
  event_name: ANALYTICS_EVENTS[`CONNECTION_${action.toUpperCase()}` as keyof typeof ANALYTICS_EVENTS],
  event_category: ANALYTICS_CATEGORIES.DATABASE_OPERATIONS,
  custom_parameters: {
    success,
    database_type: databaseType,
  },
});

export const createErrorEvent = (
  errorMessage: string,
  errorCode?: string,
  errorLocation?: string
): ErrorEvent => ({
  event_name: ANALYTICS_EVENTS.ERROR_OCCURRED,
  event_category: ANALYTICS_CATEGORIES.ERROR_TRACKING,
  error_message: errorMessage,
  error_code: errorCode,
  error_location: errorLocation,
});

export const createPerformanceEvent = (
  metricName: string,
  value: number,
  componentName?: string
): CustomEvent => ({
  event_name: metricName,
  event_category: ANALYTICS_CATEGORIES.PERFORMANCE,
  value,
  custom_parameters: {
    component_name: componentName,
  },
});

export const createNavigationEvent = (
  destination: string,
  source?: string
): CustomEvent => ({
  event_name: ANALYTICS_EVENTS.NAVIGATION,
  event_category: ANALYTICS_CATEGORIES.NAVIGATION,
  event_label: destination,
  custom_parameters: {
    source,
    destination,
  },
});

export const sanitizeEventData = (data: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {};
  
  Object.entries(data).forEach(([key, value]) => {
    // Remove sensitive data
    if (key.toLowerCase().includes('password') || 
        key.toLowerCase().includes('token') || 
        key.toLowerCase().includes('secret')) {
      return;
    }
    
    // Ensure value is serializable
    if (value !== null && value !== undefined) {
      if (typeof value === 'object') {
        sanitized[key] = JSON.stringify(value);
      } else {
        sanitized[key] = String(value);
      }
    }
  });
  
  return sanitized;
};