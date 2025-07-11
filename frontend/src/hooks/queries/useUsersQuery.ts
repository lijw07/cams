import { useQuery, useMutation, useQueryClient } from 'react-query';

import { useNotifications } from '../../contexts/NotificationContext';
import { 
  usersService, 
  UserManagement, 
  CreateUserRequest, 
  UpdateUserRequest, 
  PaginationRequest 
} from '../../services/usersService';

/**
 * React Query keys for user-related queries
 * Centralized to ensure consistency and proper cache invalidation
 */
export const USER_QUERY_KEYS = {
  all: ['users'] as const,
  lists: () => [...USER_QUERY_KEYS.all, 'list'] as const,
  list: (filters: PaginationRequest) => [...USER_QUERY_KEYS.lists(), filters] as const,
  details: () => [...USER_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...USER_QUERY_KEYS.details(), id] as const,
  stats: () => [...USER_QUERY_KEYS.all, 'stats'] as const,
};

/**
 * Query hook for fetching paginated user list
 * Implements server state management with caching, background updates, and error handling
 * 
 * @param filters - Pagination and filtering parameters
 * @param options - Additional query options
 * @returns Query result with users data, loading state, and error handling
 */
export const useUsersQuery = (
  filters: PaginationRequest,
  options?: {
    enabled?: boolean;
    refetchOnWindowFocus?: boolean;
  }
) => {
  return useQuery(
    USER_QUERY_KEYS.list(filters),
    () => usersService.getUsers(filters),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      ...options,
    }
  );
};

/**
 * Query hook for fetching single user details
 * 
 * @param userId - User ID to fetch
 * @param options - Additional query options
 * @returns Query result with user details
 */
export const useUserQuery = (
  userId: string | null,
  options?: {
    enabled?: boolean;
  }
) => {
  return useQuery(
    USER_QUERY_KEYS.detail(userId || ''),
    () => usersService.getUser(userId!),
    {
      enabled: !!userId,
      staleTime: 2 * 60 * 1000, // 2 minutes
      retry: false, // Don't retry user detail requests
      ...options,
    }
  );
};

/**
 * Mutation hook for creating new users
 * Automatically invalidates user list queries on success
 * 
 * @returns Mutation object with mutate function and state
 */
export const useCreateUserMutation = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  return useMutation(
    (userData: CreateUserRequest) => usersService.createUser(userData),
    {
      onSuccess: (newUser) => {
        // Invalidate and refetch user lists
        queryClient.invalidateQueries(USER_QUERY_KEYS.lists());
        
        // Optionally add the new user to existing cache
        queryClient.setQueryData(USER_QUERY_KEYS.detail(newUser.Id), newUser);
        
        addNotification({
          title: 'User Created',
          message: `User ${newUser.FirstName} ${newUser.LastName} created successfully`,
          type: 'success',
          source: 'User Management'
        });
      },
      onError: (error: any) => {
        const message = error?.message || 'Failed to create user';
        addNotification({
          title: 'Create User Failed',
          message: message,
          type: 'error',
          source: 'User Management'
        });
      },
    }
  );
};

/**
 * Mutation hook for updating existing users
 * Automatically updates cache and invalidates related queries
 * 
 * @returns Mutation object with mutate function and state
 */
export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  return useMutation(
    ({ userId, userData }: { userId: string; userData: UpdateUserRequest }) =>
      usersService.updateUser(userId, userData),
    {
      onSuccess: (updatedUser, variables) => {
        // Update the specific user in cache
        queryClient.setQueryData(USER_QUERY_KEYS.detail(variables.userId), updatedUser);
        
        // Invalidate user lists to reflect changes
        queryClient.invalidateQueries(USER_QUERY_KEYS.lists());
        
        addNotification({
          title: 'User Updated',
          message: `User ${updatedUser.FirstName} ${updatedUser.LastName} updated successfully`,
          type: 'success',
          source: 'User Management'
        });
      },
      onError: (error: any) => {
        const message = error?.message || 'Failed to update user';
        addNotification({
          title: 'Update User Failed',
          message: message,
          type: 'error',
          source: 'User Management'
        });
      },
    }
  );
};

/**
 * Mutation hook for deleting users
 * Automatically removes from cache and invalidates queries
 * 
 * @returns Mutation object with mutate function and state
 */
export const useDeleteUserMutation = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  return useMutation(
    (userId: string) => usersService.deleteUser(userId),
    {
      onSuccess: (_, userId) => {
        // Remove the user from cache
        queryClient.removeQueries(USER_QUERY_KEYS.detail(userId));
        
        // Invalidate user lists
        queryClient.invalidateQueries(USER_QUERY_KEYS.lists());
        
        addNotification({
          title: 'User Deleted',
          message: 'User deleted successfully',
          type: 'success',
          source: 'User Management'
        });
      },
      onError: (error: any) => {
        const message = error?.message || 'Failed to delete user';
        addNotification({
          title: 'Delete User Failed',
          message: message,
          type: 'error',
          source: 'User Management'
        });
      },
    }
  );
};

/**
 * Mutation hook for bulk user operations
 * Handles multiple user operations efficiently
 * 
 * @returns Mutation object for bulk operations
 */
export const useBulkUserMutation = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  return useMutation(
    ({ operation, userIds }: { operation: 'delete' | 'activate' | 'deactivate'; userIds: string[] }) => {
      switch (operation) {
        case 'delete':
          return usersService.bulkDeleteUsers(userIds);
        case 'activate':
          return usersService.bulkToggleUserStatus(userIds, true);
        case 'deactivate':
          return usersService.bulkToggleUserStatus(userIds, false);
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    },
    {
      onSuccess: (_, variables) => {
        // Invalidate all user queries to reflect bulk changes
        queryClient.invalidateQueries(USER_QUERY_KEYS.all);
        
        const operationText = variables.operation === 'delete' ? 'deleted' : 
                              variables.operation === 'activate' ? 'activated' : 'deactivated';
        
        addNotification({
          title: 'Bulk Operation Complete',
          message: `${variables.userIds.length} users ${operationText} successfully`,
          type: 'success',
          source: 'User Management'
        });
      },
      onError: (error: any) => {
        const message = error?.message || 'Bulk operation failed';
        addNotification({
          title: 'Bulk Operation Failed',
          message: message,
          type: 'error',
          source: 'User Management'
        });
      },
    }
  );
};