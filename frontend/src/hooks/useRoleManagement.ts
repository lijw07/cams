import { useState, useEffect } from 'react';
import { roleService, Role, CreateRoleRequest, UpdateRoleRequest, PaginationRequest } from '../services/roleService';
import { useNotifications } from '../contexts/NotificationContext';

export const useRoleManagement = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const { addNotification } = useNotifications();

  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 20,
    totalItems: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  });

  const [filters, setFilters] = useState({
    sortBy: 'name',
    sortDirection: 'asc' as 'asc' | 'desc',
  });

  const loadRoles = async () => {
    try {
      setLoading(true);
      const request: PaginationRequest = {
        PageNumber: pagination.currentPage,
        PageSize: pagination.perPage,
        SortBy: filters.sortBy,
        SortDirection: filters.sortDirection,
        SearchTerm: searchTerm || undefined,
      };

      const response = await roleService.getRoles(request);
      setRoles(response.Data || []);
      setPagination({
        currentPage: response.Pagination.CurrentPage,
        perPage: response.Pagination.PerPage,
        totalItems: response.Pagination.TotalItems,
        totalPages: response.Pagination.TotalPages,
        hasNext: response.Pagination.HasNext,
        hasPrevious: response.Pagination.HasPrevious,
      });
    } catch (error) {
      console.error('Error loading roles:', error);
      addNotification({ 
        title: 'Error', 
        message: 'Failed to load roles', 
        type: 'error', 
        source: 'RoleManagement' 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, [pagination.currentPage, pagination.perPage, filters, searchTerm]);

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination(prev => ({ 
      ...prev, 
      perPage: newPageSize, 
      currentPage: 1
    }));
  };

  const createRole = async (data: CreateRoleRequest) => {
    try {
      await roleService.createRole(data);
      addNotification({ 
        title: 'Success', 
        message: 'Role created successfully', 
        type: 'success', 
        source: 'RoleManagement' 
      });
      await loadRoles();
    } catch (error) {
      addNotification({ 
        title: 'Error', 
        message: 'Failed to create role', 
        type: 'error', 
        source: 'RoleManagement' 
      });
      throw error;
    }
  };

  const updateRole = async (data: UpdateRoleRequest) => {
    try {
      await roleService.updateRole(data);
      addNotification({ 
        title: 'Success', 
        message: 'Role updated successfully', 
        type: 'success', 
        source: 'RoleManagement' 
      });
      await loadRoles();
    } catch (error) {
      addNotification({ 
        title: 'Error', 
        message: 'Failed to update role', 
        type: 'error', 
        source: 'RoleManagement' 
      });
      throw error;
    }
  };

  const deleteRole = async (id: string) => {
    try {
      await roleService.deleteRole(id);
      addNotification({ 
        title: 'Success', 
        message: 'Role deleted successfully', 
        type: 'success', 
        source: 'RoleManagement' 
      });
      await loadRoles();
    } catch (error) {
      addNotification({ 
        title: 'Error', 
        message: 'Failed to delete role', 
        type: 'error', 
        source: 'RoleManagement' 
      });
    }
  };

  const toggleRoleStatus = async (id: string, isActive: boolean) => {
    try {
      await roleService.toggleRoleStatus(id, isActive);
      addNotification({ 
        title: 'Success', 
        message: `Role ${isActive ? 'activated' : 'deactivated'} successfully`, 
        type: 'success', 
        source: 'RoleManagement' 
      });
      await loadRoles();
    } catch (error) {
      addNotification({ 
        title: 'Error', 
        message: 'Failed to toggle role status', 
        type: 'error', 
        source: 'RoleManagement' 
      });
    }
  };

  return {
    roles,
    loading,
    searchTerm,
    setSearchTerm,
    selectedRoles,
    setSelectedRoles,
    pagination,
    filters,
    setFilters,
    handlePageChange,
    handlePageSizeChange,
    createRole,
    updateRole,
    deleteRole,
    toggleRoleStatus,
    loadRoles
  };
};