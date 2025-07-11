import { User } from './auth';

// Role Management Types
export interface Role {
  Id: string;
  Name: string;
  Description?: string;
  IsActive: boolean;
  IsSystem: boolean;
  UserCount: number;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface RoleRequest {
  Name: string;
  Description?: string;
  IsActive: boolean;
}

export interface Permission {
  Id: string;
  Name: string;
  Description?: string;
  Category: string;
  IsSystemPermission: boolean;
}

// User Management Types
export interface UserManagementDto extends User {
  RoleNames: string[];
  LastLoginFormatted?: string;
}

export interface UserWithRoles {
  Id: string;
  Username: string;
  Email: string;
  FirstName?: string;
  LastName?: string;
  PhoneNumber?: string;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
  LastLoginAt?: string;
  Roles: Role[];
  ApplicationCount: number;
  DatabaseConnectionCount: number;
}

export interface UserCreateRequest {
  Username: string;
  Email: string;
  FirstName: string;
  LastName: string;
  PhoneNumber?: string;
  Password: string;
  RoleIds: string[];
  IsActive: boolean;
  SendWelcomeEmail: boolean;
}

export interface UserUpdateRequest {
  Id: string;
  Username: string;
  Email: string;
  FirstName: string;
  LastName: string;
  PhoneNumber?: string;
  RoleIds: string[];
  IsActive: boolean;
}

export interface AssignRoleRequest {
  UserId: string;
  RoleIds: string[];
}

// Email Management Types
export interface EmailTemplate {
  Id: string;
  Name: string;
  Subject: string;
  Body: string;
  IsHtml: boolean;
  IsActive: boolean;
  Category: string;
  Description?: string;
  Variables: string[];
  CreatedAt: string;
  UpdatedAt: string;
}

export interface EmailTemplateRequest {
  Name: string;
  Subject: string;
  Body: string;
  IsHtml: boolean;
  IsActive: boolean;
  Category: string;
  Description?: string;
}

export interface EmailLog {
  Id: string;
  To: string;
  Cc?: string;
  Bcc?: string;
  Subject: string;
  Body?: string;
  TemplateId?: string;
  TemplateName?: string;
  Status: string;
  SentAt?: string;
  DeliveredAt?: string;
  OpenedAt?: string;
  ErrorMessage?: string;
  RetryCount: number;
  CreatedAt: string;
  UserId?: string;
  UserEmail?: string;
}

export interface SendEmailRequest {
  To: string[];
  Cc?: string[];
  Bcc?: string[];
  Subject: string;
  Body: string;
  IsHtml: boolean;
  TemplateId?: string;
  TemplateVariables?: { [key: string]: string };
}

export interface EmailTestRequest {
  TemplateId: string;
  RecipientEmail: string;
  TestVariables?: { [key: string]: string };
}