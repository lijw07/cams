import { apiService } from './api';

export interface PaginationRequest extends Record<string, unknown> {
  PageNumber: number;
  PageSize: number;
  SortBy?: string;
  SortDirection?: 'asc' | 'desc';
  SearchTerm?: string;
}

export interface PaginatedResponse<T> {
  Data: T[];
  Pagination: {
    CurrentPage: number;
    PerPage: number;
    TotalItems: number;
    TotalPages: number;
    HasNext: boolean;
    HasPrevious: boolean;
  };
}

export interface UserManagement {
  Id: string;
  Username: string;
  Email: string;
  FirstName?: string;
  LastName?: string;
  PhoneNumber?: string;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
  LastLoginAt?: string;
  Roles: Array<{ Id: string; Name: string; Description: string; IsActive: boolean; CreatedAt: string; UpdatedAt: string }>;
  ApplicationCount: number;
  DatabaseConnectionCount: number;
}

export interface CreateUserRequest {
  Username: string;
  Email: string;
  Password: string;
  FirstName?: string;
  LastName?: string;
  PhoneNumber?: string;
  IsActive: boolean;
  SendWelcomeEmail?: boolean;
  RoleIds?: string[];
}

export interface UpdateUserRequest {
  Id: string;
  Username: string;
  Email: string;
  FirstName?: string;
  LastName?: string;
  PhoneNumber?: string;
  IsActive: boolean;
}

export interface UserRoleAssignment {
  UserId: string;
  RoleIds: string[];
}

export const usersService = {
  // User management CRUD
  async getUsers(request: PaginationRequest): Promise<PaginatedResponse<UserManagement>> {
    const params: Record<string, unknown> = {};
    if (request.PageNumber) params['page-number'] = request.PageNumber;
    if (request.PageSize) params['page-size'] = request.PageSize;
    if (request.SortBy) params['sort-by'] = request.SortBy;
    if (request.SortDirection) params['sort-direction'] = request.SortDirection;
    if (request.SearchTerm) params['search-term'] = request.SearchTerm;
    
    return apiService.get('/management/users', params);
  },

  // Get all users (without pagination) for dropdowns and role management
  async getAllUsers(): Promise<UserManagement[]> {
    const response = await apiService.get<PaginatedResponse<UserManagement>>('/management/users', {
      'page-number': 1,
      'page-size': 1000, // Large page size to get all users
      'sort-by': 'Username'
    });
    return response.Data || [];
  },

  async getUser(id: string): Promise<UserManagement> {
    return apiService.get(`/management/users/${id}`);
  },

  async createUser(data: CreateUserRequest): Promise<UserManagement> {
    return apiService.post('/management/users', data);
  },

  async updateUser(id: string, data: UpdateUserRequest): Promise<UserManagement> {
    return apiService.put(`/management/users/${id}`, data);
  },

  async deleteUser(id: string): Promise<{ message: string }> {
    return apiService.delete(`/management/users/${id}`);
  },

  async toggleUserStatus(id: string, isActive: boolean): Promise<{ message: string }> {
    return apiService.patch(`/management/users/${id}/toggle`, { IsActive: isActive });
  },

  // User role management
  async getUserRoles(id: string): Promise<{ roles: string[] }> {
    return apiService.get(`/management/users/${id}/roles`);
  },

  async assignRoles(data: UserRoleAssignment): Promise<{ message: string }> {
    return apiService.post('/management/users/assign-roles', data);
  },

  async removeRoles(data: UserRoleAssignment): Promise<{ message: string }> {
    return apiService.post('/management/users/remove-roles', data);
  },

  async updateUserRoles(userId: string, roleIds: string[]): Promise<{ message: string }> {
    // Use the assign-roles endpoint to update user roles
    return apiService.post('/management/users/assign-roles', { 
      UserId: userId, 
      RoleIds: roleIds 
    });
  },

  // User statistics
  async getUserStats(id: string): Promise<{
    applicationCount: number;
    databaseConnectionCount: number;
    lastLoginAt?: string;
    accountCreatedDays: number;
  }> {
    return apiService.get(`/management/users/${id}/stats`);
  },

  // Password management
  async resetUserPassword(id: string, data: {
    newPassword: string;
    sendEmailNotification: boolean;
  }): Promise<{ message: string }> {
    return apiService.post(`/management/users/${id}/reset-password`, {
      NewPassword: data.newPassword,
      SendEmailNotification: data.sendEmailNotification
    });
  },

  async forcePasswordChange(id: string): Promise<{ message: string }> {
    return apiService.post(`/management/users/${id}/force-password-change`);
  },

  // Bulk operations
  async bulkToggleStatus(userIds: string[], isActive: boolean): Promise<{
    successful: string[];
    failed: Array<{ id: string; error: string }>;
    message: string;
  }> {
    return apiService.post('/management/users/bulk/toggle', {
      UserIds: userIds,
      IsActive: isActive,
    });
  },

  async bulkDelete(userIds: string[]): Promise<{
    successful: string[];
    failed: Array<{ id: string; error: string }>;
    message: string;
  }> {
    return apiService.post('/management/users/bulk/delete', {
      UserIds: userIds,
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