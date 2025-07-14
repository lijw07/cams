import type {
  AuditLog,
  SystemLog,
  SecurityLog,
  PerformanceLog,
  LogsResponse,
  AuditLogFilters,
  SystemLogFilters,
  SecurityLogFilters,
  PerformanceLogFilters,
  LogStatistics,
  LogTrends
} from '../types/logs';
import { mapPaginatedToLegacy } from '../types/logs';

import { apiService as api } from './api';

// Re-export types for component usage
export type {
  AuditLog,
  SystemLog,
  SecurityLog,
  PerformanceLog,
  LogsResponse,
  AuditLogFilters,
  SystemLogFilters,
  SecurityLogFilters,
  PerformanceLogFilters,
  LogStatistics,
  LogTrends
};

class LogService {
  // Audit Logs
  async getAuditLogs(filters: AuditLogFilters = {}): Promise<LogsResponse<AuditLog>> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('page-size', filters.pageSize.toString());
    if (filters.startDate) params.append('from-date', filters.startDate);
    if (filters.endDate) params.append('to-date', filters.endDate);
    if (filters.userId) params.append('user-id', filters.userId);
    if (filters.search) params.append('search', filters.search);
    if (filters.entityType) params.append('entity-type', filters.entityType);
    if (filters.sortBy) params.append('sort-by', filters.sortBy);
    if (filters.sortDirection) params.append('sort-direction', filters.sortDirection);

    try {
      const response = await api.get<any>(`/logs/audit?${params.toString()}`);
      return mapPaginatedToLegacy(response);
    } catch (error) {
      console.error('Error in getAuditLogs:', error);
      throw error;
    }
  }

  async getAuditLogById(id: string): Promise<AuditLog> {
    const response = await api.get<AuditLog>(`/logs/audit/${id}`);
    return response;
  }

  // System Logs
  async getSystemLogs(filters: SystemLogFilters = {}): Promise<LogsResponse<SystemLog>> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('page-size', filters.pageSize.toString());
    if (filters.startDate) params.append('from-date', filters.startDate);
    if (filters.endDate) params.append('to-date', filters.endDate);
    if (filters.level) params.append('level', filters.level);
    if (filters.eventType) params.append('event-type', filters.eventType);
    if (filters.search) params.append('search', filters.search);
    if (filters.isResolved !== undefined) params.append('is-resolved', filters.isResolved.toString());
    if (filters.sortBy) params.append('sort-by', filters.sortBy);
    if (filters.sortDirection) params.append('sort-direction', filters.sortDirection);

    try {
      const response = await api.get<any>(`/logs/system?${params.toString()}`);
      return mapPaginatedToLegacy(response);
    } catch (error) {
      console.error('Error in getSystemLogs:', error);
      throw error;
    }
  }

  async getSystemLogById(id: string): Promise<SystemLog> {
    const response = await api.get<SystemLog>(`/logs/system/${id}`);
    return response;
  }

  async markSystemLogResolved(id: string, resolutionNotes: string): Promise<SystemLog> {
    const response = await api.patch<SystemLog>(`/logs/system/${id}/resolve`, {
      resolutionNotes
    });
    return response;
  }

  // Security Logs
  async getSecurityLogs(filters: SecurityLogFilters = {}): Promise<LogsResponse<SecurityLog>> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('page-size', filters.pageSize.toString());
    if (filters.startDate) params.append('from-date', filters.startDate);
    if (filters.endDate) params.append('to-date', filters.endDate);
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.eventType) params.append('event-type', filters.eventType);
    if (filters.status) params.append('status', filters.status);
    if (filters.userId) params.append('user-id', filters.userId);
    if (filters.search) params.append('search', filters.search);
    if (filters.sortBy) params.append('sort-by', filters.sortBy);
    if (filters.sortDirection) params.append('sort-direction', filters.sortDirection);

    try {
      const response = await api.get<any>(`/logs/security?${params.toString()}`);
      return mapPaginatedToLegacy(response);
    } catch (error) {
      console.error('Error in getSecurityLogs:', error);
      throw error;
    }
  }

  async getSecurityLogById(id: string): Promise<SecurityLog> {
    const response = await api.get<SecurityLog>(`/logs/security/${id}`);
    return response;
  }

  // Performance Logs
  async getPerformanceLogs(filters: PerformanceLogFilters = {}): Promise<LogsResponse<PerformanceLog>> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('page-size', filters.pageSize.toString());
    if (filters.startDate) params.append('from-date', filters.startDate);
    if (filters.endDate) params.append('to-date', filters.endDate);
    if (filters.performanceLevel) params.append('performance-level', filters.performanceLevel);
    if (filters.search) params.append('search', filters.search);
    if (filters.isSlowQuery !== undefined) params.append('is-slow-query', filters.isSlowQuery.toString());
    if (filters.sortBy) params.append('sort-by', filters.sortBy);
    if (filters.sortDirection) params.append('sort-direction', filters.sortDirection);

    try {
      const response = await api.get<any>(`/logs/performance?${params.toString()}`);
      return mapPaginatedToLegacy(response);
    } catch (error) {
      console.error('Error in getPerformanceLogs:', error);
      throw error;
    }
  }

  async getPerformanceLogById(id: string): Promise<PerformanceLog> {
    const response = await api.get<PerformanceLog>(`/logs/performance/${id}`);
    return response;
  }

  // Log Analytics
  async getLogStatistics(logType: 'audit' | 'system' | 'security' | 'performance', days: number = 7): Promise<LogStatistics> {
    const response = await api.get<LogStatistics>(`/logs/${logType}/statistics?days=${days}`);
    return response;
  }

  async getLogTrends(logType: 'audit' | 'system' | 'security' | 'performance', days: number = 30): Promise<LogTrends> {
    const response = await api.get<LogTrends>(`/logs/${logType}/trends?days=${days}`);
    return response;
  }

  // Export logs
  async exportLogs(logType: 'audit' | 'system' | 'security' | 'performance', filters: Record<string, unknown>, format: 'csv' | 'json' = 'csv') {
    const params = new URLSearchParams({ ...filters, format });
    const response = await api.client.get(`/logs/${logType}/export?${params.toString()}`, {
      responseType: 'blob'
    });
    
    // Create download link
    const blob = new Blob([response.data], { 
      type: format === 'csv' ? 'text/csv' : 'application/json' 
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${logType}-logs-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export const logService = new LogService();