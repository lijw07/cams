import {
  DatabaseConnection,
  DatabaseConnectionRequest,
  DatabaseConnectionUpdateRequest,
  DatabaseConnectionSummary,
  DatabaseType,
  ConnectionTestResult,
  DatabaseTestRequest,
} from '../types';

import { apiService } from './api';

export const databaseConnectionService = {
  // Regular database connection CRUD
  async getConnections(applicationId?: string): Promise<DatabaseConnection[]> {
    const params = new URLSearchParams();
    if (applicationId) params.append('application-id', applicationId);
    return apiService.get(`/database-connections${params.toString() ? `?${params.toString()}` : ''}`);
  },

  async getConnection(id: string): Promise<DatabaseConnection> {
    return apiService.get(`/database-connections/${id}`);
  },

  async createConnection(data: DatabaseConnectionRequest): Promise<DatabaseConnection> {
    return apiService.post('/database-connections', data);
  },

  async updateConnection(id: string, data: DatabaseConnectionUpdateRequest): Promise<DatabaseConnection> {
    return apiService.put(`/database-connections/${id}`, data);
  },

  async deleteConnection(id: string): Promise<void> {
    return apiService.delete(`/database-connections/${id}`);
  },

  async toggleConnectionStatus(id: string, isActive: boolean): Promise<{ message: string }> {
    return apiService.patch(`/database-connections/${id}/toggle`, { IsActive: isActive });
  },

  async updateLastAccessed(id: string): Promise<{ message: string }> {
    return apiService.post(`/database-connections/${id}/access`);
  },

  // Connection testing
  async testConnection(data: DatabaseTestRequest): Promise<ConnectionTestResult> {
    return apiService.post('/database-connections/test', data);
  },

  async testExistingConnection(id: string): Promise<ConnectionTestResult> {
    return apiService.post(`/database-connections/${id}/test`);
  },

  // Connection string operations
  async buildConnectionString(data: {
    DatabaseType: DatabaseType;
    Server: string;
    Database: string;
    Username: string;
    Password: string;
    Port?: number;
    UseIntegratedSecurity?: boolean;
    ConnectionTimeout?: number;
    CommandTimeout?: number;
    AdditionalParams?: string;
  }): Promise<{ ConnectionString: string }> {
    return apiService.post('/database-connections/connection-string/build', data);
  },

  async validateConnectionString(connectionString: string, databaseType: DatabaseType): Promise<{
    IsValid: boolean;
    Message: string;
    ParsedComponents?: {
      Server?: string;
      Database?: string;
      Username?: string;
      Port?: number;
      UseIntegratedSecurity?: boolean;
      ConnectionTimeout?: number;
      CommandTimeout?: number;
    };
  }> {
    return apiService.post('/database-connections/validate-connection-string', {
      ConnectionString: connectionString,
      DatabaseType: databaseType,
    });
  },

  // Database type operations
  async getSupportedDatabaseTypes(): Promise<{
    DatabaseTypes: Array<{
      Type: DatabaseType;
      Name: string;
      Description: string;
      DefaultPort: number;
      SupportsIntegratedSecurity: boolean;
    }>;
  }> {
    return apiService.get('/database-connections/types');
  },

  // Connection summary operations
  async getConnectionSummary(id: string): Promise<DatabaseConnectionSummary> {
    return apiService.get(`/database-connections/${id}/summary`);
  },

  async getConnectionsSummary(applicationId?: string): Promise<DatabaseConnectionSummary[]> {
    const params = new URLSearchParams();
    if (applicationId) params.append('application-id', applicationId);
    return apiService.get(`/database-connections/summary${params.toString() ? `?${params.toString()}` : ''}`);
  },

  // Connection health and monitoring
  async getConnectionHealth(id: string): Promise<{
    connectionId: string;
    isHealthy: boolean;
    lastChecked: string;
    responseTime?: number;
    errorMessage?: string;
  }> {
    return apiService.get(`/database-connections/${id}/health`);
  },

  async refreshConnectionHealth(id: string): Promise<{
    connectionId: string;
    isHealthy: boolean;
    lastChecked: string;
    responseTime?: number;
    errorMessage?: string;
  }> {
    return apiService.post(`/database-connections/${id}/health/refresh`);
  },

  // Bulk operations
  async bulkToggleStatus(connectionIds: string[], isActive: boolean): Promise<{
    successful: string[];
    failed: Array<{ id: string; error: string }>;
    message: string;
  }> {
    return apiService.post('/database-connections/bulk/toggle', {
      ConnectionIds: connectionIds,
      IsActive: isActive,
    });
  },

  async bulkDelete(connectionIds: string[]): Promise<{
    successful: string[];
    failed: Array<{ id: string; error: string }>;
    message: string;
  }> {
    return apiService.post('/database-connections/bulk/delete', {
      ConnectionIds: connectionIds,
    });
  },

  // Connection usage statistics
  async getConnectionUsageStats(id: string): Promise<{
    connectionId: string;
    totalApplications: number;
    activeApplications: number;
    lastUsed?: string;
    usageFrequency: {
      daily: number;
      weekly: number;
      monthly: number;
    };
  }> {
    return apiService.get(`/database-connections/${id}/usage-stats`);
  }
};