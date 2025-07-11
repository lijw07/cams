import { useQuery, useMutation, useQueryClient } from 'react-query';

import { useNotifications } from '../../contexts/NotificationContext';
import { applicationService } from '../../services/applicationService';
import { 
  Application, 
  ApplicationRequest, 
  ApplicationWithConnectionRequest 
} from '../../types';

/**
 * React Query keys for application-related queries
 * Centralized key management for consistent caching
 */
export const APPLICATION_QUERY_KEYS = {
  all: ['applications'] as const,
  lists: () => [...APPLICATION_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: any) => [...APPLICATION_QUERY_KEYS.lists(), filters] as const,
  details: () => [...APPLICATION_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...APPLICATION_QUERY_KEYS.details(), id] as const,
  connections: (id: string) => [...APPLICATION_QUERY_KEYS.detail(id), 'connections'] as const,
  health: () => [...APPLICATION_QUERY_KEYS.all, 'health'] as const,
  stats: () => [...APPLICATION_QUERY_KEYS.all, 'stats'] as const,
};

/**
 * Query hook for fetching all applications
 * Implements caching and background updates for application list
 * 
 * @param options - Additional query options
 * @returns Query result with applications data
 */
export const useApplicationsQuery = (
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) => {
  return useQuery(
    APPLICATION_QUERY_KEYS.list(),
    () => applicationService.getAllApplications(),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      select: (data) => {
        // Transform data if needed, add computed properties
        return data.map(app => ({
          ...app,
          // Add computed properties for UI
          displayName: app.Name || 'Unnamed Application',
          isHealthy: app.IsActive && !app.HasErrors,
          lastUpdatedFormatted: new Date(app.LastUpdated || app.CreatedDate).toLocaleDateString(),
        }));
      },
      ...options,
    }
  );
};

/**
 * Query hook for fetching single application details
 * Includes related data like connections and health status
 * 
 * @param applicationId - Application ID to fetch
 * @param options - Additional query options
 * @returns Query result with application details
 */
export const useApplicationQuery = (
  applicationId: string | null,
  options?: {
    enabled?: boolean;
    includeConnections?: boolean;
  }
) => {
  return useQuery(
    APPLICATION_QUERY_KEYS.detail(applicationId || ''),
    () => applicationService.getApplication(applicationId!),
    {
      enabled: !!applicationId,
      staleTime: 1 * 60 * 1000, // 1 minute
      retry: false, // Don't retry application details
      ...options,
    }
  );
};

/**
 * Query hook for fetching application connections
 * Separate query for better granular caching
 * 
 * @param applicationId - Application ID
 * @param options - Additional query options
 * @returns Query result with application connections
 */
export const useApplicationConnectionsQuery = (
  applicationId: string | null,
  options?: {
    enabled?: boolean;
  }
) => {
  return useQuery(
    APPLICATION_QUERY_KEYS.connections(applicationId || ''),
    () => applicationService.getApplicationConnections(applicationId!),
    {
      enabled: !!applicationId,
      staleTime: 1 * 60 * 1000, // 1 minute
      retry: false,
      ...options,
    }
  );
};

/**
 * Query hook for fetching application health status
 * Optimized for frequent updates with shorter cache times
 * 
 * @param options - Additional query options
 * @returns Query result with application health data
 */
export const useApplicationHealthQuery = (
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) => {
  return useQuery(
    APPLICATION_QUERY_KEYS.health(),
    () => applicationService.getApplicationHealth(),
    {
      staleTime: 30 * 1000, // 30 seconds
      cacheTime: 2 * 60 * 1000, // 2 minutes
      refetchInterval: options?.refetchInterval || 1 * 60 * 1000, // Auto-refresh every minute
      refetchOnWindowFocus: true, // Refresh when user returns to tab
      ...options,
    }
  );
};

/**
 * Mutation hook for creating new applications
 * Automatically invalidates application list and updates cache
 * 
 * @returns Mutation object with mutate function and state
 */
export const useCreateApplicationMutation = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  return useMutation(
    (applicationData: ApplicationRequest) => applicationService.createApplication(applicationData),
    {
      onSuccess: (newApplication) => {
        // Add new application to the cache
        queryClient.setQueryData(APPLICATION_QUERY_KEYS.detail(newApplication.Id), newApplication);
        
        // Invalidate application list to show new item
        queryClient.invalidateQueries(APPLICATION_QUERY_KEYS.lists());
        
        // Update health query if it exists
        queryClient.invalidateQueries(APPLICATION_QUERY_KEYS.health());
        
        addNotification({
          title: 'Application Created',
          message: `Application "${newApplication.Name}" created successfully`,
          type: 'success',
          source: 'Application Management'
        });
      },
      onError: (error: any) => {
        const message = error?.message || 'Failed to create application';
        addNotification({
          title: 'Create Application Failed',
          message: message,
          type: 'error',
          source: 'Application Management'
        });
      },
    }
  );
};

/**
 * Mutation hook for creating applications with database connections
 * Handles the complex workflow of creating app + connection in one operation
 * 
 * @returns Mutation object for combined application and connection creation
 */
