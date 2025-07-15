import { DatabaseConnectionSummary } from './database';

// Application Types
export interface Application {
  Id: string;
  Name: string;
  Description?: string;
  Version?: string;
  Environment?: string;
  Tags?: string;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
  LastAccessedAt?: string;
  DatabaseConnectionCount: number;
  DatabaseConnections?: DatabaseConnectionSummary[];
}

export interface ApplicationRequest {
  Name: string;
  Description?: string;
  Version?: string;
  Environment?: string;
  Tags?: string;
  IsActive: boolean;
}

export interface ApplicationWithConnectionRequest {
  // Application details (matching backend's PascalCase expectations)
  ApplicationName: string;
  ApplicationDescription?: string;
  Version?: string;
  Environment?: string;
  Tags?: string;
  IsApplicationActive: boolean;
  
  // Connection details
  ConnectionName: string;
  ConnectionDescription?: string;
  DatabaseType: number;
  Server: string;
  Port?: number;
  Database?: string;
  Username?: string;
  Password?: string;
  ConnectionString?: string;
  ApiBaseUrl?: string;
  ApiKey?: string;
  AdditionalSettings?: string;
  IsConnectionActive: boolean;
  TestConnectionOnCreate?: boolean;
  
  // Cloud-specific fields
  AuthenticationMethod?: number;
  Region?: string;
  AccountId?: string;
  ProjectId?: string;
  InstanceId?: string;
  AccessKeyId?: string;
  SecretAccessKey?: string;
  SessionToken?: string;
  ClientId?: string;
  ClientSecret?: string;
  TenantId?: string;
  SubscriptionId?: string;
  CertificatePath?: string;
  CertificatePassword?: string;
  Scope?: string;
  Audience?: string;
  GrantType?: string;
  TokenEndpoint?: string;
  
  // Additional cloud fields
  ResourceGroup?: string;
  ServiceAccountKey?: string;
  RedirectUri?: string;
  PrivateKey?: string;
  PublicKey?: string;
  Account?: string;
  Warehouse?: string;
  Schema?: string;
  WorkspaceUrl?: string;
  ClusterId?: string;
  
  // GitHub-specific fields
  GitHubToken?: string;
  GitHubOrganization?: string;
  GitHubRepository?: string;
}

export interface ApplicationWithConnectionResponse {
  Application: Application;
  DatabaseConnection: DatabaseConnectionSummary;
  ConnectionTestResult?: boolean;
  ConnectionTestMessage?: string;
}

export interface ConnectionTestSchedule {
  Id?: string;
  ApplicationId: string;
  ApplicationName?: string;
  CronExpression: string;
  IsEnabled: boolean;
  LastRunTime?: string;
  NextRunTime?: string;
  LastRunStatus?: 'success' | 'failed' | 'running';
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface ConnectionTestScheduleRequest {
  ApplicationId: string;
  CronExpression: string;
  IsEnabled: boolean;
}