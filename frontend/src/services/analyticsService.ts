import { 
  AnalyticsConfig, 
  PageViewEvent, 
  CustomEvent, 
  UserEvent, 
  IAnalyticsService 
} from '../types/analytics';
import { DEFAULT_CONFIG } from '../constants/AnalyticsConstants';

declare global {
  interface Window {
    gtag: (command: string, ...args: any[]) => void;
    dataLayer: any[];
  }
}

class AnalyticsService implements IAnalyticsService {
  private _isInitialized = false;
  private _config: AnalyticsConfig | null = null;

  initialize(config: AnalyticsConfig): void {
    if (this._isInitialized) {
      console.warn('Analytics already initialized');
      return;
    }

    this._config = { ...DEFAULT_CONFIG, ...config };

    if (!this._config.enabled || !this._config.measurementId) {
      console.log('Analytics disabled or missing measurement ID');
      return;
    }

    this._loadGoogleAnalytics();
    this._isInitialized = true;

    if (this._config.debug) {
      console.log('Analytics initialized with config:', this._config);
    }
  }

  isInitialized(): boolean {
    return this._isInitialized && Boolean(this._config?.enabled);
  }

  trackPageView(event: PageViewEvent): void {
    if (!this._canTrack()) return;

    window.gtag('config', this._config!.measurementId, {
      page_title: event.page_title,
      page_location: event.page_location,
      page_path: event.page_path,
    });

    this._debugLog('Page view tracked:', event);
  }

  trackEvent(event: CustomEvent): void {
    if (!this._canTrack()) return;

    const { event_name, custom_parameters, ...standardParams } = event;

    window.gtag('event', event_name, {
      ...standardParams,
      ...custom_parameters,
    });

    this._debugLog('Event tracked:', event);
  }

  trackUser(event: UserEvent): void {
    if (!this._canTrack()) return;

    if (event.user_id) {
      window.gtag('config', this._config!.measurementId, {
        user_id: event.user_id,
      });
    }

    if (event.user_role || event.session_id) {
      this.setUserProperties({
        user_role: event.user_role,
        session_id: event.session_id,
      });
    }

    this._debugLog('User tracked:', event);
  }

  setUserProperties(properties: Record<string, any>): void {
    if (!this._canTrack()) return;

    const filteredProperties = Object.fromEntries(
      Object.entries(properties).filter(([, value]) => value !== undefined)
    );

    window.gtag('set', filteredProperties);
    this._debugLog('User properties set:', filteredProperties);
  }

  optOut(): void {
    if (typeof window !== 'undefined' && this._config?.measurementId) {
      (window as any)[`ga-disable-${this._config.measurementId}`] = true;
      localStorage.setItem('ga-opted-out', 'true');
      this._debugLog('User opted out of analytics');
    }
  }

  optIn(): void {
    if (typeof window !== 'undefined' && this._config?.measurementId) {
      (window as any)[`ga-disable-${this._config.measurementId}`] = false;
      localStorage.removeItem('ga-opted-out');
      this._debugLog('User opted into analytics');
    }
  }

  private _loadGoogleAnalytics(): void {
    if (typeof window === 'undefined') return;

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };

    // Set initial configuration
    window.gtag('js', new Date());
    window.gtag('config', this._config!.measurementId, {
      send_page_view: false, // We'll handle page views manually
      anonymize_ip: DEFAULT_CONFIG.ANONYMIZE_IP,
      cookie_domain: DEFAULT_CONFIG.COOKIE_DOMAIN,
      cookie_expires: DEFAULT_CONFIG.COOKIE_EXPIRES,
    });

    // Load the script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this._config!.measurementId}`;
    document.head.appendChild(script);
  }

  private _canTrack(): boolean {
    if (typeof window === 'undefined') return false;
    if (!this._isInitialized || !this._config?.enabled) return false;
    if (localStorage.getItem('ga-opted-out') === 'true') return false;
    return true;
  }

  private _debugLog(message: string, data?: any): void {
    if (this._config?.debug) {
      console.log(`[Analytics] ${message}`, data);
    }
  }
}

export const analyticsService = new AnalyticsService();