# Google Analytics Integration for CAMS

## Overview
This implementation provides comprehensive Google Analytics 4 (GA4) tracking for the CAMS (Connection & Application Management System) frontend application. The architecture follows clean code principles with proper separation of concerns and TypeScript type safety.

## Features Implemented

### 🚀 Core Features
- **Automatic Page View Tracking**: Tracks route changes automatically
- **User Authentication Events**: Login, logout, registration tracking
- **Application Management Events**: Create, update, delete, view operations
- **Database Connection Events**: Connection tests and CRUD operations
- **Error Tracking**: Comprehensive error logging with context
- **Performance Monitoring**: Ready for performance metrics tracking
- **User Properties**: Role-based tracking and custom dimensions

### 🏗️ Architecture Components

#### Services Layer
- `analyticsService.ts` - Core GA4 service with dependency injection
- Clean abstraction following CLAUDE.md standards

#### Custom Hooks
- `useAnalytics.ts` - Main analytics management hook
- `usePageTracking.ts` - Automatic page view tracking
- `useEventTracking.ts` - Event tracking utilities

#### Context Provider
- `AnalyticsContext.tsx` - Application-wide analytics state management
- Automatic user property setting on authentication

#### Utilities & Constants
- `analyticsHelpers.ts` - Event creation and sanitization utilities
- `AnalyticsConstants.ts` - Event names and configuration constants
- `analyticsTest.ts` - Development testing utilities

## Configuration

### Environment Variables
Create a `.env.local` file with your Google Analytics measurement ID:

```bash
# Google Analytics Configuration
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Optional: Override environment detection
VITE_APP_ENV=production
```

### Installation Dependencies
```bash
npm install gtag
```

## Usage Examples

### Basic Page Tracking
```typescript
// Automatic tracking is enabled by default in App.tsx
import { usePageTracking } from './hooks/usePageTracking';

const MyComponent = () => {
  usePageTracking(); // Tracks page views automatically
  return <div>Content</div>;
};
```

### Event Tracking
```typescript
import { useEventTracking } from './hooks/useEventTracking';

const MyComponent = () => {
  const { trackApplication, trackAuthentication, trackError } = useEventTracking();

  const handleCreateApp = async () => {
    try {
      const app = await createApplication(data);
      trackApplication('create', app.id, app.name, 'SqlServer');
    } catch (error) {
      trackError('Failed to create application', 'APP_CREATE_ERROR', 'MyComponent');
    }
  };

  return <button onClick={handleCreateApp}>Create Application</button>;
};
```

### Custom Events
```typescript
import { useEventTracking } from './hooks/useEventTracking';

const { trackCustomEvent } = useEventTracking();

trackCustomEvent(
  'button_click',
  'User Interface',
  'header_navigation',
  1,
  { source: 'dashboard', target: 'settings' }
);
```

## Tracked Events

### Authentication Events
- `login` - User login attempts and success/failure
- `logout` - User logout events
- `register` - User registration events
- `login_attempt` - Failed login attempts

### Application Management
- `application_create` - New application creation
- `application_update` - Application modifications
- `application_delete` - Application removal
- `application_view` - Application detail views

### Database Operations
- `connection_create` - New database connections
- `connection_test` - Connection testing
- `connection_update` - Connection modifications
- `connection_delete` - Connection removal

### System Events
- `error_occurred` - Error tracking with context
- `navigation` - User navigation patterns
- `page_view` - Page view tracking

## Custom Dimensions

The system tracks several custom dimensions:
- `user_role` - User's primary role
- `user_permissions` - Comma-separated permissions
- `environment` - Development/production environment
- `application_type` - Type of applications being managed
- `database_type` - Database types in use

## Privacy & Compliance

### Privacy Features
- **Opt-out Support**: Users can disable tracking
- **Data Sanitization**: Sensitive data is automatically filtered
- **IP Anonymization**: Enabled by default
- **Cookie Management**: Configurable cookie settings

### GDPR Compliance
```typescript
import { useAnalyticsContext } from './contexts/AnalyticsContext';

const PrivacySettings = () => {
  const { optOut, optIn } = useAnalyticsContext();

  return (
    <div>
      <button onClick={optOut}>Disable Analytics</button>
      <button onClick={optIn}>Enable Analytics</button>
    </div>
  );
};
```

## Development & Testing

### Testing in Development
```typescript
// In browser console during development
testAnalytics(); // Runs comprehensive test suite
```

### Debug Mode
Set `VITE_APP_ENV=development` to enable console logging of all GA events.

### Verification
1. Install Google Analytics Debugger browser extension
2. Check browser console for gtag calls
3. Monitor Real-Time reports in Google Analytics dashboard

## Performance Considerations

- **Lazy Loading**: Analytics scripts load asynchronously
- **Error Boundaries**: Failed analytics don't break the application
- **Memoization**: Event handlers are properly memoized
- **Bundle Size**: Minimal impact on application bundle size

## Integration Points

### Automatic Integration
The following components automatically track events:
- `Login.tsx` - Authentication events
- `Header.tsx` - Logout and navigation events
- `Dashboard.tsx` - Application creation events
- `App.tsx` - Page view tracking

### Adding New Tracking
To add tracking to new components:

1. Import the appropriate hook:
```typescript
import { useEventTracking } from '../hooks/useEventTracking';
```

2. Use tracking functions in event handlers:
```typescript
const { trackCustomEvent } = useEventTracking();

const handleClick = () => {
  trackCustomEvent('feature_used', 'Feature Category', 'specific_action');
  // Your existing logic
};
```

## Troubleshooting

### Common Issues

**Analytics not initializing:**
- Check `VITE_GA_MEASUREMENT_ID` environment variable
- Verify measurement ID format: `G-XXXXXXXXXX`

**Events not appearing in GA:**
- Enable debug mode for console logging
- Check Real-Time reports (not standard reports)
- Verify GA4 property configuration

**TypeScript errors:**
- Ensure all analytics types are properly imported
- Check that gtag package is installed

### Debug Commands
```bash
# Type checking
npm run type-check

# Lint checking
npm run lint

# Build verification
npm run build
```

## Future Enhancements

Potential improvements for the analytics implementation:
- Enhanced e-commerce tracking for application metrics
- Custom dashboard for internal analytics
- Advanced performance monitoring
- A/B testing integration
- User journey mapping
- Conversion funnel analysis

## Support

For questions or issues with the analytics implementation:
1. Check browser console for error messages
2. Verify Google Analytics configuration
3. Test with the provided `testAnalytics()` function
4. Review TypeScript compilation errors