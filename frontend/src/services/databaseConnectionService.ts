import { apiService } from './api';
import {
  DatabaseConnection,
  DatabaseConnectionRequest,
  DatabaseConnectionUpdateRequest,
  DatabaseConnectionSummary,
  DatabaseType,
  ConnectionTestResult,
  DatabaseTestRequest,
} from '../types';

export const databaseConnectionService = {
  // Regular database connection CRUD
  async getConnections(applicationId?: number): Promise<DatabaseConnection[]> {
    const params = applicationId ? { applicationId: applicationId } : undefined;
    return apiService.get('/database-connections', params);
  },

  async getConnection(id: number): Promise<DatabaseConnection> {
    return apiService.get(`/database-connections/${id}`);
  },

  async createConnection(data: DatabaseConnectionRequest): Promise<DatabaseConnection> {
    return apiService.post('/database-connections', data);
  },

  async updateConnection(id: number, data: DatabaseConnectionUpdateRequest): Promise<DatabaseConnection> {
    return apiService.put(`/database-connections/${id}`, data);
  },

  async deleteConnection(id: number): Promise<void> {
    return apiService.delete(`/database-connections/${id}`);
  },

  async toggleConnectionStatus(id: number, isActive: boolean): Promise<{ message: string }> {
    return apiService.patch(`/database-connections/${id}/toggle`, { IsActive: isActive });
  },

  async updateLastAccessed(id: number): Promise<{ message: string }> {
    return apiService.post(`/database-connections/${id}/access`);
  },

  // Connection testing
  async testConnection(data: DatabaseTestRequest): Promise<ConnectionTestResult> {
    return apiService.post('/database-connections/test', data);
  },

  async testExistingConnection(id: number): Promise<ConnectionTestResult> {
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
  async getConnectionSummary(id: number): Promise<DatabaseConnectionSummary> {
    return apiService.get(`/database-connections/${id}/summary`);
  },

  async getConnectionsSummary(applicationId?: number): Promise<DatabaseConnectionSummary[]> {
    const params = applicationId ? { applicationId } : undefined;
    return apiService.get('/database-connections/summary', params);
  },

  // Connection health and monitoring
  async getConnectionHealth(id: number): Promise<{
    connectionId: number;
    isHealthy: boolean;
    lastChecked: string;
    responseTime?: number;
    errorMessage?: string;
  }> {
    return apiService.get(`/database-connections/${id}/health`);
  },

  async refreshConnectionHealth(id: number): Promise<{
    connectionId: number;
    isHealthy: boolean;
    lastChecked: string;
    responseTime?: number;
    errorMessage?: string;
  }> {
    return apiService.post(`/database-connections/${id}/health/refresh`);
  },

  // Bulk operations
  async bulkToggleStatus(connectionIds: number[], isActive: boolean): Promise<{
    successful: number[];
    failed: Array<{ id: number; error: string }>;
    message: string;
  }> {
    return apiService.post('/database-connections/bulk/toggle', {
      connectionIds,
      isActive,
    });
  },

  async bulkDelete(connectionIds: number[]): Promise<{
    successful: number[];
    failed: Array<{ id: number; error: string }>;
    message: string;
  }> {
    return apiService.post('/database-connections/bulk/delete', {
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
    return apiService.get(`/database-connections/${id}/usage-stats`);
  }
};