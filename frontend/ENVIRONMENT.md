# Environment Configuration Guide

This document explains how to configure environment variables for the CAMS frontend application.

## Environment Files

The application uses different environment files for different deployment stages:

- `.env.example` - Template file with all available variables
- `.env.development` - Default development settings
- `.env.staging` - Staging environment settings  
- `.env.production` - Production environment settings
- `.env.local` - Local overrides (not committed to Git)

## Variable Naming Convention

All client-side environment variables **MUST** use the `VITE_APP_` prefix to be accessible in the browser:

```bash
# ✅ CORRECT - Will be available in browser
VITE_APP_API_URL=http://localhost:5000

# ❌ INCORRECT - Will NOT be available in browser
API_URL=http://localhost:5000
```

## Setting Up Local Development

1. Copy the example file:
```bash
cp .env.example .env.local
```

2. Edit `.env.local` with your local settings:
```bash
# API Configuration
VITE_APP_API_URL=http://localhost:5000

# Feature Flags
VITE_APP_FEATURE_ANALYTICS=false
VITE_APP_FEATURE_SIGNALR=true

# Development Settings
VITE_APP_LOG_LEVEL=debug
```

## Available Configuration Categories

### API Configuration
- `VITE_APP_API_URL` - Backend API base URL
- `VITE_APP_API_TIMEOUT` - Request timeout in milliseconds
- `VITE_APP_API_RETRY_ATTEMPTS` - Number of retry attempts for failed requests
- `VITE_APP_API_RETRY_DELAY` - Delay between retry attempts

### Authentication & Security
- `VITE_APP_AUTH_STORAGE_TYPE` - Token storage method (localStorage, sessionStorage, httpOnly)
- `VITE_APP_SESSION_TIMEOUT` - Session timeout in milliseconds
- `VITE_APP_SESSION_WARNING_TIME` - Warning time before session expires
- `VITE_APP_TOKEN_REFRESH_INTERVAL` - Token refresh interval

### Feature Flags
- `VITE_APP_FEATURE_ANALYTICS` - Enable/disable analytics
- `VITE_APP_FEATURE_SIGNALR` - Enable/disable real-time updates
- `VITE_APP_FEATURE_BULK_OPERATIONS` - Enable/disable bulk operations
- `VITE_APP_FEATURE_ADVANCED_LOGGING` - Enable/disable advanced logging

### Analytics Configuration
- `VITE_APP_GA_MEASUREMENT_ID` - Google Analytics measurement ID
- `VITE_APP_ANALYTICS_DEBUG` - Enable analytics debug mode
- `VITE_APP_ANALYTICS_SAMPLING_RATE` - Analytics sampling rate (0.0-1.0)

### Performance & Monitoring
- `VITE_APP_PERFORMANCE_MONITORING` - Enable performance monitoring
- `VITE_APP_LOG_LEVEL` - Application log level (error, warn, info, debug)
- `VITE_APP_SENTRY_DSN` - Sentry error tracking DSN

### Application Metadata
- `VITE_APP_NAME` - Application display name
- `VITE_APP_VERSION` - Application version
- `VITE_APP_ENVIRONMENT` - Environment name (development, staging, production)
- `VITE_APP_BUILD_NUMBER` - Build number or commit hash

### UI Configuration
- `VITE_APP_THEME_MODE` - Default theme (light, dark, system)
- `VITE_APP_DEFAULT_PAGE_SIZE` - Default pagination size
- `VITE_APP_MAX_FILE_UPLOAD_SIZE` - Maximum file upload size in bytes

## Using Environment Variables in Code

### Type-Safe Access
```typescript
import { env } from '../config/environment';

// ✅ Type-safe access with defaults
const apiUrl = env.api.baseUrl;
const timeout = env.api.timeout;
const isAnalyticsEnabled = env.features.analytics;
```

### Direct Access (Not Recommended)
```typescript
// ❌ Not type-safe, no validation
const apiUrl = import.meta.env.VITE_APP_API_URL;
```

### Feature Flag Checking
```typescript
import { isFeatureEnabled } from '../config/environment';

if (isFeatureEnabled('analytics')) {
  // Analytics code here
}
```

## Environment Validation

The application validates required environment variables on startup. If validation fails:

1. **Development**: Error logged to console
2. **Production**: Application may fail to start

### Required Variables
- `VITE_APP_API_URL` - Backend API URL (with fallback to legacy `VITE_API_URL`)

### Validation Rules
- API URL must be a valid URL format
- Numeric values are validated and converted
- Boolean values accept: true/false, 1/0, yes/no, on/off

## Environment-Specific Overrides

The configuration system applies environment-specific overrides:

### Development
- Lower API timeouts for faster feedback
- Debug logging enabled
- Analytics disabled by default

### Staging
- Production-like settings
- Analytics enabled
- Session storage for security testing

### Production
- Stricter timeouts
- Error-level logging only
- HttpOnly cookie authentication
- Analytics fully enabled

## Legacy Support

For backward compatibility, the following legacy variables are supported:

- `VITE_API_URL` → `VITE_APP_API_URL`
- `VITE_GA_MEASUREMENT_ID` → `VITE_APP_GA_MEASUREMENT_ID`

**Note**: Legacy variables are deprecated and will be removed in future versions.

## Security Considerations

### Sensitive Data
- **Never** put secrets in environment variables
- Use backend endpoints for sensitive configuration
- Environment variables are visible in browser dev tools

### Recommended Practices
- Use different API keys for different environments
- Implement proper CORS policies
- Use httpOnly cookies for authentication tokens in production

## Troubleshooting

### Variable Not Found
1. Check the variable has `VITE_APP_` prefix
2. Restart the development server
3. Check `.env.local` file exists and is properly formatted

### Build Issues
1. Ensure all required variables are set
2. Check for typos in variable names
3. Validate environment file syntax

### Runtime Errors
1. Check browser console for validation errors
2. Verify API URL is accessible
3. Check feature flag settings

## Example Configurations

### Local Development
```bash
VITE_APP_API_URL=http://localhost:5000
VITE_APP_FEATURE_ANALYTICS=false
VITE_APP_LOG_LEVEL=debug
```

### Docker Development
```bash
VITE_APP_API_URL=http://backend:5000
VITE_APP_FEATURE_SIGNALR=true
VITE_APP_ENVIRONMENT=docker
```

### Production
```bash
VITE_APP_API_URL=https://api.cams.com
VITE_APP_FEATURE_ANALYTICS=true
VITE_APP_AUTH_STORAGE_TYPE=httpOnly
VITE_APP_LOG_LEVEL=error
```