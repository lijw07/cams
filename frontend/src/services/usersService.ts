import { apiService } from './api';

export interface PaginationRequest {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  searchTerm?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface UserManagement {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  roles: string[];
  applicationCount: number;
  databaseConnectionCount: number;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  isActive: boolean;
  sendWelcomeEmail: boolean;
}

export interface UpdateUserRequest {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  isActive: boolean;
}

export interface UserRoleAssignment {
  userId: number;
  roleIds: number[];
}

export const usersService = {
  // User management CRUD
  async getUsers(request: PaginationRequest): Promise<PaginatedResponse<UserManagement>> {
    return apiService.get('/management/users', request);
  },

  async getUser(id: number): Promise<UserManagement> {
    return apiService.get(`/management/users/${id}`);
  },

  async createUser(data: CreateUserRequest): Promise<UserManagement> {
    return apiService.post('/management/users', data);
  },

  async updateUser(id: number, data: UpdateUserRequest): Promise<UserManagement> {
    return apiService.put(`/management/users/${id}`, data);
  },

  async deleteUser(id: number): Promise<{ message: string }> {
    return apiService.delete(`/management/users/${id}`);
  },

  async toggleUserStatus(id: number, isActive: boolean): Promise<{ message: string }> {
    return apiService.patch(`/management/users/${id}/toggle`, { isActive });
  },

  // User role management
  async getUserRoles(id: number): Promise<{ roles: string[] }> {
    return apiService.get(`/management/users/${id}/roles`);
  },

  async assignRoles(data: UserRoleAssignment): Promise<{ message: string }> {
    return apiService.post('/management/users/assign-roles', data);
  },

  async removeRoles(data: UserRoleAssignment): Promise<{ message: string }> {
    return apiService.post('/management/users/remove-roles', data);
  },

  // User statistics
  async getUserStats(id: number): Promise<{
    applicationCount: number;
    databaseConnectionCount: number;
    lastLoginAt?: string;
    accountCreatedDays: number;
  }> {
    return apiService.get(`/management/users/${id}/stats`);
  },

  // Password management
  async resetUserPassword(id: number, data: {
    newPassword: string;
    sendEmailNotification: boolean;
  }): Promise<{ message: string }> {
    return apiService.post(`/management/users/${id}/reset-password`, data);
  },

  async forcePasswordChange(id: number): Promise<{ message: string }> {
    return apiService.post(`/management/users/${id}/force-password-change`);
  },

  // Bulk operations
  async bulkToggleStatus(userIds: number[], isActive: boolean): Promise<{
    successful: number[];
    failed: Array<{ id: number; error: string }>;
    message: string;
  }> {
    return apiService.post('/management/users/bulk/toggle', {
      userIds,
      isActive,
    });
  },

  async bulkDelete(userIds: number[]): Promise<{
    successful: number[];
    failed: Array<{ id: number; error: string }>;
    message: string;
  }> {
    return apiService.post('/management/users/bulk/delete', {
      userIds,
    });
  },

  // Search and filtering
  async searchUsers(searchTerm: string, filters?: {
    isActive?: boolean;
    roles?: string[];
    createdAfter?: string;
    createdBefore?: string;
  }): Promise<UserManagement[]> {
    return apiService.get('/management/users/search', {
      searchTerm,
      ...filters,
    });
  },
};