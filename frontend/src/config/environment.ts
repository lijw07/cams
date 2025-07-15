/**
 * Environment Configuration Utilities
 * Provides type-safe access to environment variables with validation and defaults
 * 
 * IMPORTANT: All client-side environment variables must use VITE_APP_ prefix
 * Variables without this prefix will not be available in the browser
 */

/**
 * Get environment variable with type conversion and validation
 * @param key - Environment variable key
 * @param defaultValue - Default value if not found
 * @param converter - Optional converter function
 * @returns Converted value or default
 */
function getEnvVar<T>(
  key: keyof ImportMetaEnv,
  defaultValue: T,
  converter?: (value: string) => T
): T {
  const value = import.meta.env[key];
  
  if (value === undefined || value === '') {
    return defaultValue;
  }

  if (converter) {
    try {
      return converter(value);
    } catch {
      console.warn(`Failed to convert environment variable ${key}: ${value}, using default`);
      return defaultValue;
    }
  }

  return value as unknown as T;
}

/**
 * Convert string to boolean with common true/false representations
 */
const toBool = (value: string): boolean => {
  return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
};

/**
 * Convert string to number with validation
 */
const toNumber = (value: string): number => {
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`Invalid number: ${value}`);
  }
  return num;
};

/**
 * Application Environment Configuration
 * Centralized access to all environment variables with type safety
 */
export const env = {
  // Application Metadata
  app: {
    name: getEnvVar('VITE_APP_NAME', 'CAMS'),
    version: getEnvVar('VITE_APP_VERSION', '1.0.0'),
    environment: getEnvVar('VITE_APP_ENVIRONMENT', 'development'),
    buildNumber: getEnvVar('VITE_APP_BUILD_NUMBER', 'local'),
    isDevelopment: import.meta.env.MODE === 'development',
    isProduction: import.meta.env.MODE === 'production',
    isStaging: import.meta.env.MODE === 'staging',
  },

  // API Configuration
  api: {
    baseUrl: getEnvVar('VITE_APP_API_URL', getEnvVar('VITE_API_URL', 'http://localhost:8080')),
    timeout: getEnvVar('VITE_APP_API_TIMEOUT', 30000, toNumber),
    retryAttempts: getEnvVar('VITE_APP_API_RETRY_ATTEMPTS', 3, toNumber),
    retryDelay: getEnvVar('VITE_APP_API_RETRY_DELAY', 1000, toNumber),
  },

  // Authentication & Security
  auth: {
    storageType: getEnvVar('VITE_APP_AUTH_STORAGE_TYPE', 'localStorage' as const),
    sessionTimeout: getEnvVar('VITE_APP_SESSION_TIMEOUT', 1800000, toNumber),
    sessionWarningTime: getEnvVar('VITE_APP_SESSION_WARNING_TIME', 300000, toNumber),
    tokenRefreshInterval: getEnvVar('VITE_APP_TOKEN_REFRESH_INTERVAL', 600000, toNumber),
  },

  // Feature Flags
  features: {
    analytics: getEnvVar('VITE_APP_FEATURE_ANALYTICS', true, toBool),
    signalR: getEnvVar('VITE_APP_FEATURE_SIGNALR', true, toBool),
    bulkOperations: getEnvVar('VITE_APP_FEATURE_BULK_OPERATIONS', true, toBool),
    advancedLogging: getEnvVar('VITE_APP_FEATURE_ADVANCED_LOGGING', true, toBool),
  },

  // Analytics Configuration
  analytics: {
    measurementId: getEnvVar('VITE_APP_GA_MEASUREMENT_ID', getEnvVar('VITE_GA_MEASUREMENT_ID', '')),
    debug: getEnvVar('VITE_APP_ANALYTICS_DEBUG', false, toBool),
    samplingRate: getEnvVar('VITE_APP_ANALYTICS_SAMPLING_RATE', 1.0, toNumber),
    enabled: getEnvVar('VITE_APP_FEATURE_ANALYTICS', true, toBool),
  },

  // Performance & Monitoring
  monitoring: {
    performanceEnabled: getEnvVar('VITE_APP_PERFORMANCE_MONITORING', true, toBool),
    logLevel: getEnvVar('VITE_APP_LOG_LEVEL', 'info' as const),
    sentryDsn: getEnvVar('VITE_APP_SENTRY_DSN', ''),
  },

  // UI Configuration
  ui: {
    themeMode: getEnvVar('VITE_APP_THEME_MODE', 'system' as const),
    defaultPageSize: getEnvVar('VITE_APP_DEFAULT_PAGE_SIZE', 20, toNumber),
    maxFileUploadSize: getEnvVar('VITE_APP_MAX_FILE_UPLOAD_SIZE', 10485760, toNumber),
  },
} as const;

/**
 * Environment validation function
 * Validates required environment variables are present
 */
export function validateEnvironment(): void {
  const requiredVars = [
    'VITE_APP_API_URL',
  ];

  const missingVars = requiredVars.filter(key => {
    const value = import.meta.env[key as keyof ImportMetaEnv];
    return !value || value.trim() === '';
  });

  if (missingVars.length > 0) {
    const fallbacks = missingVars.map(key => {
      switch (key) {
        case 'VITE_APP_API_URL':
          return import.meta.env.VITE_API_URL ? `${key} (using fallback VITE_API_URL)` : key;
        default:
          return key;
      }
    }).filter(item => !item.includes('using fallback'));

    if (fallbacks.length > 0) {
      throw new Error(
        `Missing required environment variables: ${fallbacks.join(', ')}\n` +
        'Please check your .env.local file and ensure all required variables are set.'
      );
    }
  }

  // Validate API URL format (allow relative URLs for local development)
  if (!env.api.baseUrl.startsWith('/') && !env.api.baseUrl.startsWith('http')) {
    throw new Error(`Invalid VITE_APP_API_URL format: ${env.api.baseUrl}. Must start with "/" or "http"`);
  }
  
  // For absolute URLs, validate the format
  if (env.api.baseUrl.startsWith('http')) {
    try {
      new URL(env.api.baseUrl);
    } catch {
      throw new Error(`Invalid VITE_APP_API_URL format: ${env.api.baseUrl}`);
    }
  }

  // Log environment info in development
  if (env.app.isDevelopment) {
    console.log('Environment Configuration:', {
      environment: env.app.environment,
      apiUrl: env.api.baseUrl,
      features: env.features,
      analytics: {
        enabled: env.analytics.enabled,
        measurementId: env.analytics.measurementId ? '***' : 'not set',
      },
    });
  }
}

/**
 * Check if a feature flag is enabled
 * @param feature - Feature flag name
 * @returns True if feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof env.features): boolean {
  return env.features[feature];
}

/**
 * Get environment-specific configuration
 * @returns Environment-specific settings
 */
export function getEnvironmentConfig() {
  return {
    ...env,
    // Environment-specific overrides
    api: {
      ...env.api,
      // Increase timeout in production
      timeout: env.app.isProduction ? Math.min(env.api.timeout, 10000) : env.api.timeout,
    },
    monitoring: {
      ...env.monitoring,
      // Force error level in production
      logLevel: env.app.isProduction ? 'error' as const : env.monitoring.logLevel,
    },
  };
}