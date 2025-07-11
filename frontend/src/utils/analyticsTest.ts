// Test utility for Google Analytics implementation
// This file is for development testing only

import { analyticsService } from '../services/analyticsService';

import { 
  createPageViewEvent, 
  createAuthEvent, 
  createApplicationEvent 
} from './analyticsHelpers';

export const testAnalytics = () => {
  console.log('🧪 Testing Google Analytics Implementation');

  // Test 1: Initialize analytics
  console.log('1. Initializing analytics...');
  analyticsService.initialize({
    measurementId: 'G-TEST123456',
    enabled: true,
    debug: true,
  });

  // Test 2: Track page view
  console.log('2. Testing page view tracking...');
  const pageViewEvent = createPageViewEvent('Test Page', '/test', 'http://localhost:3000/test');
  analyticsService.trackPageView(pageViewEvent);

  // Test 3: Track authentication event
  console.log('3. Testing authentication tracking...');
  const authEvent = createAuthEvent('login', true, 'form');
  analyticsService.trackEvent(authEvent);

  // Test 4: Track application event
  console.log('4. Testing application tracking...');
  const appEvent = createApplicationEvent('create', 'test-app-1', 'Test Application', 'SqlServer');
  analyticsService.trackEvent(appEvent);

  // Test 5: Set user properties
  console.log('5. Testing user properties...');
  analyticsService.setUserProperties({
    user_role: 'admin',
    environment: 'development',
  });

  console.log('✅ Analytics test completed! Check browser console for gtag calls.');
  console.log('📊 Check Google Analytics Real-Time reports to verify data reception.');
};

// Export for manual testing in browser console
if (typeof window !== 'undefined') {
  (window as any).testAnalytics = testAnalytics;
}