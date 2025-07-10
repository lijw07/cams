import { apiService as api } from './api';
import {
  AuditLog,
  SystemLog,
  SecurityLog,
  PerformanceLog,
  LogsResponse,
  AuditLogFilters,
  SystemLogFilters,
  SecurityLogFilters,
  PerformanceLogFilters
} from '../types';

class LogService {
  // Audit Logs
  async getAuditLogs(filters: AuditLogFilters = {}): Promise<LogsResponse<AuditLog>> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.userId) params.append('userId', filters.userId.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.action) params.append('action', filters.action);
    if (filters.entityType) params.append('entityType', filters.entityType);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortDirection) params.append('sortDirection', filters.sortDirection);

    const response = await api.get<LogsResponse<AuditLog>>(`/api/logs/audit?${params.toString()}`);
    return response;
  }

  async getAuditLogById(id: number): Promise<AuditLog> {
    const response = await api.get<AuditLog>(`/api/logs/audit/${id}`);
    return response;
  }

  // System Logs
  async getSystemLogs(filters: SystemLogFilters = {}): Promise<LogsResponse<SystemLog>> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.level) params.append('level', filters.level);
    if (filters.eventType) params.append('eventType', filters.eventType);
    if (filters.userId) params.append('userId', filters.userId.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.isResolved !== undefined) params.append('isResolved', filters.isResolved.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortDirection) params.append('sortDirection', filters.sortDirection);

    const response = await api.get<LogsResponse<SystemLog>>(`/api/logs/system?${params.toString()}`);
    return response;
  }

  async getSystemLogById(id: number): Promise<SystemLog> {
    const response = await api.get<SystemLog>(`/api/logs/system/${id}`);
    return response;
  }

  async markSystemLogResolved(id: number, resolutionNotes: string): Promise<SystemLog> {
    const response = await api.patch<SystemLog>(`/api/logs/system/${id}/resolve`, {
      resolutionNotes
    });
    return response;
  }

  // Security Logs
  async getSecurityLogs(filters: SecurityLogFilters = {}): Promise<LogsResponse<SecurityLog>> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.eventType) params.append('eventType', filters.eventType);
    if (filters.status) params.append('status', filters.status);
    if (filters.userId) params.append('userId', filters.userId.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.requiresAction !== undefined) params.append('requiresAction', filters.requiresAction.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortDirection) params.append('sortDirection', filters.sortDirection);

    const response = await api.get<LogsResponse<SecurityLog>>(`/api/logs/security?${params.toString()}`);
    return response;
  }

  async getSecurityLogById(id: number): Promise<SecurityLog> {
    const response = await api.get<SecurityLog>(`/api/logs/security/${id}`);
    return response;
  }

  // Performance Logs
  async getPerformanceLogs(filters: PerformanceLogFilters = {}): Promise<LogsResponse<PerformanceLog>> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.performanceLevel) params.append('performanceLevel', filters.performanceLevel);
    if (filters.userId) params.append('userId', filters.userId.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.isSlowQuery !== undefined) params.append('isSlowQuery', filters.isSlowQuery.toString());
    if (filters.minDuration) params.append('minDuration', filters.minDuration.toString());
    if (filters.maxDuration) params.append('maxDuration', filters.maxDuration.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortDirection) params.append('sortDirection', filters.sortDirection);

    const response = await api.get<LogsResponse<PerformanceLog>>(`/api/logs/performance?${params.toString()}`);
    return response;
  }

  async getPerformanceLogById(id: number): Promise<PerformanceLog> {
    const response = await api.get<PerformanceLog>(`/api/logs/performance/${id}`);
    return response;
  }

  // Log Analytics
  async getLogStatistics(logType: 'audit' | 'system' | 'security' | 'performance', days: number = 7) {
    const response = await api.get<any>(`/api/logs/${logType}/statistics?days=${days}`);
    return response;
  }

  async getLogTrends(logType: 'audit' | 'system' | 'security' | 'performance', days: number = 30) {
    const response = await api.get<any>(`/api/logs/${logType}/trends?days=${days}`);
    return response;
  }

  // Export logs
  async exportLogs(logType: 'audit' | 'system' | 'security' | 'performance', filters: any, format: 'csv' | 'json' = 'csv') {
    const params = new URLSearchParams({ ...filters, format });
    const response = await api.client.get(`/api/logs/${logType}/export?${params.toString()}`, {
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