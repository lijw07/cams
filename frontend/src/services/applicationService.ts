import type { components } from '../types/api.generated';
import {
  Application,
  ApplicationWithConnectionResponse,
  DatabaseConnectionSummary,
  PaginationRequest,
  PagedResult,
} from '../types';
import { apiService } from './api';

// Type aliases for generated types
type ApplicationRequest = components['schemas']['ApplicationRequest'];
type ApplicationUpdateRequest = components['schemas']['ApplicationUpdateRequest'];
type ApplicationWithConnectionRequest = components['schemas']['ApplicationWithConnectionRequest'];
type ApplicationWithConnectionUpdateRequest = components['schemas']['ApplicationWithConnectionUpdateRequest'];
type ToggleApplicationStatusRequest = components['schemas']['ToggleApplicationStatusRequest'];

export const applicationService = {
  // Regular application CRUD
  async getApplications(): Promise<Application[]> {
    return apiService.get('/applications');
  },

  async getApplicationsPaginated(pagination: PaginationRequest): Promise<PagedResult<Application>> {
    const params = new URLSearchParams();
    if (pagination.PageNumber) params.append('page-number', pagination.PageNumber.toString());
    if (pagination.PageSize) params.append('page-size', pagination.PageSize.toString());
    if (pagination.SearchTerm) params.append('search-term', pagination.SearchTerm);
    if (pagination.SortBy) params.append('sort-by', pagination.SortBy);
    if (pagination.SortDirection) params.append('sort-direction', pagination.SortDirection);
    
    const url = `/applications${params.toString() ? `?${params.toString()}` : ''}`;
    return apiService.get(url);
  },

  async getApplication(id: string): Promise<Application> {
    return apiService.get(`/applications/${id}`);
  },

  async createApplication(data: ApplicationRequest): Promise<Application> {
    return apiService.post('/applications', data);
  },

  async updateApplication(id: string, data: ApplicationUpdateRequest): Promise<Application> {
    return apiService.put(`/applications/${id}`, data);
  },

  async deleteApplication(id: string): Promise<void> {
    return apiService.delete(`/applications/${id}`);
  },

  async toggleApplicationStatus(id: string, isActive: boolean): Promise<{ message: string }> {
    const request: ToggleApplicationStatusRequest = { IsActive: isActive };
    return apiService.patch(`/applications/${id}/toggle`, request);
  },

  async updateLastAccessed(id: string): Promise<{ message: string }> {
    return apiService.post(`/applications/${id}/access`);
  },

  async getApplicationConnections(id: string): Promise<DatabaseConnectionSummary[]> {
    return apiService.get(`/applications/${id}/connections`);
  },

  // Combined application + connection operations
  async createApplicationWithConnection(data: ApplicationWithConnectionRequest): Promise<ApplicationWithConnectionResponse> {
    console.log('API Request data:', data);
    return await apiService.post('/applications/with-connection', data);
  },

  async updateApplicationWithConnection(
    id: string,
    data: ApplicationWithConnectionUpdateRequest
  ): Promise<ApplicationWithConnectionResponse> {
    return apiService.put(`/applications/${id}/with-connection`, data);
  },

  async getApplicationWithPrimaryConnection(id: string): Promise<ApplicationWithConnectionResponse> {
    return apiService.get(`/applications/${id}/with-primary-connection`);
  }
};

// Export types for use in components
export type { 
  ApplicationRequest, 
  ApplicationUpdateRequest, 
  ApplicationWithConnectionRequest, 
  ApplicationWithConnectionUpdateRequest,
  ToggleApplicationStatusRequest 
};