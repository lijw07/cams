// Log Types
export interface AuditLog {
  Id: string;
  UserId: string;
  Action: string;
  EntityType: string;
  EntityId?: string;
  EntityName: string;
  OldValues?: string;
  NewValues?: string;
  Description?: string;
  IpAddress: string;
  UserAgent?: string;
  Timestamp: string;
  Severity: string;
  User?: {
    Id: string;
    Username: string;
    Email: string;
  };
}

export interface SystemLog {
  Id: string;
  EventType: string;
  Level: string;
  Source: string;
  Message: string;
  Details?: string;
  StackTrace?: string;
  CorrelationId?: string;
  UserId?: string;
  IpAddress?: string;
  RequestPath?: string;
  HttpMethod?: string;
  StatusCode?: number;
  Duration?: string;
  Timestamp: string;
  MachineName?: string;
  ProcessId?: string;
  ThreadId?: string;
  Metadata?: string;
  IsResolved: boolean;
  ResolvedAt?: string;
  ResolutionNotes?: string;
  User?: {
    Id: string;
    Username: string;
    Email: string;
  };
}

export interface SecurityLog {
  Id: string;
  UserId?: string;
  Username?: string;
  EventType: string;
  Status: string;
  IpAddress: string;
  UserAgent?: string;
  Description?: string;
  SessionId?: string;
  Resource?: string;
  Metadata?: string;
  Timestamp: string;
  Severity: string;
  FailureCount?: number;
  RequiresAction?: boolean;
  FailureReason?: string;
  User?: {
    Id: string;
    Username: string;
    Email: string;
  };
}

export interface PerformanceLog {
  Id: string;
  OperationType: string;
  RequestPath: string;
  HttpMethod: string;
  StatusCode: number;
  Duration: number;
  MemoryUsage?: number;
  CpuUsage?: number;
  DatabaseQueries?: number;
  QueryExecutionTime?: number;
  UserId?: string;
  IpAddress?: string;
  UserAgent?: string;
  Timestamp: string;
  CorrelationId?: string;
  AdditionalMetrics?: string;
  IsSlowQuery: boolean;
  Threshold?: number;
  User?: {
    Id: string;
    Username: string;
    Email: string;
  };
}

export interface LogFilterParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  search?: string;
  startDate?: string;
  endDate?: string;
  level?: string;
  eventType?: string;
  status?: string;
  severity?: string;
  userId?: string;
  isResolved?: boolean;
  riskLevel?: string;
  isBlocked?: boolean;
  isSlowQuery?: boolean;
  httpMethod?: string;
  statusCode?: number;
  source?: string;
  [key: string]: unknown;
}

// Enhanced pagination metadata following REST API best practices
export interface PaginationMetadata {
  CurrentPage: number;
  PerPage: number;
  TotalItems: number;
  TotalPages: number;
  HasNext: boolean;
  HasPrevious: boolean;
}

// Generic paginated response wrapper for API endpoints
export interface PaginatedResponse<T> {
  Data: T[];
  Pagination: PaginationMetadata;
}

// Legacy interfaces for backwards compatibility
export interface LogResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Legacy alias that now extends PaginatedResponse for compatibility
export interface LogsResponse<T> extends PaginatedResponse<T> {
  // Computed properties for backwards compatibility
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Helper function to convert API response to frontend format
export function mapPaginatedToLegacy<T>(response: any): LogsResponse<T> {
  // Check if it's already in legacy camelCase format
  if (response.data && response.totalCount !== undefined) {
    return response as LogsResponse<T>;
  }
  
  // Handle current backend format with PascalCase (Data, TotalCount, Page, PageSize)
  if (response.Data !== undefined) {
    const totalPages = response.PageSize > 0 ? Math.ceil(response.TotalCount / response.PageSize) : 1;
    return {
      data: response.Data,
      totalCount: response.TotalCount,
      page: response.Page,
      pageSize: response.PageSize,
      totalPages: totalPages,
      Data: response.Data,
      Pagination: {
        CurrentPage: response.Page,
        PerPage: response.PageSize,
        TotalItems: response.TotalCount,
        TotalPages: totalPages,
        HasNext: response.Page < totalPages,
        HasPrevious: response.Page > 1
      }
    };
  }
  
  // Handle new paginated format if it exists
  if (response.Pagination) {
    return {
      data: response.Data || [],
      totalCount: response.Pagination.TotalItems,
      page: response.Pagination.CurrentPage,
      pageSize: response.Pagination.PerPage,
      totalPages: response.Pagination.TotalPages,
      Data: response.Data || [],
      Pagination: response.Pagination
    };
  }
  
  // Fallback for unexpected format
  console.warn('Unexpected API response format:', response);
  return {
    data: [],
    totalCount: 0,
    page: 1,
    pageSize: 20,
    totalPages: 1,
    Data: [],
    Pagination: {
      CurrentPage: 1,
      PerPage: 20,
      TotalItems: 0,
      TotalPages: 1,
      HasNext: false,
      HasPrevious: false
    }
  };
}

// Specific filter types for different log types
export interface AuditLogFilters extends Pick<LogFilterParams, 'page' | 'pageSize' | 'sortBy' | 'sortDirection' | 'search' | 'startDate' | 'endDate' | 'userId' | 'severity'> {
  action?: string;
  entityType?: string;
  [key: string]: unknown;
}

export interface SystemLogFilters extends Pick<LogFilterParams, 'page' | 'pageSize' | 'sortBy' | 'sortDirection' | 'search' | 'startDate' | 'endDate' | 'level' | 'source' | 'isResolved'> {
  eventType?: string;
  userId?: string;
  [key: string]: unknown;
}

export interface SecurityLogFilters extends Pick<LogFilterParams, 'page' | 'pageSize' | 'sortBy' | 'sortDirection' | 'search' | 'startDate' | 'endDate' | 'status'> {
  severity?: string;
  eventType?: string;
  userId?: string;
  requiresAction?: boolean;
  [key: string]: unknown;
}

export interface PerformanceLogFilters extends Pick<LogFilterParams, 'page' | 'pageSize' | 'sortBy' | 'sortDirection' | 'search' | 'startDate' | 'endDate' | 'httpMethod' | 'statusCode' | 'isSlowQuery'> {
  performanceLevel?: string;
  userId?: string;
  minDuration?: number;
  maxDuration?: number;
  [key: string]: unknown;
}

// Log Analytics Types
export interface LogStatistics {
  TotalCount: number;
  TodayCount: number;
  WeekCount: number;
  MonthCount: number;
  SeverityBreakdown: Record<string, number>;
  LevelBreakdown: Record<string, number>;
  TopSources: Array<{ Source: string; Count: number }>;
  AverageResponseTime?: number;
  ErrorRate?: number;
}

export interface LogTrends {
  Labels: string[];
  Datasets: Array<{
    Label: string;
    Data: number[];
    BorderColor: string;
    BackgroundColor: string;
  }>;
  Summary: {
    Trend: 'up' | 'down' | 'stable';
    Percentage: number;
    Period: string;
  };
}