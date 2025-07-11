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
  // Cloud Platforms
  AWS_RDS = 11,
  AWS_DynamoDB = 12,
  AWS_S3 = 13,
  Azure_SQL = 14,
  Azure_CosmosDB = 15,
  Azure_Storage = 16,
  Google_CloudSQL = 17,
  Google_Firestore = 18,
  Google_BigQuery = 19,
  Salesforce_API = 20,
  ServiceNow_API = 21,
  Snowflake = 22,
  Databricks = 23,
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
  TypeName: string;
  IsActive: boolean;
  StatusName: string;
  LastTestedAt?: string;
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