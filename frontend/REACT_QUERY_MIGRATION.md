# React Query Migration Guide

This guide explains how to migrate from manual useState/useEffect server state management to React Query for better performance, caching, and developer experience.

## Why Migrate to React Query?

### Problems with Manual State Management
```typescript
// ❌ BEFORE - Manual state management
const useUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await usersService.getUsers();
        setUsers(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Manual refetch logic, no caching, no background updates
  const refetch = () => {
    fetchUsers();
  };

  return { users, loading, error, refetch };
};
```

**Issues:**
- No caching between components
- No background updates
- Manual loading/error state management
- No retry logic
- Race conditions
- Stale data problems
- Duplicate requests

### Benefits with React Query
```typescript
// ✅ AFTER - React Query
const useUsersQuery = (filters) => {
  return useQuery(
    ['users', filters],
    () => usersService.getUsers(filters),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    }
  );
};
```

**Benefits:**
- ✅ Automatic caching
- ✅ Background updates
- ✅ Built-in loading/error states
- ✅ Automatic retry logic
- ✅ Request deduplication
- ✅ Optimistic updates
- ✅ Cache invalidation
- ✅ Offline support

## Migration Steps

### Step 1: Identify Server State vs UI State

**Server State** (should use React Query):
- User lists
- Application data
- Log entries
- Settings from API
- Any data fetched from backend

**UI State** (keep with useState):
- Modal open/closed
- Form input values
- Selected items
- Search terms
- Filter selections

### Step 2: Create Query Hooks

#### Before: Manual Hook
```typescript
const useApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchApps = async () => {
      setLoading(true);
      const data = await applicationService.getAll();
      setApplications(data);
      setLoading(false);
    };
    fetchApps();
  }, []);
  
  return { applications, loading };
};
```

#### After: React Query Hook
```typescript
export const useApplicationsQuery = (options = {}) => {
  return useQuery(
    APPLICATION_QUERY_KEYS.list(),
    () => applicationService.getAllApplications(),
    {
      staleTime: 2 * 60 * 1000,
      cacheTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      ...options,
    }
  );
};
```

### Step 3: Create Mutation Hooks

#### Before: Manual Mutations
```typescript
const createApplication = async (data) => {
  try {
    setLoading(true);
    const newApp = await applicationService.create(data);
    setApplications(prev => [...prev, newApp]);
    // Manual notification
    addNotification({ message: 'Created successfully' });
  } catch (error) {
    setError(error);
  } finally {
    setLoading(false);
  }
};
```

#### After: React Query Mutations
```typescript
export const useCreateApplicationMutation = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  return useMutation(
    (data) => applicationService.createApplication(data),
    {
      onSuccess: (newApp) => {
        // Automatic cache update
        queryClient.invalidateQueries(APPLICATION_QUERY_KEYS.lists());
        queryClient.setQueryData(APPLICATION_QUERY_KEYS.detail(newApp.Id), newApp);
        
        addNotification({
          title: 'Success',
          message: 'Application created successfully',
          type: 'success'
        });
      },
      onError: (error) => {
        addNotification({
          title: 'Error',
          message: error.message,
          type: 'error'
        });
      },
    }
  );
};
```

### Step 4: Update Components

#### Before: Direct Hook Usage
```typescript
const ApplicationList = () => {
  const { applications, loading, error } = useApplications();
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div>
      {applications.map(app => (
        <ApplicationCard key={app.id} application={app} />
      ))}
    </div>
  );
};
```

#### After: React Query Usage
```typescript
const ApplicationList = () => {
  const { 
    data: applications = [], 
    isLoading, 
    error,
    refetch 
  } = useApplicationsQuery();
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;
  
  return (
    <div>
      {applications.map(app => (
        <ApplicationCard key={app.id} application={app} />
      ))}
    </div>
  );
};
```

## Query Key Patterns

### Consistent Key Structure
```typescript
// ✅ GOOD - Hierarchical keys
export const USER_QUERY_KEYS = {
  all: ['users'] as const,
  lists: () => [...USER_QUERY_KEYS.all, 'list'] as const,
  list: (filters) => [...USER_QUERY_KEYS.lists(), filters] as const,
  details: () => [...USER_QUERY_KEYS.all, 'detail'] as const,
  detail: (id) => [...USER_QUERY_KEYS.details(), id] as const,
};

// Usage
useQuery(USER_QUERY_KEYS.list({ page: 1 }), fetchUsers);
useQuery(USER_QUERY_KEYS.detail('123'), fetchUser);
```

### Cache Invalidation Patterns
```typescript
// Invalidate all user queries
queryClient.invalidateQueries(USER_QUERY_KEYS.all);

// Invalidate only user lists
queryClient.invalidateQueries(USER_QUERY_KEYS.lists());

// Invalidate specific user
queryClient.invalidateQueries(USER_QUERY_KEYS.detail('123'));
```

## Optimistic Updates

