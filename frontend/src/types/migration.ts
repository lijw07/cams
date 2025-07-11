// Migration Types
export interface MigrationRequest {
  MigrationType: 'Users' | 'Roles' | 'Applications';
  Data: string;
  DataFormat: 'JSON' | 'CSV';
  ValidateOnly: boolean;
  OverwriteExisting: boolean;
  SendNotifications: boolean;
}

export interface UserImportDto {
  Username: string;
  Email: string;
  Password?: string;
  FirstName?: string;
  LastName?: string;
  PhoneNumber?: string;
  IsActive: boolean;
  Roles: string[];
}

export interface RoleImportDto {
  Name: string;
  Description?: string;
  IsActive: boolean;
  Permissions: string[];
}

export interface ApplicationImportDto {
  Name: string;
  Description?: string;
  Version?: string;
  Environment?: string;
  Tags?: string;
  IsActive: boolean;
}

export interface BulkUserImportRequest {
  Users: UserImportDto[];
  OverwriteExisting: boolean;
  SendWelcomeEmails: boolean;
}

export interface BulkRoleImportRequest {
  Roles: RoleImportDto[];
  OverwriteExisting: boolean;
}

export interface BulkApplicationImportRequest {
  Applications: ApplicationImportDto[];
  OverwriteExisting: boolean;
}

export interface MigrationResult {
  Success: boolean;
  Message: string;
  TotalRecords: number;
  SuccessfulRecords: number;
  FailedRecords: number;
  Errors: string[];
  Warnings: string[];
  ValidationSummary?: string;
  StartTime: string;
  EndTime: string;
  Duration: string;
  ProgressId?: string;
  ProgressPercentage?: number;
  CurrentOperation?: string;
}

export interface MigrationProgress {
  ProgressId: string;
  Percentage: number;
  ProcessedRecords: number;
  TotalRecords: number;
  CurrentOperation: string;
  RecentErrors: string[];
  RecentWarnings: string[];
  IsCompleted: boolean;
  IsSuccessful: boolean;
  LastUpdated: string;
  EstimatedTimeRemaining?: string;
}

export interface MigrationValidationResult {
  IsValid: boolean;
  TotalRecords: number;
  Errors: string[];
  Warnings: string[];
  RecordCounts: { [key: string]: number };
}

// Legacy alias for backwards compatibility
export type BulkMigrationRequest = MigrationRequest;