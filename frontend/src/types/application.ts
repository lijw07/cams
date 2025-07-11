import { DatabaseConnectionSummary } from './database';

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

export interface ApplicationWithConnectionRequest extends ApplicationRequest {
  // Connection details
  connectionName: string;
  connectionDescription?: string;
  databaseType: number;
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
  testConnectionOnCreate?: boolean;
}

export interface ApplicationWithConnectionResponse {
  application: Application;
  connectionTestResult?: boolean;
  connectionTestMessage?: string;
}