/// <reference types="vite/client" />

/**
 * Environment variables interface for type-safe access
 * All environment variables must use VITE_APP_ prefix for client-side access
 */
interface ImportMetaEnv {
  // API Configuration
  readonly VITE_APP_API_URL: string;
  readonly VITE_APP_API_TIMEOUT: string;
  readonly VITE_APP_API_RETRY_ATTEMPTS: string;
  readonly VITE_APP_API_RETRY_DELAY: string;

  // Authentication & Security
  readonly VITE_APP_AUTH_STORAGE_TYPE: 'localStorage' | 'sessionStorage' | 'httpOnly';
  readonly VITE_APP_SESSION_TIMEOUT: string;
  readonly VITE_APP_SESSION_WARNING_TIME: string;
  readonly VITE_APP_TOKEN_REFRESH_INTERVAL: string;

  // Feature Flags
  readonly VITE_APP_FEATURE_ANALYTICS: string;
  readonly VITE_APP_FEATURE_SIGNALR: string;
  readonly VITE_APP_FEATURE_BULK_OPERATIONS: string;
  readonly VITE_APP_FEATURE_ADVANCED_LOGGING: string;

  // Analytics Configuration
  readonly VITE_APP_GA_MEASUREMENT_ID: string;
  readonly VITE_APP_ANALYTICS_DEBUG: string;
  readonly VITE_APP_ANALYTICS_SAMPLING_RATE: string;

  // Performance Configuration
  readonly VITE_APP_PERFORMANCE_MONITORING: string;
  readonly VITE_APP_LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
  readonly VITE_APP_SENTRY_DSN: string;

  // Application Configuration
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_APP_ENVIRONMENT: 'development' | 'staging' | 'production';
  readonly VITE_APP_BUILD_NUMBER: string;

  // UI Configuration
  readonly VITE_APP_THEME_MODE: 'light' | 'dark' | 'system';
  readonly VITE_APP_DEFAULT_PAGE_SIZE: string;
  readonly VITE_APP_MAX_FILE_UPLOAD_SIZE: string;

  // Legacy support (deprecated - use VITE_APP_ prefixed versions)
  /** @deprecated Use VITE_APP_API_URL instead */
  readonly VITE_API_URL: string;
  /** @deprecated Use VITE_APP_GA_MEASUREMENT_ID instead */
  readonly VITE_GA_MEASUREMENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}