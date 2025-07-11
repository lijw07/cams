import { useQuery, useMutation, useQueryClient } from 'react-query';

import { useNotifications } from '../../contexts/NotificationContext';
import { logService } from '../../services/logService';
import { 
  AuditLogFilters,
  SecurityLogFilters,
  PerformanceLogFilters,
  SystemLogFilters 
} from '../../types';

/**
 * React Query keys for log-related queries
 * Organized by log type for efficient cache management
 */
export const LOG_QUERY_KEYS = {
  // Audit Logs
  auditLogs: ['logs', 'audit'] as const,
  auditLogsList: (filters: AuditLogFilters) => [...LOG_QUERY_KEYS.auditLogs, 'list', filters] as const,
  auditLogDetail: (id: string) => [...LOG_QUERY_KEYS.auditLogs, 'detail', id] as const,

  // Security Logs
  securityLogs: ['logs', 'security'] as const,
  securityLogsList: (filters: SecurityLogFilters) => [...LOG_QUERY_KEYS.securityLogs, 'list', filters] as const,
  securityLogDetail: (id: string) => [...LOG_QUERY_KEYS.securityLogs, 'detail', id] as const,

  // Performance Logs
  performanceLogs: ['logs', 'performance'] as const,
  performanceLogsList: (filters: PerformanceLogFilters) => [...LOG_QUERY_KEYS.performanceLogs, 'list', filters] as const,
  performanceLogDetail: (id: string) => [...LOG_QUERY_KEYS.performanceLogs, 'detail', id] as const,

  // System Logs
  systemLogs: ['logs', 'system'] as const,
  systemLogsList: (filters: SystemLogFilters) => [...LOG_QUERY_KEYS.systemLogs, 'list', filters] as const,
  systemLogDetail: (id: string) => [...LOG_QUERY_KEYS.systemLogs, 'detail', id] as const,

  // Log Statistics
  logStats: ['logs', 'stats'] as const,
};

/**
 * Common query configuration for log queries
 * Optimized for read-heavy log data with longer cache times
 */
const LOG_QUERY_CONFIG = {
  staleTime: 2 * 60 * 1000, // 2 minutes - logs don't change frequently
  cacheTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: false,
  retry: (failureCount: number, error: any) => {
    if (error?.status >= 400 && error?.status < 500) {
      return false;
    }
    return failureCount < 2; // Fewer retries for log queries
  },
};

// ============================================================================
// Audit Logs Queries
// ============================================================================

/**
 * Query hook for fetching audit logs with filters and pagination
 * 
 * @param filters - Audit log filters including pagination, search, and date range
 * @param options - Additional query options
 * @returns Query result with audit logs data
 */
export const useAuditLogsQuery = (
  filters: AuditLogFilters,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) => {
  return useQuery(
    LOG_QUERY_KEYS.auditLogsList(filters),
    () => logService.getAuditLogs(filters),
    {
      ...LOG_QUERY_CONFIG,
      ...options,
    }
  );
};

/**
 * Query hook for fetching single audit log details
 * 
 * @param logId - Audit log ID
 * @param options - Additional query options
 * @returns Query result with audit log details
 */
export const useAuditLogQuery = (
  logId: string | null,
  options?: {
    enabled?: boolean;
  }
) => {
  return useQuery(
    LOG_QUERY_KEYS.auditLogDetail(logId || ''),
    () => logService.getAuditLog(logId!),
    {
      ...LOG_QUERY_CONFIG,
      enabled: !!logId,
      ...options,
    }
  );
};

// ============================================================================
// Security Logs Queries
// ============================================================================

/**
 * Query hook for fetching security logs with filters and pagination
 * Higher refresh rate due to security importance
 * 
 * @param filters - Security log filters
 * @param options - Additional query options
 * @returns Query result with security logs data
 */
export const useSecurityLogsQuery = (
  filters: SecurityLogFilters,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) => {
  return useQuery(
    LOG_QUERY_KEYS.securityLogsList(filters),
    () => logService.getSecurityLogs(filters),
    {
      ...LOG_QUERY_CONFIG,
      staleTime: 1 * 60 * 1000, // 1 minute - security logs need fresher data
      refetchInterval: options?.refetchInterval || 2 * 60 * 1000, // Auto-refresh every 2 minutes
      ...options,
    }
  );
};

/**
 * Query hook for fetching single security log details
 * 
 * @param logId - Security log ID
 * @param options - Additional query options
 * @returns Query result with security log details
 */
export const useSecurityLogQuery = (
  logId: string | null,
  options?: {
    enabled?: boolean;
  }
) => {
  return useQuery(
    LOG_QUERY_KEYS.securityLogDetail(logId || ''),
    () => logService.getSecurityLog(logId!),
    {
      ...LOG_QUERY_CONFIG,
      enabled: !!logId,
      ...options,
    }
  );
};

// ============================================================================
// Performance Logs Queries
// ============================================================================

