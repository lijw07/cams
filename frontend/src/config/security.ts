/**
 * Security configuration as per CLAUDE.md requirements
 */

/**
 * Authentication storage strategy
 * TODO: Migrate to httpOnly cookies when backend supports it
 */
export const AUTH_STORAGE_STRATEGY = {
  // Current implementation uses localStorage (temporary)
  // Will be migrated to httpOnly cookies
  current: 'localStorage' as const,
  target: 'httpOnlyCookie' as const,
};

/**
 * Content Security Policy directives
 */
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", 'https://www.googletagmanager.com'],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'img-src': ["'self'", 'data:', 'https:'],
  'connect-src': ["'self'", 'https://www.google-analytics.com'],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
};

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

/**
 * Session configuration
 */
export const SESSION_CONFIG = {
  // Session timeout in milliseconds (30 minutes)
  timeout: 30 * 60 * 1000,
  // Warning before timeout in milliseconds (5 minutes)
  warningTime: 5 * 60 * 1000,
  // Token refresh interval in milliseconds (15 minutes)
  refreshInterval: 15 * 60 * 1000,
};

/**
 * Input sanitization configuration
 */
export const SANITIZATION_CONFIG = {
  // HTML tags allowed in rich text inputs
  allowedTags: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li'],
  // HTML attributes allowed
  allowedAttributes: {
    'a': ['href', 'target', 'rel'],
  },
  // Force all links to have rel="noopener noreferrer"
  transformTags: {
    'a': (tagName: string, attribs: Record<string, string>) => {
      return {
        tagName,
        attribs: {
          ...attribs,
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      };
    },
  },
};

/**
 * Password policy configuration
 */
export const PASSWORD_POLICY = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '@$!%*?&',
  preventCommon: true,
  preventUserInfo: true,
};