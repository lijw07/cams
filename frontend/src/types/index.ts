// Auth Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  expiration: string;
  username: string;
  email: string;
  userId: number;
  success?: boolean;
  message?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  isActive: boolean;
}

export interface UserProfileResponse extends User {
  applicationCount: number;
  databaseConnectionCount: number;
  roles: string[];
}

// Application Types
export interface Application {
  id: number;
  name: string;
  description?: string;
  version?: string;
  environment?: string;
  tags?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt?: string;
  databaseConnectionCount: number;
  databaseConnections?: DatabaseConnectionSummary[];
}

export interface ApplicationRequest {
  name: string;
  description?: string;
  version?: string;
  environment?: string;
  tags?: string;
  isActive: boolean;
}

// Database Connection Types
export enum DatabaseType {
  SqlServer = 1,
  MySQL = 2,
  PostgreSQL = 3,
  Oracle = 4,
  SQLite = 5,
  MongoDB = 6,
  Redis = 7,
  RestApi = 8,
  GraphQL = 9,
  WebSocket = 10,
  Custom = 99,
}

export enum ConnectionStatus {
  Untested = 0,
  Connected = 1,
  Failed = 2,
  Testing = 3,
}

export interface DatabaseConnection {
  id: number;
  applicationId: number;
  applicationName: string;
  name: string;
  description?: string;
  type: DatabaseType;
  typeName: string;
  server: string;
  port?: number;
  database?: string;
  username?: string;
  apiBaseUrl?: string;
  additionalSettings?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastTestedAt?: string;
  status: ConnectionStatus;
  statusName: string;
  lastTestResult?: string;
  connectionString?: string;
  hasApiKey: boolean;
}

export interface DatabaseConnectionSummary {
  id: number;
  name: string;
  typeName: string;
  isActive: boolean;
  statusName: string;
  lastTestedAt?: string;
}

export interface DatabaseConnectionRequest {
  applicationId: number;
  name: string;
  description?: string;
  type: DatabaseType;
  server: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  connectionString?: string;
  apiBaseUrl?: string;
  apiKey?: string;
  additionalSettings?: string;
  isActive: boolean;
}

export interface DatabaseConnectionUpdateRequest extends DatabaseConnectionRequest {
  id: number;
}

export interface ConnectionTestResult {
  isSuccessful: boolean;
  message: string;
  duration?: string;
  connectionString?: string;
  error?: string;
}

// Combined Application + Connection Types
export interface ApplicationWithConnectionRequest {
  // Application fields
  applicationName: string;
  applicationDescription?: string;
  version?: string;
  environment?: string;
  tags?: string;
  isApplicationActive: boolean;
  
  // Connection fields
  connectionName: string;
  connectionDescription?: string;
  databaseType: DatabaseType;
  server: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  connectionString?: string;
  apiBaseUrl?: string;
  apiKey?: string;
  additionalSettings?: string;
  isConnectionActive: boolean;
  testConnectionOnCreate: boolean;
}

export interface ApplicationWithConnectionResponse {
  application: Application;
  databaseConnection: DatabaseConnection;
  connectionTestResult: boolean;
  connectionTestMessage?: string;
  connectionTestDuration?: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  message: string;
  errors?: ValidationError[];
  statusCode: number;
}

// UI State Types
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface SortParams {
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  options?: { value: string | number; label: string }[];
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | undefined;
  };
}

// Navigation Types
export interface NavItem {
  label: string;
  href: string;
  icon?: any; // React component type
  badge?: string | number;
  children?: NavItem[];
}

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
  description?: string;
  ipAddress: string;
  userAgent?: string;
  sessionId?: string;
  resource?: string;
  metadata?: string;
  timestamp: string;
  severity: string;
  failureCount?: number;
  requiresAction: boolean;
  failureReason?: string;
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

export interface PerformanceLog {
  id: number;
  operation: string;
  controller?: string;
  action?: string;
  requestPath?: string;
  httpMethod?: string;
  userId?: number;
  duration: string;
  databaseTime?: string;
  externalServiceTime?: string;
  memoryUsedMB?: number;
  cpuUsagePercent?: number;
  statusCode: number;
  requestSizeBytes?: number;
  responseSizeBytes?: number;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
  performanceLevel: string;
  isSlowQuery: boolean;
  databaseQueryCount?: number;
  cacheHitCount?: number;
  cacheMissCount?: number;
  metadata?: string;
  alertTrigger?: string;
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

// Log API Response Types
export interface LogsResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Log Filter Types
export interface LogFilters {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  severity?: string;
  userId?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface AuditLogFilters extends LogFilters {
  action?: string;
  entityType?: string;
}

export interface SystemLogFilters extends LogFilters {
  level?: string;
  eventType?: string;
  isResolved?: boolean;
}

export interface SecurityLogFilters extends LogFilters {
  eventType?: string;
  status?: string;
  requiresAction?: boolean;
}

export interface PerformanceLogFilters extends LogFilters {
  performanceLevel?: string;
  isSlowQuery?: boolean;
  minDuration?: number;
  maxDuration?: number;
}

// Migration Types
export interface BulkMigrationRequest {
  migrationType: 'Users' | 'Roles' | 'Applications';
  data: string;
  dataFormat: 'JSON' | 'CSV';
  validateOnly: boolean;
  overwriteExisting: boolean;
  sendNotifications: boolean;
}

export interface UserImportDto {
  username: string;
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  isActive: boolean;
  roles: string[];
}

export interface RoleImportDto {
  name: string;
  description?: string;
  isActive: boolean;
  permissions: string[];
}

export interface ApplicationImportDto {
  name: string;
  description?: string;
  version?: string;
  environment?: string;
  tags?: string;
  isActive: boolean;
}

export interface BulkUserImportRequest {
  users: UserImportDto[];
  overwriteExisting: boolean;
  sendWelcomeEmails: boolean;
}

export interface BulkRoleImportRequest {
  roles: RoleImportDto[];
  overwriteExisting: boolean;
}

export interface BulkApplicationImportRequest {
  applications: ApplicationImportDto[];
  overwriteExisting: boolean;
}

export interface MigrationResult {
  success: boolean;
  message: string;
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  errors: string[];
  warnings: string[];
  validationSummary?: string;
  startTime: string;
  endTime: string;
  duration: string;
  progressId?: string;
  progressPercentage?: number;
  currentOperation?: string;
}

export interface MigrationProgress {
  progressId: string;
  percentage: number;
  processedRecords: number;
  totalRecords: number;
  currentOperation: string;
  recentErrors: string[];
  recentWarnings: string[];
  isCompleted: boolean;
  isSuccessful: boolean;
  lastUpdated: string;
  estimatedTimeRemaining?: string;
}

export interface MigrationValidationResult {
  isValid: boolean;
  totalRecords: number;
  errors: string[];
  warnings: string[];
  recordCounts: { [key: string]: number };
}

// Notification Types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string; // URL to redirect when notification is clicked
  actionText?: string; // Display text for the action
  source?: string; // Source of the notification (e.g., 'Application', 'User Management', etc.)
  metadata?: { [key: string]: any }; // Additional data for the notification
}

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  handleNotificationClick?: (notification: Notification) => void;
}