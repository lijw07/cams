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
  RestAPI = 8,
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
  icon?: React.ComponentType;
  badge?: string | number;
  children?: NavItem[];
}