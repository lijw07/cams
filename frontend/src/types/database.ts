// Database Connection Types
export enum DatabaseType {
  // Traditional Relational Databases (1-10)
  SqlServer = 1,
  MySQL = 2,
  PostgreSQL = 3,
  Oracle = 4,
  SQLite = 5,
  
  // NoSQL Databases (11-20)
  MongoDB = 11,
  Redis = 12,
  
  // API Types (21-30)
  RestApi = 21,
  GraphQL = 22,
  WebSocket = 23,
  
  // Cloud Databases - AWS (31-40)
  AWS_RDS = 31,
  AWS_DynamoDB = 32,
  AWS_S3 = 33,
  
  // Cloud Databases - Azure (41-50)
  Azure_SQL = 41,
  Azure_CosmosDB = 42,
  Azure_Storage = 43,
  
  // Cloud Databases - Google Cloud (51-60)
  Google_CloudSQL = 51,
  Google_Firestore = 52,
  Google_BigQuery = 53,
  
  // Data Warehouses & Analytics (61-70)
  Snowflake = 61,
  Databricks = 62,
  
  // SaaS & External APIs (71-80)
  Salesforce_API = 71,
  ServiceNow_API = 72,
  GitHub_API = 73,
  
  // Custom/Other (99)
  Custom = 99,
}

export enum ConnectionStatus {
  Untested = 0,
  Connected = 1,
  Failed = 2,
  Testing = 3,
}

export enum AuthenticationMethod {
  None = 0,
  BasicAuth = 1,
  ApiKey = 2,
  OAuth2 = 3,
  JWT = 4,
  AWS_IAM = 5,
  Azure_AD = 6,
  Google_OAuth = 7,
  Certificate = 8,
}

export interface DatabaseConnection {
  Id: string;
  ApplicationId: string;
  ApplicationName: string;
  Name: string;
  Description?: string;
  Type: DatabaseType;
  TypeName: string;
  Server: string;
  Port?: number;
  Database?: string;
  Username?: string;
  ApiBaseUrl?: string;
  AdditionalSettings?: string;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
  LastTestedAt?: string;
  Status: ConnectionStatus;
  StatusName: string;
  LastTestResult?: string;
  ConnectionString?: string;
  HasApiKey: boolean;
}

export interface DatabaseConnectionSummary {
  Id: string;
  Name: string;
  Description?: string;
  TypeName: string;
  IsActive: boolean;
  StatusName: string;
  LastTestedAt?: string;
  CreatedAt: string;
  UpdatedAt: string;
  Type: DatabaseType;
  Status: ConnectionStatus;
  Server: string;
  Port?: number;
  Database?: string;
  ApplicationId?: string;
  ApplicationName?: string;
}

export interface DatabaseConnectionRequest {
  ApplicationId: string;
  Name: string;
  Description?: string;
  Type: DatabaseType;
  Server: string;
  Port?: number;
  Database?: string;
  Username?: string;
  Password?: string;
  ConnectionString?: string;
  ApiBaseUrl?: string;
  ApiKey?: string;
  AdditionalSettings?: string;
  IsActive: boolean;
  // Cloud-specific fields
  AuthenticationMethod?: AuthenticationMethod;
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
  // GitHub-specific fields
  GitHubToken?: string;
  GitHubOrganization?: string;
  GitHubRepository?: string;
}

export interface DatabaseConnectionUpdateRequest extends DatabaseConnectionRequest {
  Id: string;
}

export interface DatabaseTestRequest {
  DatabaseType: DatabaseType;
  Server: string;
  Port?: number;
  Database?: string;
  Username?: string;
  Password?: string;
  ConnectionString?: string;
  ApiBaseUrl?: string;
  ApiKey?: string;
}

export interface DatabaseTestResponse {
  IsSuccessful: boolean;
  Message: string;
  Duration?: number;
  LastTestedAt: string;
}

// Legacy alias for backwards compatibility
export type ConnectionTestResult = DatabaseTestResponse;