/**
 * Query hook for fetching performance logs with filters and pagination
 * Optimized for performance monitoring dashboards
 * 
 * @param filters - Performance log filters
 * @param options - Additional query options
 * @returns Query result with performance logs data
 */
export const usePerformanceLogsQuery = (
  filters: PerformanceLogFilters,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) => {
  return useQuery(
    LOG_QUERY_KEYS.performanceLogsList(filters),
    () => logService.getPerformanceLogs(filters),
    {
      ...LOG_QUERY_CONFIG,
      staleTime: 30 * 1000, // 30 seconds - performance data changes frequently
      refetchInterval: options?.refetchInterval || 1 * 60 * 1000, // Auto-refresh every minute
      ...options,
    }
  );
};

/**
 * Query hook for fetching single performance log details
 * 
 * @param logId - Performance log ID
 * @param options - Additional query options
 * @returns Query result with performance log details
 */
export const usePerformanceLogQuery = (
  logId: string | null,
  options?: {
    enabled?: boolean;
  }
) => {
  return useQuery(
    LOG_QUERY_KEYS.performanceLogDetail(logId || ''),
    () => logService.getPerformanceLog(logId!),
    {
      ...LOG_QUERY_CONFIG,
      enabled: !!logId,
      ...options,
    }
  );
};

// ============================================================================
// System Logs Queries
// ============================================================================

/**
 * Query hook for fetching system logs with filters and pagination
 * 
 * @param filters - System log filters
 * @param options - Additional query options
 * @returns Query result with system logs data
 */
export const useSystemLogsQuery = (
  filters: SystemLogFilters,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) => {
  return useQuery(
    LOG_QUERY_KEYS.systemLogsList(filters),
    () => logService.getSystemLogs(filters),
    {
      ...LOG_QUERY_CONFIG,
      ...options,
    }
  );
};

/**
 * Query hook for fetching single system log details
 * 
 * @param logId - System log ID
 * @param options - Additional query options
 * @returns Query result with system log details
 */
export const useSystemLogQuery = (
  logId: string | null,
  options?: {
    enabled?: boolean;
  }
) => {
  return useQuery(
    LOG_QUERY_KEYS.systemLogDetail(logId || ''),
    () => logService.getSystemLog(logId!),
    {
      ...LOG_QUERY_CONFIG,
      enabled: !!logId,
      ...options,
    }
  );
};

// ============================================================================
// Log Management Mutations
// ============================================================================

/**
 * Mutation hook for clearing old logs
 * Automatically invalidates relevant log queries
 * 
 * @returns Mutation object for log cleanup operations
 */
export const useClearLogsMutation = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  return useMutation(
    ({ 
      logType, 
      olderThanDays 
    }: { 
      logType: 'audit' | 'security' | 'performance' | 'system'; 
      olderThanDays: number; 
    }) => logService.clearLogs(logType, olderThanDays),
    {
      onSuccess: (result, variables) => {
        // Invalidate all queries for the specific log type
        switch (variables.logType) {
          case 'audit':
            queryClient.invalidateQueries(LOG_QUERY_KEYS.auditLogs);
            break;
          case 'security':
            queryClient.invalidateQueries(LOG_QUERY_KEYS.securityLogs);
            break;
          case 'performance':
            queryClient.invalidateQueries(LOG_QUERY_KEYS.performanceLogs);
            break;
          case 'system':
            queryClient.invalidateQueries(LOG_QUERY_KEYS.systemLogs);
            break;
        }
        
        // Invalidate stats
        queryClient.invalidateQueries(LOG_QUERY_KEYS.logStats);
        
        addNotification({
          title: 'Logs Cleared',
          message: `${result.deletedCount} ${variables.logType} logs cleared successfully`,
          type: 'success',
          source: 'Log Management'
        });
      },
      onError: (error: any) => {
        const message = error?.message || 'Failed to clear logs';
        addNotification({
          title: 'Clear Logs Failed',
          message: message,
          type: 'error',
          source: 'Log Management'
        });
      },
    }
  );
};

/**
 * Mutation hook for exporting logs
 * Handles log export operations with progress tracking
 * 
 * @returns Mutation object for log export operations
 */
export const useExportLogsMutation = () => {
  const { addNotification } = useNotifications();

  return useMutation(
    ({ 
      logType, 
      filters, 
      format 
    }: { 
      logType: 'audit' | 'security' | 'performance' | 'system'; 
      filters: any;
      format: 'csv' | 'json' | 'excel';
    }) => logService.exportLogs(logType, filters, format),
    {
      onSuccess: (downloadUrl, variables) => {
        // Trigger download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${variables.logType}-logs.${variables.format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        addNotification({
          title: 'Export Complete',
          message: `${variables.logType} logs exported successfully`,
          type: 'success',
          source: 'Log Management'
        });
      },
      onError: (error: any) => {
        const message = error?.message || 'Failed to export logs';
        addNotification({
          title: 'Export Failed',
          message: message,
          type: 'error',
          source: 'Log Management'
        });
      },
    }
  );
};