export interface ExternalConnection {
  Id: string;
  ApplicationId: string;
  Name: string;
  Type: ExternalConnectionType;
  Description: string;
  IsConnected: boolean;
  ConnectionDetails?: ConnectionDetails;
  CreatedAt: string;
  UpdatedAt: string;
}

export enum ExternalConnectionType {
  GitHub = 'github',
  GitLab = 'gitlab',
  Bitbucket = 'bitbucket',
  AzureDevOps = 'azure-devops',
  Jira = 'jira',
  Slack = 'slack'
}

export interface ConnectionDetails {
  OrganizationName?: string;
  ApiUrl?: string;
  AuthType: AuthenticationType;
  LastSyncedAt?: string;
  Status: ConnectionStatus;
  // GitHub specific
  Repository?: string;
  Branch?: string;
  // GitLab specific
  ProjectId?: string;
  // Generic
  WebhookUrl?: string;
  AccessToken?: string;
}

export enum AuthenticationType {
  OAuth = 'oauth',
  PersonalAccessToken = 'pat',
  ApiKey = 'api-key'
}

export enum ConnectionStatus {
  Active = 'active',
  Inactive = 'inactive',
  Error = 'error',
  Pending = 'pending'
}

export interface CreateConnectionRequest {
  Name: string;
  Type: ExternalConnectionType;
  Description?: string;
  ConnectionDetails: ConnectionDetails;
}

export interface UpdateConnectionRequest {
  Name?: string;
  Description?: string;
  ConnectionDetails?: ConnectionDetails;
}

export interface ConnectionTestResult {
  IsSuccessful: boolean;
  Message: string;
  Details?: Record<string, any>;
}