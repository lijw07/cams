import api from './api';
import { 
  ExternalConnection, 
  ExternalConnectionRequest, 
  ExternalConnectionUpdateRequest,
  ExternalConnectionTestResult 
} from '../types/externalConnection';

class ExternalConnectionService {
  // Get all external connections
  async getConnections(): Promise<ExternalConnection[]> {
    try {
      const response = await api.get('/external-connections');
      return response.data;
    } catch (error: any) {
      // Return empty array if API doesn't exist yet
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  }

  // Get external connections by application ID
  async getConnectionsByApplicationId(applicationId: string): Promise<ExternalConnection[]> {
    try {
      const response = await api.get(`/external-connections/application/${applicationId}`);
      return response.data;
    } catch (error: any) {
      // Return empty array if API doesn't exist yet
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  }

  // Get a single external connection
  async getConnection(id: string): Promise<ExternalConnection> {
    const response = await api.get(`/external-connections/${id}`);
    return response.data;
  }

  // Create a new external connection
  async createConnection(connection: ExternalConnectionRequest): Promise<ExternalConnection> {
    const response = await api.post('/external-connections', connection);
    return response.data;
  }

  // Update an external connection
  async updateConnection(id: string, connection: ExternalConnectionUpdateRequest): Promise<ExternalConnection> {
    const response = await api.put(`/external-connections/${id}`, connection);
    return response.data;
  }

  // Delete an external connection
  async deleteConnection(id: string): Promise<void> {
    await api.delete(`/external-connections/${id}`);
  }

  // Test an external connection
  async testConnection(id: string): Promise<ExternalConnectionTestResult> {
    const response = await api.post(`/external-connections/${id}/test`);
    return response.data;
  }

  // Sync an external connection
  async syncConnection(id: string): Promise<{ Success: boolean; Message: string }> {
    const response = await api.post(`/external-connections/${id}/sync`);
    return response.data;
  }

  // Toggle connection status
  async toggleConnectionStatus(id: string, isActive: boolean): Promise<void> {
    await api.patch(`/external-connections/${id}/status`, { IsActive: isActive });
  }
}

export const externalConnectionService = new ExternalConnectionService();