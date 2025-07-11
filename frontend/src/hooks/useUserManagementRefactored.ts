import { useState, useMemo } from 'react';

import { PaginationRequest } from '../services/usersService';

import { 
  useUsersQuery, 
  useCreateUserMutation, 
  useUpdateUserMutation, 
  useDeleteUserMutation,
  useBulkUserMutation 
} from './queries';

/**
 * Refactored User Management Hook using React Query
 * Replaces the old useState/useEffect pattern with declarative server state management
 * 
 * Benefits:
 * - Automatic caching and background updates
 * - Optimistic updates for better UX
 * - Built-in loading and error states
 * - Automatic retry logic
 * - Cache invalidation on mutations
 */
export const useUserManagementRefactored = () => {
  // Local UI state (not server state)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  const [filters, setFilters] = useState({
    isActive: undefined as boolean | undefined,
    sortBy: 'createdAt',
    sortDirection: 'desc' as 'asc' | 'desc',
  });

  // Build query parameters
  const queryParams: PaginationRequest = useMemo(() => ({
    page: currentPage,
    pageSize,
    search: searchTerm,
    isActive: filters.isActive,
    sortBy: filters.sortBy,
    sortDirection: filters.sortDirection,
  }), [currentPage, pageSize, searchTerm, filters]);

  // Server state queries
  const {
    data: usersResponse,
    isLoading,
    error,
    refetch,
    isFetching,
    isStale,
  } = useUsersQuery(queryParams, {
    // Enable real-time updates when component is visible
    refetchOnWindowFocus: true,
  });

  // Mutations
  const createUserMutation = useCreateUserMutation();
  const updateUserMutation = useUpdateUserMutation();
  const deleteUserMutation = useDeleteUserMutation();
  const bulkUserMutation = useBulkUserMutation();

  // Derived state from server data
  const users = usersResponse?.data || [];
  const totalCount = usersResponse?.totalCount || 0;
  const pagination = useMemo(() => ({
    currentPage,
    perPage: pageSize,
    totalItems: totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    hasNext: currentPage < Math.ceil(totalCount / pageSize),
    hasPrevious: currentPage > 1,
  }), [currentPage, pageSize, totalCount]);

  // Action handlers
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page on search
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.Id));
    }
  };

  const handleClearSelection = () => {
    setSelectedUsers([]);
  };

  // Mutation handlers with automatic cache updates
  const createUser = async (userData: any) => {
    await createUserMutation.mutateAsync(userData);
    handleClearSelection();
  };

  const updateUser = async (userId: string, userData: any) => {
    await updateUserMutation.mutateAsync({ userId, userData });
  };

  const deleteUser = async (userId: string) => {
    await deleteUserMutation.mutateAsync(userId);
    setSelectedUsers(prev => prev.filter(id => id !== userId));
  };

  const bulkDeleteUsers = async (userIds: string[]) => {
    await bulkUserMutation.mutateAsync({ operation: 'delete', userIds });
    handleClearSelection();
  };

  const bulkToggleStatus = async (userIds: string[], isActive: boolean) => {
    const operation = isActive ? 'activate' : 'deactivate';
    await bulkUserMutation.mutateAsync({ operation, userIds });
    handleClearSelection();
  };

  // Loading states
  const isCreating = createUserMutation.isLoading;
  const isUpdating = updateUserMutation.isLoading;
  const isDeleting = deleteUserMutation.isLoading;
  const isBulkOperating = bulkUserMutation.isLoading;

  // Error states
  const hasError = !!error;
  const createError = createUserMutation.error;
  const updateError = updateUserMutation.error;
  const deleteError = deleteUserMutation.error;
  const bulkError = bulkUserMutation.error;

  return {
    // Data
    users,
    totalCount,
    pagination,
    
    // UI State
    searchTerm,
    selectedUsers,
    filters,
    
    // Loading States
    loading: isLoading,
    refreshing: isFetching && !isLoading,
    isStale,
    isCreating,
    isUpdating,
    isDeleting,
    isBulkOperating,
    
    // Error States
    error,
    hasError,
    createError,
    updateError,
    deleteError,
    bulkError,
    
    // Actions
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    handleFilterChange,
    handleSelectUser,
    handleSelectAllUsers,
    handleClearSelection,
    refetch,
    
    // Mutations
    createUser,
    updateUser,
    deleteUser,
    bulkDeleteUsers,
    bulkToggleStatus,
    
    // Computed Properties
    hasSelectedUsers: selectedUsers.length > 0,
    isAllUsersSelected: selectedUsers.length === users.length && users.length > 0,
    selectedCount: selectedUsers.length,
    isAnyLoading: isLoading || isCreating || isUpdating || isDeleting || isBulkOperating,
  };
};

/**
 * Lightweight hook for user selection management
 * Can be used independently when you only need selection logic
 */
export const useUserSelection = (users: any[] = []) => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.Id));
    }
  };

  const handleClearSelection = () => {
    setSelectedUsers([]);
  };

  return {
    selectedUsers,
    handleSelectUser,
    handleSelectAllUsers,
    handleClearSelection,
    hasSelectedUsers: selectedUsers.length > 0,
    isAllUsersSelected: selectedUsers.length === users.length && users.length > 0,
    selectedCount: selectedUsers.length,
  };
};