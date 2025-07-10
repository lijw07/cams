export interface AnalyticsConfig {
  measurementId: string;
  enabled: boolean;
  debug?: boolean;
}

export interface PageViewEvent {
  page_title: string;
  page_location: string;
  page_path: string;
}

export interface CustomEvent {
  event_name: string;
  event_category?: string;
  event_label?: string;
  value?: number;
  custom_parameters?: Record<string, any>;
}

export interface UserEvent {
  user_id?: string;
  user_role?: string;
  session_id?: string;
}

export interface ApplicationEvent extends CustomEvent {
  application_id?: string;
  application_name?: string;
  database_type?: string;
}

export interface AuthEvent extends CustomEvent {
  login_method?: string;
  success?: boolean;
}

export interface ErrorEvent extends CustomEvent {
  error_message?: string;
  error_code?: string;
  error_location?: string;
}

export interface PerformanceEvent extends CustomEvent {
  load_time?: number;
  api_response_time?: number;
  component_name?: string;
}

export type AnalyticsEvent = 
  | PageViewEvent 
  | ApplicationEvent 
  | AuthEvent 
  | ErrorEvent 
  | PerformanceEvent;

export interface IAnalyticsService {
  initialize(config: AnalyticsConfig): void;
  isInitialized(): boolean;
  trackPageView(event: PageViewEvent): void;
  trackEvent(event: CustomEvent): void;
  trackUser(event: UserEvent): void;
  setUserProperties(properties: Record<string, any>): void;
  optOut(): void;
  optIn(): void;
}