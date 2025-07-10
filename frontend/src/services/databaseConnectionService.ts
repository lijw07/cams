import { apiService } from './api';
import {
  DatabaseConnection,
  DatabaseConnectionRequest,
  DatabaseConnectionUpdateRequest,
  DatabaseConnectionSummary,
  DatabaseType,
  ConnectionTestResult,
} from '../types';

export const databaseConnectionService = {
  // Regular database connection CRUD
  async getConnections(applicationId?: number): Promise<DatabaseConnection[]> {
    const params = applicationId ? { applicationId } : undefined;
    return apiService.get('/databaseconnection', params);
  },

  async getConnection(id: number): Promise<DatabaseConnection> {
    return apiService.get(`/databaseconnection/${id}`);
  },

  async createConnection(data: DatabaseConnectionRequest): Promise<DatabaseConnection> {
    return apiService.post('/databaseconnection', data);
  },

  async updateConnection(id: number, data: DatabaseConnectionUpdateRequest): Promise<DatabaseConnection> {
    return apiService.put(`/databaseconnection/${id}`, data);
  },

  async deleteConnection(id: number): Promise<void> {
    return apiService.delete(`/databaseconnection/${id}`);
  },

  async toggleConnectionStatus(id: number, isActive: boolean): Promise<{ message: string }> {
    return apiService.patch(`/databaseconnection/${id}/toggle`, { isActive });
  },

  async updateLastAccessed(id: number): Promise<{ message: string }> {
    return apiService.post(`/databaseconnection/${id}/access`);
  },

  // Connection testing
  async testConnection(data: {
    databaseType: DatabaseType;
    server: string;
    database: string;
    username: string;
    password: string;
    port?: number;
    useIntegratedSecurity?: boolean;
    connectionTimeout?: number;
    commandTimeout?: number;
    additionalParams?: string;
  }): Promise<ConnectionTestResult> {
    return apiService.post('/databaseconnection/test', data);
  },

  async testExistingConnection(id: number): Promise<ConnectionTestResult> {
    return apiService.post(`/databaseconnection/${id}/test`);
  },

  // Connection string operations
  async buildConnectionString(data: {
    databaseType: DatabaseType;
    server: string;
    database: string;
    username: string;
    password: string;
    port?: number;
    useIntegratedSecurity?: boolean;
    connectionTimeout?: number;
    commandTimeout?: number;
    additionalParams?: string;
  }): Promise<{ connectionString: string }> {
    return apiService.post('/databaseconnection/build-connection-string', data);
  },

  async validateConnectionString(connectionString: string, databaseType: DatabaseType): Promise<{
    isValid: boolean;
    message: string;
    parsedComponents?: {
      server?: string;
      database?: string;
      username?: string;
      port?: number;
      useIntegratedSecurity?: boolean;
      connectionTimeout?: number;
      commandTimeout?: number;
    };
  }> {
    return apiService.post('/databaseconnection/validate-connection-string', {
      connectionString,
      databaseType,
    });
  },

  // Database type operations
  async getSupportedDatabaseTypes(): Promise<{
    databaseTypes: Array<{
      type: DatabaseType;
      name: string;
      description: string;
      defaultPort: number;
      supportsIntegratedSecurity: boolean;
    }>;
  }> {
    return apiService.get('/databaseconnection/supported-types');
  },

  // Connection summary operations
  async getConnectionSummary(id: number): Promise<DatabaseConnectionSummary> {
    return apiService.get(`/databaseconnection/${id}/summary`);
  },

  async getConnectionsSummary(applicationId?: number): Promise<DatabaseConnectionSummary[]> {
    const params = applicationId ? { applicationId } : undefined;
    return apiService.get('/databaseconnection/summary', params);
  },

  // Connection health and monitoring
  async getConnectionHealth(id: number): Promise<{
    connectionId: number;
    isHealthy: boolean;
    lastChecked: string;
    responseTime?: number;
    errorMessage?: string;
  }> {
    return apiService.get(`/databaseconnection/${id}/health`);
  },

  async refreshConnectionHealth(id: number): Promise<{
    connectionId: number;
    isHealthy: boolean;
    lastChecked: string;
    responseTime?: number;
    errorMessage?: string;
  }> {
    return apiService.post(`/databaseconnection/${id}/health/refresh`);
  },

  // Bulk operations
  async bulkToggleStatus(connectionIds: number[], isActive: boolean): Promise<{
    successful: number[];
    failed: Array<{ id: number; error: string }>;
    message: string;
  }> {
    return apiService.post('/databaseconnection/bulk/toggle', {
      connectionIds,
      isActive,
    });
  },

  async bulkDelete(connectionIds: number[]): Promise<{
    successful: number[];
    failed: Array<{ id: number; error: string }>;
    message: string;
  }> {
    return apiService.post('/databaseconnection/bulk/delete', {
      connectionIds,
    });
  },

  // Connection usage statistics
  async getConnectionUsageStats(id: number): Promise<{
    connectionId: number;
    totalApplications: number;
    activeApplications: number;
    lastUsed?: string;
    usageFrequency: {
      daily: number;
      weekly: number;
      monthly: number;
    };
  }> {
    return apiService.get(`/databaseconnection/${id}/usage-stats`);
  },
};