import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnalytics } from './useAnalytics';
import { createPageViewEvent } from '../utils/analyticsHelpers';

interface PageTrackingConfig {
  enabled?: boolean;
  trackOnMount?: boolean;
}

export const usePageTracking = (config: PageTrackingConfig = {}) => {
  const { trackPageView } = useAnalytics();
  const location = useLocation();
  
  const { enabled = true, trackOnMount = true } = config;

  useEffect(() => {
    if (!enabled || !trackOnMount) return;

    // Get page title from document or generate from path
    const pageTitle = document.title || generatePageTitle(location.pathname);
    
    const pageViewEvent = createPageViewEvent(
      pageTitle,
      location.pathname + location.search,
      window.location.href
    );

    trackPageView(pageViewEvent);
  }, [location, trackPageView, enabled, trackOnMount]);

  return {
    trackCurrentPage: () => {
      if (!enabled) return;
      
      const pageTitle = document.title || generatePageTitle(location.pathname);
      const pageViewEvent = createPageViewEvent(
        pageTitle,
        location.pathname + location.search,
        window.location.href
      );
      
      trackPageView(pageViewEvent);
    },
  };
};

const generatePageTitle = (pathname: string): string => {
  const path = pathname.replace(/^\//, '');
  
  if (!path || path === 'dashboard') return 'Dashboard - Centralized Application Management System';
  
  // Convert path segments to title case
  const segments = path.split('/').map(segment => 
    segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
  );
  
  return `${segments.join(' - ')} - Centralized Application Management System`;
};