### Simple Optimistic Update
```typescript
const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ userId, data }) => userService.updateUser(userId, data),
    {
      // Optimistic update
      onMutate: async ({ userId, data }) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries(USER_QUERY_KEYS.detail(userId));
        
        // Snapshot previous value
        const previousUser = queryClient.getQueryData(USER_QUERY_KEYS.detail(userId));
        
        // Optimistically update
        queryClient.setQueryData(USER_QUERY_KEYS.detail(userId), {
          ...previousUser,
          ...data,
        });
        
        return { previousUser };
      },
      
      onError: (err, variables, context) => {
        // Rollback on error
        if (context?.previousUser) {
          queryClient.setQueryData(
            USER_QUERY_KEYS.detail(variables.userId), 
            context.previousUser
          );
        }
      },
      
      onSettled: (data, error, variables) => {
        // Always refetch after mutation
        queryClient.invalidateQueries(USER_QUERY_KEYS.detail(variables.userId));
      },
    }
  );
};
```

## Error Handling

### Query Error Handling
```typescript
const { data, error, isError, refetch } = useUsersQuery();

if (isError) {
  return (
    <ErrorBoundary>
      <ErrorMessage 
        error={error} 
        onRetry={refetch}
        title="Failed to load users"
      />
    </ErrorBoundary>
  );
}
```

### Mutation Error Handling
```typescript
const createUserMutation = useCreateUserMutation();

const handleSubmit = async (userData) => {
  try {
    await createUserMutation.mutateAsync(userData);
    // Success handled in mutation config
  } catch (error) {
    // Additional error handling if needed
    console.error('Create user failed:', error);
  }
};
```

## Performance Optimization

### Selective Re-rendering
```typescript
// ✅ GOOD - Only re-render when specific data changes
const { data: users } = useUsersQuery({
  select: (data) => data.filter(user => user.isActive),
  notifyOnChangeProps: ['data'],
});
```

### Background Updates
```typescript
// ✅ GOOD - Keep data fresh without blocking UI
const { data, isStale } = useUsersQuery({
  staleTime: 1 * 60 * 1000, // 1 minute
  refetchInterval: 5 * 60 * 1000, // 5 minutes
});
```

### Parallel Queries
```typescript
// ✅ GOOD - Fetch multiple resources in parallel
const useUserDashboard = (userId) => {
  const userQuery = useUserQuery(userId);
  const userRolesQuery = useUserRolesQuery(userId);
  const userActivityQuery = useUserActivityQuery(userId);
  
  return {
    user: userQuery.data,
    roles: userRolesQuery.data,
    activity: userActivityQuery.data,
    isLoading: userQuery.isLoading || userRolesQuery.isLoading || userActivityQuery.isLoading,
  };
};
```

## Common Patterns

### Dependent Queries
```typescript
const useUserWithRoles = (userId) => {
  const { data: user } = useUserQuery(userId);
  
  const { data: roles } = useUserRolesQuery(userId, {
    enabled: !!user, // Only fetch roles if user exists
  });
  
  return { user, roles };
};
```

### Infinite Queries
```typescript
const useInfiniteUsers = (filters) => {
  return useInfiniteQuery(
    ['users', 'infinite', filters],
    ({ pageParam = 1 }) => userService.getUsers({ ...filters, page: pageParam }),
    {
      getNextPageParam: (lastPage) => lastPage.hasNext ? lastPage.page + 1 : undefined,
    }
  );
};
```

### Prefetching
```typescript
const prefetchUserDetails = (userId) => {
  queryClient.prefetchQuery(
    USER_QUERY_KEYS.detail(userId),
    () => userService.getUser(userId),
    {
      staleTime: 2 * 60 * 1000,
    }
  );
};

// Use in component
const handleUserHover = (userId) => {
  prefetchUserDetails(userId);
};
```

## Migration Checklist

### For Each Hook
- [ ] Identify server state vs UI state
- [ ] Create query keys following consistent pattern
- [ ] Convert fetch operations to useQuery
- [ ] Convert mutations to useMutation  
- [ ] Add proper cache invalidation
- [ ] Handle loading and error states
- [ ] Add optimistic updates where appropriate
- [ ] Test caching behavior
- [ ] Update component usage

### For the Application
- [ ] Update QueryClient configuration
- [ ] Set up global error handling
- [ ] Configure cache defaults
- [ ] Add React Query DevTools (development)
- [ ] Update environment-specific settings
- [ ] Document query key patterns
- [ ] Train team on new patterns

## DevTools Integration

Add React Query DevTools for development:

```typescript
import { ReactQueryDevtools } from 'react-query/devtools';

function App() {
  return (
    <>
      <YourApp />
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </>
  );
}
```

## Best Practices

1. **Always use query keys from constants**
2. **Keep UI state separate from server state**
3. **Use optimistic updates for better UX**
4. **Configure appropriate stale/cache times**
5. **Handle errors gracefully with retry logic**
6. **Prefetch data for better performance**
7. **Use React Query DevTools in development**
8. **Test cache invalidation scenarios**
9. **Document query patterns for the team**
10. **Monitor query performance in production**