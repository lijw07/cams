import { env } from '../config/environment';

export const ANALYTICS_EVENTS = {
  // Page Views
  PAGE_VIEW: 'page_view',
  
  // Authentication Events
  LOGIN: 'login',
  LOGOUT: 'logout',
  REGISTER: 'sign_up',
  LOGIN_ATTEMPT: 'login_attempt',
  
  // Application Events
  APPLICATION_CREATE: 'application_create',
  APPLICATION_UPDATE: 'application_update',
  APPLICATION_DELETE: 'application_delete',
  APPLICATION_VIEW: 'application_view',
  
  // Database Connection Events
  CONNECTION_CREATE: 'connection_create',
  CONNECTION_TEST: 'connection_test',
  CONNECTION_UPDATE: 'connection_update',
  CONNECTION_DELETE: 'connection_delete',
  
  // Migration Events
  MIGRATION_START: 'migration_start',
  MIGRATION_COMPLETE: 'migration_complete',
  MIGRATION_FAILED: 'migration_failed',
  
  // User Management Events
  USER_CREATE: 'user_create',
  USER_UPDATE: 'user_update',
  USER_DELETE: 'user_delete',
  ROLE_ASSIGN: 'role_assign',
  
  // Settings Events
  SETTINGS_UPDATE: 'settings_update',
  THEME_CHANGE: 'theme_change',
  EMAIL_CONFIG_UPDATE: 'email_config_update',
  
  // Performance Events
  PAGE_LOAD_TIME: 'page_load_time',
  API_RESPONSE_TIME: 'api_response_time',
  
  // Error Events
  ERROR_OCCURRED: 'error_occurred',
  API_ERROR: 'api_error',
  VALIDATION_ERROR: 'validation_error',
  
  // Navigation Events
  NAVIGATION: 'navigation',
  SEARCH: 'search',
  FILTER_APPLY: 'filter_apply',
} as const;

export const ANALYTICS_CATEGORIES = {
  AUTHENTICATION: 'Authentication',
  APPLICATION_MANAGEMENT: 'Application Management',
  DATABASE_OPERATIONS: 'Database Operations',
  USER_MANAGEMENT: 'User Management',
  SYSTEM_ADMINISTRATION: 'System Administration',
  PERFORMANCE: 'Performance',
  ERROR_TRACKING: 'Error Tracking',
  NAVIGATION: 'Navigation',
} as const;

export const CUSTOM_DIMENSIONS = {
  USER_ROLE: 'user_role',
  APPLICATION_TYPE: 'application_type',
  DATABASE_TYPE: 'database_type',
  ENVIRONMENT: 'environment',
  USER_PERMISSIONS: 'user_permissions',
} as const;

export const DEFAULT_CONFIG = {
  ENABLED: env.analytics.enabled,
  DEBUG: env.analytics.debug,
  MEASUREMENT_ID: env.analytics.measurementId,
  COOKIE_DOMAIN: 'auto',
  COOKIE_EXPIRES: 63072000, // 2 years
  ANONYMIZE_IP: true,
} as const;