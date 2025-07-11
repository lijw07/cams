// Export all custom hooks

// UI State Hooks (useState-based, not server state)
export { useModal } from './useModal';
export type { UseModalReturn } from './useModal';

export { usePagination } from './usePagination';
export type { UsePaginationProps, UsePaginationReturn } from './usePagination';

export { useForm } from './useForm';
export type { UseFormOptions, UseFormReturn } from './useForm';

export { useDebounce } from './useDebounce';

export { useConnectionTest } from './useConnectionTest';
export type { UseConnectionTestReturn, ConnectionTestData } from './useConnectionTest';

// Legacy API Hooks (deprecated - migrate to React Query)
export { useApi } from './useApi';
export type { UseApiState, UseApiReturn } from './useApi';

// React Query Hooks (recommended for server state)
export * from './queries';

// Refactored Hooks with React Query
export { useUserManagementRefactored } from './useUserManagementRefactored';

// Utility Hooks
export { useFocusTrap } from './useFocusTrap';
export { useConnectionTesting } from './useConnectionTesting';
export { useAnalytics } from './useAnalytics';