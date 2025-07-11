import React from 'react';
import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';
import { ANALYTICS_EVENTS } from '../constants/AnalyticsConstants';

// Core Web Vitals thresholds (Google recommendations)
const VITALS_THRESHOLDS = {
  CLS: { good: 0.1, needsImprovement: 0.25 },
  INP: { good: 200, needsImprovement: 500 },
  LCP: { good: 2500, needsImprovement: 4000 },
  FCP: { good: 1800, needsImprovement: 3000 },
  TTFB: { good: 800, needsImprovement: 1800 }
} as const;

type VitalName = keyof typeof VITALS_THRESHOLDS;

interface VitalMetric {
  name: VitalName;
  value: number;
  delta: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  navigationType: string;
}

// Function to determine performance rating
const getRating = (name: VitalName, value: number): 'good' | 'needs-improvement' | 'poor' => {
  const thresholds = VITALS_THRESHOLDS[name];
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.needsImprovement) return 'needs-improvement';
  return 'poor';
};

// Send metrics to analytics service
const sendToAnalytics = (metric: VitalMetric) => {
  // Send to Google Analytics if available
  if (typeof gtag !== 'undefined') {
    gtag('event', ANALYTICS_EVENTS.PAGE_LOAD_TIME, {
      event_category: 'Web Vitals',
      event_label: metric.name,
      value: Math.round(metric.value),
      custom_map: {
        metric_rating: metric.rating,
        navigation_type: metric.navigationType
      }
    });
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    const emoji = metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌';
    console.log(
      `${emoji} ${metric.name}: ${metric.value.toFixed(2)}ms (${metric.rating})`,
      metric
    );
  }

  // Send to your custom analytics endpoint if needed
  sendToCustomAnalytics(metric);
};

// Custom analytics endpoint (replace with your actual endpoint)
const sendToCustomAnalytics = async (metric: VitalMetric) => {
  try {
    // Only send in production to avoid development noise
    if (process.env.NODE_ENV === 'production') {
      await fetch('/api/analytics/web-vitals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: metric.name,
          value: metric.value,
          delta: metric.delta,
          rating: metric.rating,
          navigationType: metric.navigationType,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          connectionType: (navigator as any).connection?.effectiveType || 'unknown'
        }),
      });
    }
  } catch (error) {
    console.warn('Failed to send web vitals to analytics:', error);
  }
};

// Main function to initialize Core Web Vitals tracking
export const initWebVitals = () => {
  // Cumulative Layout Shift (CLS)
  onCLS((metric) => {
    sendToAnalytics({
      name: 'CLS',
      value: metric.value,
      delta: metric.delta,
      rating: getRating('CLS', metric.value),
      navigationType: metric.navigationType
    });
  });

  // Interaction to Next Paint (INP) - replaces FID in web-vitals v5
  onINP((metric) => {
    sendToAnalytics({
      name: 'INP',
      value: metric.value,
      delta: metric.delta,
      rating: getRating('INP', metric.value),
      navigationType: metric.navigationType
    });
  });

  // Largest Contentful Paint (LCP)
  onLCP((metric) => {
    sendToAnalytics({
      name: 'LCP',
      value: metric.value,
      delta: metric.delta,
      rating: getRating('LCP', metric.value),
      navigationType: metric.navigationType
    });
  });

  // First Contentful Paint (FCP)
  onFCP((metric) => {
    sendToAnalytics({
      name: 'FCP',
      value: metric.value,
      delta: metric.delta,
      rating: getRating('FCP', metric.value),
      navigationType: metric.navigationType
    });
  });

  // Time to First Byte (TTFB)
  onTTFB((metric) => {
    sendToAnalytics({
      name: 'TTFB',
      value: metric.value,
      delta: metric.delta,
      rating: getRating('TTFB', metric.value),
      navigationType: metric.navigationType
    });
  });
};

// Hook for React components to track custom performance metrics
export const usePerformanceTracking = () => {
  const trackCustomMetric = (name: string, value: number, unit: 'ms' | 's' = 'ms') => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'custom_performance_metric', {
        event_category: 'Performance',
        event_label: name,
        value: Math.round(value),
        custom_map: {
          unit: unit
        }
      });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Custom Metric - ${name}: ${value}${unit}`);
    }
  };

  const trackPageLoadComplete = () => {
    const loadTime = performance.now();
    trackCustomMetric('page_load_complete', loadTime);
  };

  const trackComponentMount = (componentName: string) => {
    const mountTime = performance.now();
    trackCustomMetric(`component_mount_${componentName}`, mountTime);
  };

  return {
    trackCustomMetric,
    trackPageLoadComplete,
    trackComponentMount
  };
};

// Performance monitoring component
export const PerformanceMonitor: React.FC = () => {
  React.useEffect(() => {
    initWebVitals();
  }, []);

  return null; // This component doesn't render anything
};

export default {
  initWebVitals,
  usePerformanceTracking,
  PerformanceMonitor
};