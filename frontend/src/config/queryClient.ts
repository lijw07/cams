import { QueryClient, QueryClientConfig } from 'react-query';

import { env } from './environment';

/**
 * React Query configuration optimized for CAMS application
 * Implements CLAUDE.md requirements for state management with proper caching,
 * error handling, and performance optimization
 */

/**
 * Default query configuration based on environment and best practices
 */
const defaultQueryConfig: QueryClientConfig['defaultOptions'] = {
  queries: {
    // Retry configuration
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (client errors)
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      // Retry up to 3 times for server errors
      return failureCount < 3;
    },
    
    // Cache configuration
    staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
    cacheTime: 10 * 60 * 1000, // 10 minutes - cache retention
    
    // Refetch behavior
    refetchOnWindowFocus: false, // Prevent excessive refetching
    refetchOnReconnect: true, // Refetch when network reconnects
    refetchOnMount: true, // Refetch when component mounts
    
    // Error handling
    useErrorBoundary: false, // Handle errors in components, not error boundaries
    
    // Performance optimization
    notifyOnChangeProps: 'tracked', // Only re-render when tracked props change
  },
  
  mutations: {
    // Retry configuration for mutations
    retry: (failureCount, error: any) => {
      // Don't retry mutations on client errors
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      // Only retry once for server errors
      return failureCount < 1;
    },
    
    // Error handling
    useErrorBoundary: false,
  },
};

/**
 * Environment-specific query configuration overrides
 */
const getEnvironmentConfig = (): Partial<QueryClientConfig['defaultOptions']> => {
  if (env.app.isDevelopment) {
    return {
      queries: {
        // Shorter cache times in development for faster feedback
        staleTime: 1 * 60 * 1000, // 1 minute
        cacheTime: 5 * 60 * 1000, // 5 minutes
        // Enable debugging features
        refetchOnWindowFocus: true,
      },
    };
  }
  
  if (env.app.isProduction) {
    return {
      queries: {
        // Longer cache times in production for better performance
        staleTime: 10 * 60 * 1000, // 10 minutes
        cacheTime: 30 * 60 * 1000, // 30 minutes
        // Conservative refetch settings
        refetchOnWindowFocus: false,
        refetchOnMount: false, // Only refetch if data is stale
      },
    };
  }
  
  // Staging environment
  return {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 15 * 60 * 1000, // 15 minutes
    },
  };
};

/**
 * Create and configure the React Query client
 * Merges default configuration with environment-specific overrides
 * 
 * @returns Configured QueryClient instance
 */
export const createQueryClient = (): QueryClient => {
  const envConfig = getEnvironmentConfig();
  
  const config: QueryClientConfig = {
    defaultOptions: {
      queries: {
        ...defaultQueryConfig.queries,
        ...envConfig.queries,
      },
      mutations: {
        ...defaultQueryConfig.mutations,
        ...envConfig.mutations,
      },
    },
  };
  
  const queryClient = new QueryClient(config);
  
  // Set up global error handling
  queryClient.setQueryDefaults(['*'], {
    onError: (error: any) => {
      // Global error logging
      if (env.app.isDevelopment) {
        console.error('Query Error:', error);
      }
      
      // TODO: Send to monitoring service in production
      if (env.app.isProduction && env.monitoring.sentryDsn) {
        // Sentry.captureException(error);
      }
    },
  });
  
  queryClient.setMutationDefaults(['*'], {
    onError: (error: any) => {
      // Global mutation error logging
      if (env.app.isDevelopment) {
        console.error('Mutation Error:', error);
      }
      
      // TODO: Send to monitoring service in production
      if (env.app.isProduction && env.monitoring.sentryDsn) {
        // Sentry.captureException(error);
      }
    },
  });
  
  return queryClient;
};

/**
 * Query client instance for use throughout the application
 * This is the main query client that should be used in the QueryClientProvider
 */
