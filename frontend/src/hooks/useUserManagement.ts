import { useState, useEffect } from 'react';

import { useNotifications } from '../contexts/NotificationContext';
import { usersService, UserManagement, CreateUserRequest, UpdateUserRequest, PaginationRequest } from '../services/usersService';

export const useUserManagement = () => {
  const [users, setUsers] = useState<UserManagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
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
    isActive: undefined as boolean | undefined,
    sortBy: 'createdAt',
    sortDirection: 'desc' as 'asc' | 'desc',
  });

  const loadUsers = async () => {
    try {
      setLoading(true);
      const request: PaginationRequest = {
        PageNumber: pagination.currentPage,
        PageSize: pagination.perPage,
        SortBy: filters.sortBy,
        SortDirection: filters.sortDirection,
        SearchTerm: searchTerm || undefined,
      };

      const response = await usersService.getUsers(request);
      setUsers(response.Data || []);
      setPagination({
        currentPage: response.Pagination.CurrentPage,
        perPage: response.Pagination.PerPage,
        totalItems: response.Pagination.TotalItems,
        totalPages: response.Pagination.TotalPages,
        hasNext: response.Pagination.HasNext,
        hasPrevious: response.Pagination.HasPrevious,
      });
    } catch (error) {
      console.error('Error loading users:', error);
      addNotification({ 
        title: 'Error', 
        message: 'Failed to load users', 
        type: 'error', 
        source: 'UserManagement' 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
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

  const createUser = async (data: CreateUserRequest) => {
    try {
      await usersService.createUser(data);
      addNotification({ 
        title: 'Success', 
        message: 'User created successfully', 
        type: 'success', 
        source: 'UserManagement' 
      });
      await loadUsers();
    } catch (error) {
      addNotification({ 
        title: 'Error', 
        message: 'Failed to create user', 
        type: 'error', 
        source: 'UserManagement' 
      });
      throw error;
    }
  };

  const updateUser = async (data: UpdateUserRequest) => {
    try {
      await usersService.updateUser(data.Id, data);
      addNotification({ 
        title: 'Success', 
        message: 'User updated successfully', 
        type: 'success', 
        source: 'UserManagement' 
      });
      await loadUsers();
    } catch (error) {
      addNotification({ 
        title: 'Error', 
        message: 'Failed to update user', 
        type: 'error', 
        source: 'UserManagement' 
      });
      throw error;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await usersService.deleteUser(id);
      addNotification({ 
        title: 'Success', 
        message: 'User deleted successfully', 
        type: 'success', 
        source: 'UserManagement' 
      });
      await loadUsers();
    } catch (error) {
      addNotification({ 
        title: 'Error', 
        message: 'Failed to delete user', 
        type: 'error', 
        source: 'UserManagement' 
      });
    }
  };

  const toggleUserStatus = async (id: string, isActive: boolean) => {
    try {
      await usersService.toggleUserStatus(id, isActive);
      addNotification({ 
        title: 'Success', 
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`, 
        type: 'success', 
        source: 'UserManagement' 
      });
      await loadUsers();
    } catch (error) {
      addNotification({ 
        title: 'Error', 
        message: 'Failed to toggle user status', 
        type: 'error', 
        source: 'UserManagement' 
      });
    }
  };

  return {
    users,
    loading,
    searchTerm,
    setSearchTerm,
    selectedUsers,
    setSelectedUsers,
    pagination,
    filters,
    setFilters,
    handlePageChange,
    handlePageSizeChange,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    loadUsers
  };
};