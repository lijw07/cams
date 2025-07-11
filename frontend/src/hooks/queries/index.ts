/**
 * Centralized exports for React Query hooks
 * Provides consistent access to server state management across the application
 */

// User Management Queries
export * from './useUsersQuery';

// Log Management Queries  
export * from './useLogsQuery';

// Application Management Queries
export * from './useApplicationsQuery';

// Query Key Constants for external use
export { USER_QUERY_KEYS } from './useUsersQuery';
export { LOG_QUERY_KEYS } from './useLogsQuery';
export { APPLICATION_QUERY_KEYS } from './useApplicationsQuery';