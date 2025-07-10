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

export interface DatabaseTestRequest {
  databaseType: DatabaseType;
  server: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  connectionString?: string;
  apiBaseUrl?: string;
  apiKey?: string;
}

export interface DatabaseTestResponse {
  isSuccessful: boolean;
  message: string;
  duration?: number;
  lastTestedAt: string;
}