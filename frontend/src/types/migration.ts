// Migration Types
export interface MigrationRequest {
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