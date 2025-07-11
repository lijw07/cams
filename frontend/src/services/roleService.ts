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

export interface Role {
  Id: number;
  Name: string;
  Description?: string;
  IsSystem: boolean;
  IsActive: boolean;
  UserCount: number;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface CreateRoleRequest {
  Name: string;
  Description?: string;
}

export interface UpdateRoleRequest {
  Id: number;
  Name: string;
  Description?: string;
}

export interface UserRoleInfo {
  UserId: number;
  Username: string;
  Email: string;
  FirstName: string;
  LastName: string;
  IsActive: boolean;
  AssignedAt: string;
  AssignedBy?: number;
  AssignedByName?: string;
}

export const roleService = {
  // Role CRUD operations
  async getRoles(request: PaginationRequest): Promise<PaginatedResponse<Role>> {
    const params: Record<string, unknown> = {};
    if (request.PageNumber) params['page-number'] = request.PageNumber;
    if (request.PageSize) params['page-size'] = request.PageSize;
    if (request.SortBy) params['sort-by'] = request.SortBy;
    if (request.SortDirection) params['sort-direction'] = request.SortDirection;
    if (request.SearchTerm) params['search-term'] = request.SearchTerm;
    
    return apiService.get('/management/roles', params);
  },

  // Get all roles (without pagination) for dropdowns
  async getAllRoles(): Promise<Role[]> {
    return apiService.get('/management/roles/all');
  },

  async getRole(id: number): Promise<Role> {
    return apiService.get(`/management/roles/${id}`);
  },

  async createRole(data: CreateRoleRequest): Promise<Role> {
    return apiService.post('/management/roles', data);
  },

  async updateRole(id: number, data: UpdateRoleRequest): Promise<Role> {
    return apiService.put(`/management/roles/${id}`, data);
  },

  async deleteRole(id: number): Promise<{ message: string }> {
    return apiService.delete(`/management/roles/${id}`);
  },

  async toggleRoleStatus(id: number): Promise<{ message: string }> {
    return apiService.patch(`/management/roles/${id}/toggle-status`);
  },

  // Role-User management
  async getRoleUsers(id: number): Promise<UserRoleInfo[]> {
    return apiService.get(`/management/roles/${id}/users`);
  },

  async assignUsersToRole(roleId: number, userIds: number[]): Promise<{ message: string }> {
    return apiService.post(`/management/roles/${roleId}/assign-users`, { UserIds: userIds });
  },

  async removeUsersFromRole(roleId: number, userIds: number[]): Promise<{ message: string }> {
    return apiService.post(`/management/roles/${roleId}/remove-users`, { UserIds: userIds });
  },

  // Role validation
  async checkRoleNameAvailability(name: string, excludeId?: number): Promise<{
    IsAvailable: boolean;
    Message: string;
  }> {
    const params: Record<string, unknown> = { name };
    if (excludeId) params['exclude-id'] = excludeId;
    return apiService.get('/management/roles/check-name', params);
  },

  // Role statistics
  async getRoleStats(id: number): Promise<{
    UserCount: number;
    RecentAssignments: Array<{
      Username: string;
      AssignedAt: string;
    }>;
    Permissions?: string[];
  }> {
    return apiService.get(`/management/roles/${id}/stats`);
  },

  // System roles
  async getSystemRoles(): Promise<Role[]> {
    return apiService.get('/management/roles/system');
  },

  // Bulk operations
  async bulkDeleteRoles(roleIds: number[]): Promise<{
    Successful: number[];
    Failed: Array<{ Id: number; Error: string }>;
    Message: string;
  }> {
    return apiService.post('/management/roles/bulk/delete', { RoleIds: roleIds });
  },

  // Role hierarchy (if implemented)
  async getRoleHierarchy(): Promise<{
    Roles: Array<{
      Id: number;
      Name: string;
      Level: number;
      ParentId?: number;
      Children?: number[];
    }>;
  }> {
    return apiService.get('/management/roles/hierarchy');
  },
};