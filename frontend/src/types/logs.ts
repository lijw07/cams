// Log Types
export interface AuditLog {
  id: number;
  userId: number;
  action: string;
  entityType: string;
  entityId?: number;
  entityName: string;
  oldValues?: string;
  newValues?: string;
  description?: string;
  ipAddress: string;
  userAgent?: string;
  timestamp: string;
  severity: string;
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

export interface SystemLog {
  id: number;
  eventType: string;
  level: string;
  source: string;
  message: string;
  details?: string;
  stackTrace?: string;
  correlationId?: string;
  userId?: number;
  ipAddress?: string;
  requestPath?: string;
  httpMethod?: string;
  statusCode?: number;
  duration?: string;
  timestamp: string;
  machineName?: string;
  processId?: string;
  threadId?: string;
  metadata?: string;
  isResolved: boolean;
  resolvedAt?: string;
  resolutionNotes?: string;
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

export interface SecurityLog {
  id: number;
  userId?: number;
  username?: string;
  eventType: string;
  status: string;
  ipAddress: string;
  userAgent?: string;
  location?: string;
  description?: string;
  riskLevel: string;
  isBlocked: boolean;
  timestamp: string;
  additionalData?: string;
  sessionId?: string;
  failureReason?: string;
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

export interface PerformanceLog {
  id: number;
  operationType: string;
  requestPath: string;
  httpMethod: string;
  statusCode: number;
  duration: number;
  memoryUsage?: number;
  cpuUsage?: number;
  databaseQueries?: number;
  queryExecutionTime?: number;
  userId?: number;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  correlationId?: string;
  additionalMetrics?: string;
  isSlowQuery: boolean;
  threshold?: number;
  user?: {
    id: number;
    username: string;
    email: string;
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
  userId?: number;
  isResolved?: boolean;
  riskLevel?: string;
  isBlocked?: boolean;
  isSlowQuery?: boolean;
  httpMethod?: string;
  statusCode?: number;
  source?: string;
}

export interface LogResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}