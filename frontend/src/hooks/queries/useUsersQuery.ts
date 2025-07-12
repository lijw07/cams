import { useQuery, useMutation, useQueryClient } from 'react-query';

import { useNotifications } from '../../contexts/NotificationContext';
import { 
  usersService, 
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
      onSuccess: (newUser, userData) => {
        // Invalidate and refetch user lists
        queryClient.invalidateQueries(USER_QUERY_KEYS.lists());
        
        // Optionally add the new user to existing cache
        queryClient.setQueryData(USER_QUERY_KEYS.detail(newUser.Id), newUser);
        
        addNotification({
          title: 'User Created Successfully',
          message: `${newUser.FirstName} ${newUser.LastName} has been created successfully`,
          type: 'success',
          source: 'User Management',
          details: `User "${newUser.Username}" (${newUser.FirstName} ${newUser.LastName}) has been created with email ${newUser.Email}. The user is ${newUser.IsActive ? 'active' : 'inactive'}.`,
          suggestions: [
            'Notify the user of their new account credentials',
            'Assign appropriate roles and permissions',
            'Add the user to relevant groups or teams',
            'Monitor user activity in the system logs'
          ]
        });
      },
      onError: (error: any, userData) => {
        // Extract error code from the error response
        let errorCode = 'UNKNOWN_ERROR';
        let errorMessage = 'Failed to create user';
        
        if (error && typeof error === 'object' && 'response' in error) {
          const response = error.response;
          if (response?.data?.ErrorCode) {
            errorCode = response.data.ErrorCode;
          } else if (response?.status) {
            errorCode = `HTTP_${response.status}`;
          }
          
          if (response?.data?.Message) {
            errorMessage = response.data.Message;
          } else if (error.message) {
            errorMessage = error.message;
          }
        } else if (error?.message) {
          errorMessage = error.message;
          errorCode = 'CLIENT_ERROR';
        }
        
        addNotification({
          title: `User Creation Failed (${errorCode})`,
          message: errorMessage,
          type: 'error',
          source: 'User Management',
          details: `Failed to create user "${userData.Username}" with error code: ${errorCode}.`,
          technical: `Error Code: ${errorCode}\nError Message: ${errorMessage}\nOperation: Create User\nUsername: ${userData.Username}\nEmail: ${userData.Email}`,
          suggestions: [
            'Verify that all required fields are filled correctly',
            'Check that the username and email are unique',
            'Ensure password meets security requirements',
            'Verify that you have permission to create users',
            'Try again in a few moments',
            'Contact your system administrator if the problem persists'
          ]
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
          title: 'User Updated Successfully',
          message: `${updatedUser.FirstName} ${updatedUser.LastName} has been updated successfully`,
          type: 'success',
          source: 'User Management',
          details: `User "${updatedUser.Username}" (${updatedUser.FirstName} ${updatedUser.LastName}) has been updated. The user is ${updatedUser.IsActive ? 'active' : 'inactive'}.`,
          suggestions: [
            'Inform the user of any changes to their account',
            'Review user permissions and role assignments',
            'Monitor user activity for any issues',
            'Update related documentation if needed'
          ]
        });
      },
      onError: (error: any, variables) => {
        // Extract error code from the error response
        let errorCode = 'UNKNOWN_ERROR';
        let errorMessage = 'Failed to update user';
        
        if (error && typeof error === 'object' && 'response' in error) {
          const response = error.response;
          if (response?.data?.ErrorCode) {
            errorCode = response.data.ErrorCode;
          } else if (response?.status) {
            errorCode = `HTTP_${response.status}`;
          }
          
          if (response?.data?.Message) {
            errorMessage = response.data.Message;
          } else if (error.message) {
            errorMessage = error.message;
          }
        } else if (error?.message) {
          errorMessage = error.message;
          errorCode = 'CLIENT_ERROR';
        }
        
        addNotification({
          title: `User Update Failed (${errorCode})`,
          message: errorMessage,
          type: 'error',
          source: 'User Management',
          details: `Failed to update user "${variables.userData.Username || variables.userId}" with error code: ${errorCode}.`,
          technical: `Error Code: ${errorCode}\nError Message: ${errorMessage}\nOperation: Update User\nUser ID: ${variables.userId}\nUsername: ${variables.userData.Username || 'N/A'}\nEmail: ${variables.userData.Email || 'N/A'}`,
          suggestions: [
            'Verify that all required fields are filled correctly',
            'Check that the username and email are unique (if changed)',
            'Ensure you have permission to edit this user',
            'Verify the user exists and is not locked',
            'Try again in a few moments',
            'Contact your system administrator if the problem persists'
          ]
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
      onSuccess: (deletedUser, userId) => {
        // Remove the user from cache
        queryClient.removeQueries(USER_QUERY_KEYS.detail(userId));
        
        // Invalidate user lists
        queryClient.invalidateQueries(USER_QUERY_KEYS.lists());
        
        const userName = deletedUser?.Username || deletedUser?.FirstName || 'User';
        addNotification({
          title: 'User Deleted Successfully',
          message: `${userName} has been deleted successfully`,
          type: 'success',
          source: 'User Management',
          details: `User "${userName}" has been permanently removed from the system. This action cannot be undone.`,
          suggestions: [
            'Verify that all user data has been properly archived',
            'Update any related documentation or team structures',
            'Review permissions for any shared resources',
            'Monitor for any system dependencies that may be affected'
          ]
        });
      },
      onError: (error: any, userId) => {
        // Extract error code from the error response
        let errorCode = 'UNKNOWN_ERROR';
        let errorMessage = 'Failed to delete user';
        
        if (error && typeof error === 'object' && 'response' in error) {
          const response = error.response;
          if (response?.data?.ErrorCode) {
            errorCode = response.data.ErrorCode;
          } else if (response?.status) {
            errorCode = `HTTP_${response.status}`;
          }
          
          if (response?.data?.Message) {
            errorMessage = response.data.Message;
          } else if (error.message) {
            errorMessage = error.message;
          }
        } else if (error?.message) {
          errorMessage = error.message;
          errorCode = 'CLIENT_ERROR';
        }
        
        addNotification({
          title: `User Deletion Failed (${errorCode})`,
          message: errorMessage,
          type: 'error',
          source: 'User Management',
          details: `Failed to delete user with ID "${userId}" with error code: ${errorCode}.`,
          technical: `Error Code: ${errorCode}\nError Message: ${errorMessage}\nOperation: Delete User\nUser ID: ${userId}`,
          suggestions: [
            'Verify that you have permission to delete users',
            'Check if the user has any dependencies that prevent deletion',
            'Ensure the user is not currently logged in or active',
            'Try again in a few moments',
            'Contact your system administrator if the problem persists'
          ]
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
      onSuccess: (result, variables) => {
        // Invalidate all user queries to reflect bulk changes
        queryClient.invalidateQueries(USER_QUERY_KEYS.all);
        
        const operationText = variables.operation === 'delete' ? 'deleted' : 
                              variables.operation === 'activate' ? 'activated' : 'deactivated';
        
        addNotification({
          title: 'Bulk Operation Completed Successfully',
          message: `${variables.userIds.length} users ${operationText} successfully`,
          type: 'success',
          source: 'User Management',
          details: `Bulk ${variables.operation} operation completed for ${variables.userIds.length} user(s). All selected users have been ${operationText}.`,
          suggestions: [
            variables.operation === 'delete' ? 'Verify that all user data has been properly archived' : 'Review the updated user statuses',
            'Update any related documentation or processes',
            'Monitor for any system dependencies that may be affected',
            variables.operation !== 'delete' ? 'Inform affected users of their status change' : 'Update team structures as needed'
          ]
        });
      },
      onError: (error: any, variables) => {
        // Extract error code from the error response
        let errorCode = 'UNKNOWN_ERROR';
        let errorMessage = 'Bulk operation failed';
        
        if (error && typeof error === 'object' && 'response' in error) {
          const response = error.response;
          if (response?.data?.ErrorCode) {
            errorCode = response.data.ErrorCode;
          } else if (response?.status) {
            errorCode = `HTTP_${response.status}`;
          }
          
          if (response?.data?.Message) {
            errorMessage = response.data.Message;
          } else if (error.message) {
            errorMessage = error.message;
          }
        } else if (error?.message) {
          errorMessage = error.message;
          errorCode = 'CLIENT_ERROR';
        }
        
        addNotification({
          title: `Bulk ${variables.operation.charAt(0).toUpperCase() + variables.operation.slice(1)} Failed (${errorCode})`,
          message: errorMessage,
          type: 'error',
          source: 'User Management',
          details: `Failed to ${variables.operation} ${variables.userIds.length} user(s) with error code: ${errorCode}.`,
          technical: `Error Code: ${errorCode}\nError Message: ${errorMessage}\nOperation: Bulk ${variables.operation}\nUser Count: ${variables.userIds.length}\nUser IDs: ${variables.userIds.join(', ')}`,
          suggestions: [
            'Verify that you have permission to perform bulk operations',
            'Check if some users have dependencies that prevent the operation',
            'Try the operation with a smaller batch of users',
            'Ensure none of the selected users are currently active (for deletion)',
            'Try again in a few moments',
            'Contact your system administrator if the problem persists'
          ]
        });
      },
    }
  );
};