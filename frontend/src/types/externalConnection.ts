// External Connection Types (separate from Database Connections)
export enum ExternalConnectionType {
  GitHub = 'GitHub',
  GitLab = 'GitLab',
  Bitbucket = 'Bitbucket',
  AzureDevOps = 'AzureDevOps',
  Jenkins = 'Jenkins',
  CircleCI = 'CircleCI',
  TravisCI = 'TravisCI',
  Jira = 'Jira',
  Slack = 'Slack',
  Teams = 'Teams',
  Webhook = 'Webhook',
  Custom = 'Custom'
}

export enum ExternalConnectionStatus {
  Connected = 'Connected',
  Disconnected = 'Disconnected',
  Error = 'Error',
  Pending = 'Pending'
}

export interface ExternalConnection {
  Id: string;
  ApplicationId: string;
  ApplicationName?: string;
  Name: string;
  Description?: string;
  Type: ExternalConnectionType;
  Status: ExternalConnectionStatus;
  Url?: string;
  Repository?: string;
  Branch?: string;
  ApiKey?: string;
  HasApiKey?: boolean;
  WebhookUrl?: string;
  LastSyncedAt?: string;
  Configuration?: Record<string, any>;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
  CreatedBy?: string;
  UpdatedBy?: string;
}

export interface ExternalConnectionRequest {
  ApplicationId: string;
  Name: string;
  Description?: string;
  Type: ExternalConnectionType;
  Url?: string;
  Repository?: string;
  Branch?: string;
  ApiKey?: string;
  WebhookUrl?: string;
  Configuration?: Record<string, any>;
  IsActive: boolean;
}

export interface ExternalConnectionUpdateRequest extends ExternalConnectionRequest {
  Id: string;
}

export interface ExternalConnectionTestResult {
  Success: boolean;
  Message: string;
  Details?: Record<string, any>;
}