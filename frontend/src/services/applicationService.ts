import { apiService } from './api';
import {
  Application,
  ApplicationRequest,
  ApplicationWithConnectionRequest,
  ApplicationWithConnectionResponse,
  DatabaseConnectionSummary,
} from '../types';

export const applicationService = {
  // Regular application CRUD
  async getApplications(): Promise<Application[]> {
    return apiService.get('/application');
  },

  async getApplication(id: number): Promise<Application> {
    return apiService.get(`/application/${id}`);
  },

  async createApplication(data: ApplicationRequest): Promise<Application> {
    return apiService.post('/application', data);
  },

  async updateApplication(id: number, data: ApplicationRequest & { id: number }): Promise<Application> {
    return apiService.put(`/application/${id}`, data);
  },

  async deleteApplication(id: number): Promise<void> {
    return apiService.delete(`/application/${id}`);
  },

  async toggleApplicationStatus(id: number, isActive: boolean): Promise<{ message: string }> {
    return apiService.patch(`/application/${id}/toggle`, { isActive });
  },

  async updateLastAccessed(id: number): Promise<{ message: string }> {
    return apiService.post(`/application/${id}/access`);
  },

  async getApplicationConnections(id: number): Promise<DatabaseConnectionSummary[]> {
    return apiService.get(`/application/${id}/connections`);
  },

  // Combined application + connection operations
  async createApplicationWithConnection(data: ApplicationWithConnectionRequest): Promise<ApplicationWithConnectionResponse> {
    console.log('Sending application with connection data:', data);
    try {
      return await apiService.post('/application/with-connection', data);
    } catch (error: any) {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        message: error?.message
      });
      throw error;
    }
  },

  async updateApplicationWithConnection(
    id: number,
    data: ApplicationWithConnectionRequest & { applicationId: number; connectionId: number }
  ): Promise<ApplicationWithConnectionResponse> {
    return apiService.put(`/application/${id}/with-connection`, data);
  },

  async getApplicationWithPrimaryConnection(id: number): Promise<ApplicationWithConnectionResponse> {
    return apiService.get(`/application/${id}/with-primary-connection`);
  },
};