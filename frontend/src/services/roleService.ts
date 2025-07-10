import { apiService } from './api';

export interface Role {
  id: number;
  name: string;
  description?: string;
  isSystem: boolean;
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
}

export interface UpdateRoleRequest {
  id: number;
  name: string;
  description?: string;
}

export interface UserRoleInfo {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  assignedAt: string;
  assignedBy: string;
}

export const roleService = {
  // Role CRUD operations
  async getRoles(): Promise<Role[]> {
    return apiService.get('/management/roles');
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

  // Role-User management
  async getRoleUsers(id: number): Promise<UserRoleInfo[]> {
    return apiService.get(`/management/roles/${id}/users`);
  },

  async assignUsersToRole(roleId: number, userIds: number[]): Promise<{ message: string }> {
    return apiService.post(`/management/roles/${roleId}/assign-users`, { userIds });
  },

  async removeUsersFromRole(roleId: number, userIds: number[]): Promise<{ message: string }> {
    return apiService.post(`/management/roles/${roleId}/remove-users`, { userIds });
  },

  // Role validation
  async checkRoleNameAvailability(name: string, excludeId?: number): Promise<{
    isAvailable: boolean;
    message: string;
  }> {
    const params = excludeId ? { name, excludeId } : { name };
    return apiService.get('/management/roles/check-name', params);
  },

  // Role statistics
  async getRoleStats(id: number): Promise<{
    userCount: number;
    recentAssignments: Array<{
      username: string;
      assignedAt: string;
    }>;
    permissions?: string[];
  }> {
    return apiService.get(`/management/roles/${id}/stats`);
  },

  // System roles
  async getSystemRoles(): Promise<Role[]> {
    return apiService.get('/management/roles/system');
  },

  // Bulk operations
  async bulkDeleteRoles(roleIds: number[]): Promise<{
    successful: number[];
    failed: Array<{ id: number; error: string }>;
    message: string;
  }> {
    return apiService.post('/management/roles/bulk/delete', { roleIds });
  },

  // Role hierarchy (if implemented)
  async getRoleHierarchy(): Promise<{
    roles: Array<{
      id: number;
      name: string;
      level: number;
      parentId?: number;
      children?: number[];
    }>;
  }> {
    return apiService.get('/management/roles/hierarchy');
  },
};