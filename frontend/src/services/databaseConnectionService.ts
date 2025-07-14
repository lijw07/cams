import { components } from '../types/api.generated';
import { apiService } from './api';
import { DatabaseConnection, DatabaseConnectionSummary, ConnectionStatus } from '../types';

// Type aliases for cleaner code from generated API
export type DatabaseConnectionRequest = components['schemas']['DatabaseConnectionRequest'];
export type DatabaseConnectionUpdateRequest = components['schemas']['DatabaseConnectionUpdateRequest'];
export type DatabaseConnectionTestRequest = components['schemas']['DatabaseConnectionTestRequest'];
export type DatabaseType = components['schemas']['DatabaseType'];

// Note: DatabaseConnection, DatabaseConnectionSummary, and ConnectionStatus types
// are imported from '../types' but not re-exported here to avoid circular dependencies.
// Components should import these types directly from '../types' if needed.

// Custom types not in generated API (specific response types)
export interface ConnectionTestResult {
  IsSuccessful: boolean;
  Message: string;
  Duration?: number;
  LastTestedAt: string;
}

export interface DatabaseTestRequest {
  DatabaseType: DatabaseType;
  Server: string;
  Port?: number;
  Database?: string;
  Username?: string;
  Password?: string;
  ConnectionString?: string;
  ApiBaseUrl?: string;
  ApiKey?: string;
}

export interface MessageResponse {
  Message: string;
}

export interface ConnectionHealthResponse {
  ConnectionId: string;
  IsHealthy: boolean;
  LastChecked: string;
  ResponseTime?: number;
  ErrorMessage?: string;
}

export interface BulkOperationResponse {
  Successful: string[];
  Failed: Array<{ Id: string; Error: string }>;
  Message: string;
}

export interface ConnectionUsageStatsResponse {
  ConnectionId: string;
  TotalApplications: number;
  ActiveApplications: number;
  LastUsed?: string;
  UsageFrequency: {
    Daily: number;
    Weekly: number;
    Monthly: number;
  };
}

export interface ConnectionStringResponse {
  ConnectionString: string;
}

export interface ConnectionStringValidationResponse {
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
}

export interface SupportedDatabaseTypesResponse {
  DatabaseTypes: Array<{
    Type: DatabaseType;
    Name: string;
    Description: string;
    DefaultPort: number;
    SupportsIntegratedSecurity: boolean;
  }>;
}

export const databaseConnectionService = {
  // Regular database connection CRUD
  async getConnections(applicationId?: string): Promise<DatabaseConnection[]> {
    const params = new URLSearchParams();
    if (applicationId) params.append('application-id', applicationId);
    const url = `/database-connections${params.toString() ? `?${params.toString()}` : ''}`;
    console.log('getConnections URL:', url, 'for applicationId:', applicationId);
    return apiService.get(url);
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

  async toggleConnectionStatus(id: string, isActive: boolean): Promise<{ Message: string }> {
    return apiService.patch(`/database-connections/${id}/toggle`, { IsActive: isActive });
  },

  async updateLastAccessed(id: string): Promise<{ Message: string }> {
    return apiService.post(`/database-connections/${id}/access`);
  },

  // Connection testing
  async testConnection(data: DatabaseConnectionTestRequest): Promise<ConnectionTestResult> {
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
  }): Promise<ConnectionStringResponse> {
    return apiService.post('/database-connections/connection-string/build', data);
  },

  async validateConnectionString(connectionString: string, databaseType: DatabaseType): Promise<ConnectionStringValidationResponse> {
    return apiService.post('/database-connections/validate-connection-string', {
      ConnectionString: connectionString,
      DatabaseType: databaseType,
    });
  },

  // Database type operations
  async getSupportedDatabaseTypes(): Promise<SupportedDatabaseTypesResponse> {
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
  async getConnectionHealth(id: string): Promise<ConnectionHealthResponse> {
    return apiService.get(`/database-connections/${id}/health`);
  },

  async refreshConnectionHealth(id: string): Promise<ConnectionHealthResponse> {
    return apiService.post(`/database-connections/${id}/health/refresh`);
  },

  // Bulk operations
  async bulkToggleStatus(connectionIds: string[], isActive: boolean): Promise<BulkOperationResponse> {
    return apiService.post('/database-connections/bulk/toggle', {
      ConnectionIds: connectionIds,
      IsActive: isActive,
    });
  },

  async bulkDelete(connectionIds: string[]): Promise<BulkOperationResponse> {
    return apiService.post('/database-connections/bulk/delete', {
      ConnectionIds: connectionIds,
    });
  },

  // Connection usage statistics
  async getConnectionUsageStats(id: string): Promise<ConnectionUsageStatsResponse> {
    return apiService.get(`/database-connections/${id}/usage-stats`);
  },

  // Connection assignment operations
  async getUnassignedConnections(): Promise<DatabaseConnectionSummary[]> {
    return apiService.get('/database-connections/unassigned');
  },

  async assignConnectionToApplication(connectionId: string, applicationId: string): Promise<{ Message: string }> {
    return apiService.post(`/database-connections/${connectionId}/assign`, {
      ApplicationId: applicationId,
    });
  },

  async unassignConnectionFromApplication(connectionId: string): Promise<{ Message: string }> {
    return apiService.delete(`/database-connections/${connectionId}/unassign`);
  },
};