export const queryClient = createQueryClient();

/**
 * Query key factory for consistent cache key generation
 * Helps prevent cache key conflicts and enables better invalidation patterns
 */
export const createQueryKey = {
  /**
   * Create a base query key for a resource type
   * @param resource - Resource name (e.g., 'users', 'applications')
   * @returns Base query key array
   */
  base: (resource: string) => [resource] as const,
  
  /**
   * Create a list query key with optional filters
   * @param resource - Resource name
   * @param filters - Optional filter parameters
   * @returns List query key array
   */
  list: (resource: string, filters?: any) => [resource, 'list', filters] as const,
  
  /**
   * Create a detail query key for a specific item
   * @param resource - Resource name
   * @param id - Item identifier
   * @returns Detail query key array
   */
  detail: (resource: string, id: string | number) => [resource, 'detail', id] as const,
  
  /**
   * Create a nested resource query key
   * @param parentResource - Parent resource name
   * @param parentId - Parent resource ID
   * @param childResource - Child resource name
   * @param childFilters - Optional child filters
   * @returns Nested query key array
   */
  nested: (
    parentResource: string, 
    parentId: string | number, 
    childResource: string, 
    childFilters?: any
  ) => [parentResource, 'detail', parentId, childResource, childFilters] as const,
};

/**
 * Utility functions for query client management
 */
export const queryUtils = {
  /**
   * Invalidate all queries for a specific resource
   * @param resource - Resource name to invalidate
   */
  invalidateResource: (resource: string) => {
    queryClient.invalidateQueries([resource]);
  },
  
  /**
   * Remove all cached data for a specific resource
   * @param resource - Resource name to clear
   */
  clearResource: (resource: string) => {
    queryClient.removeQueries([resource]);
  },
  
  /**
   * Prefetch data for better user experience
   * @param queryKey - Query key to prefetch
   * @param queryFn - Query function
   * @param staleTime - Optional stale time override
   */
  prefetchQuery: async (
    queryKey: any[], 
    queryFn: () => Promise<any>, 
    staleTime?: number
  ) => {
    await queryClient.prefetchQuery(queryKey, queryFn, {
      staleTime: staleTime || 5 * 60 * 1000,
    });
  },
  
  /**
   * Get cached data without triggering a fetch
   * @param queryKey - Query key to lookup
   * @returns Cached data or undefined
   */
  getCachedData: <T = any>(queryKey: any[]): T | undefined => {
    return queryClient.getQueryData<T>(queryKey);
  },
  
  /**
   * Set cached data manually
   * @param queryKey - Query key to set
   * @param data - Data to cache
   * @param updater - Optional updater function
   */
  setCachedData: <T = any>(
    queryKey: any[], 
    data: T | ((oldData: T | undefined) => T)
  ) => {
    queryClient.setQueryData<T>(queryKey, data);
  },
};

/**
 * Development tools for debugging queries
 * Only available in development mode
 */
export const devQueryUtils = env.app.isDevelopment ? {
  /**
   * Log all active queries and their status
   */
  logActiveQueries: () => {
    const queries = queryClient.getQueryCache().getAll();
    console.table(queries.map(query => ({
      queryKey: JSON.stringify(query.queryKey),
      state: query.state.status,
      dataUpdatedAt: new Date(query.state.dataUpdatedAt).toLocaleTimeString(),
      isStale: query.isStale(),
      observers: query.getObserversCount(),
    })));
  },
  
  /**
   * Clear all cached queries (useful for debugging)
   */
  clearAllCache: () => {
    queryClient.clear();
    console.log('All query cache cleared');
  },
  
  /**
   * Get query cache statistics
   */
  getCacheStats: () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    return {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.getObserversCount() > 0).length,
      staleQueries: queries.filter(q => q.isStale()).length,
      fetchingQueries: queries.filter(q => q.isFetching()).length,
    };
  },
} : undefined;