export const useCreateApplicationWithConnectionMutation = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  return useMutation(
    (data: ApplicationWithConnectionRequest) => 
      applicationService.createApplicationWithConnection(data),
    {
      onSuccess: (result) => {
        // Update caches for both application and connections
        queryClient.setQueryData(APPLICATION_QUERY_KEYS.detail(result.Application.Id), result.Application);
        queryClient.setQueryData(
          APPLICATION_QUERY_KEYS.connections(result.Application.Id), 
          result.Connections
        );
        
        // Invalidate lists to show new items
        queryClient.invalidateQueries(APPLICATION_QUERY_KEYS.lists());
        queryClient.invalidateQueries(['database-connections', 'list']);
        
        addNotification({
          title: 'Application & Connection Created',
          message: `Application "${result.Application.Name}" with ${result.Connections.length} connection(s) created successfully`,
          type: 'success',
          source: 'Application Management'
        });
      },
      onError: (error: any) => {
        const message = error?.message || 'Failed to create application with connections';
        addNotification({
          title: 'Create Failed',
          message: message,
          type: 'error',
          source: 'Application Management'
        });
      },
    }
  );
};

/**
 * Mutation hook for updating existing applications
 * Optimistically updates cache and handles rollback on error
 * 
 * @returns Mutation object with mutate function and state
 */
export const useUpdateApplicationMutation = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  return useMutation(
    ({ applicationId, data }: { applicationId: string; data: ApplicationRequest }) =>
      applicationService.updateApplication(applicationId, data),
    {
      // Optimistic update
      onMutate: async ({ applicationId, data }) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries(APPLICATION_QUERY_KEYS.detail(applicationId));
        
        // Snapshot previous value
        const previousApp = queryClient.getQueryData(APPLICATION_QUERY_KEYS.detail(applicationId));
        
        // Optimistically update
        if (previousApp) {
          queryClient.setQueryData(APPLICATION_QUERY_KEYS.detail(applicationId), {
            ...previousApp,
            ...data,
          });
        }
        
        return { previousApp };
      },
      onSuccess: (updatedApplication, variables) => {
        // Update with server response
        queryClient.setQueryData(APPLICATION_QUERY_KEYS.detail(variables.applicationId), updatedApplication);
        
        // Invalidate list to reflect changes
        queryClient.invalidateQueries(APPLICATION_QUERY_KEYS.lists());
        
        addNotification({
          title: 'Application Updated',
          message: `Application "${updatedApplication.Name}" updated successfully`,
          type: 'success',
          source: 'Application Management'
        });
      },
      onError: (error: any, variables, context) => {
        // Rollback optimistic update
        if (context?.previousApp) {
          queryClient.setQueryData(APPLICATION_QUERY_KEYS.detail(variables.applicationId), context.previousApp);
        }
        
        const message = error?.message || 'Failed to update application';
        addNotification({
          title: 'Update Application Failed',
          message: message,
          type: 'error',
          source: 'Application Management'
        });
      },
    }
  );
};

/**
 * Mutation hook for deleting applications
 * Removes from cache and invalidates related queries
 * 
 * @returns Mutation object with mutate function and state
 */
export const useDeleteApplicationMutation = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  return useMutation(
    (applicationId: string) => applicationService.deleteApplication(applicationId),
    {
      onSuccess: (_, applicationId) => {
        // Remove application from cache
        queryClient.removeQueries(APPLICATION_QUERY_KEYS.detail(applicationId));
        queryClient.removeQueries(APPLICATION_QUERY_KEYS.connections(applicationId));
        
        // Invalidate lists and health
        queryClient.invalidateQueries(APPLICATION_QUERY_KEYS.lists());
        queryClient.invalidateQueries(APPLICATION_QUERY_KEYS.health());
        
        addNotification({
          title: 'Application Deleted',
          message: 'Application deleted successfully',
          type: 'success',
          source: 'Application Management'
        });
      },
      onError: (error: any) => {
        const message = error?.message || 'Failed to delete application';
        addNotification({
          title: 'Delete Application Failed',
          message: message,
          type: 'error',
          source: 'Application Management'
        });
      },
    }
  );
};

/**
 * Mutation hook for toggling application status (active/inactive)
 * Quick operation with optimistic updates
 * 
 * @returns Mutation object for status toggle operations
 */
export const useToggleApplicationStatusMutation = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  return useMutation(
    ({ applicationId, isActive }: { applicationId: string; isActive: boolean }) =>
      applicationService.toggleApplicationStatus(applicationId, isActive),
    {
      // Optimistic update
      onMutate: async ({ applicationId, isActive }) => {
        await queryClient.cancelQueries(APPLICATION_QUERY_KEYS.detail(applicationId));
        
        const previousApp = queryClient.getQueryData<Application>(APPLICATION_QUERY_KEYS.detail(applicationId));
        
        if (previousApp) {
          queryClient.setQueryData(APPLICATION_QUERY_KEYS.detail(applicationId), {
            ...previousApp,
            IsActive: isActive,
          });
        }
        
        return { previousApp };
      },
      onSuccess: (updatedApplication, variables) => {
        queryClient.setQueryData(APPLICATION_QUERY_KEYS.detail(variables.applicationId), updatedApplication);
        queryClient.invalidateQueries(APPLICATION_QUERY_KEYS.lists());
        
        const status = variables.isActive ? 'activated' : 'deactivated';
        addNotification({
          title: 'Status Updated',
          message: `Application ${status} successfully`,
          type: 'success',
          source: 'Application Management'
        });
      },
      onError: (error: any, variables, context) => {
        // Rollback
        if (context?.previousApp) {
          queryClient.setQueryData(APPLICATION_QUERY_KEYS.detail(variables.applicationId), context.previousApp);
        }
        
        const message = error?.message || 'Failed to update application status';
        addNotification({
          title: 'Status Update Failed',
          message: message,
          type: 'error',
          source: 'Application Management'
        });
      },
    }
  );
};