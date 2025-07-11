import { User } from './auth';

// Role Management Types
export interface Role {
  Id: number;
  Name: string;
  Description?: string;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
  UserCount: number;
  Permissions: string[];
}

export interface RoleRequest {
  Name: string;
  Description?: string;
  IsActive: boolean;
  Permissions: string[];
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

export interface UserCreateRequest {
  Username: string;
  Email: string;
  FirstName: string;
  LastName: string;
  PhoneNumber?: string;
  Password: string;
  RoleIds: number[];
  IsActive: boolean;
  SendWelcomeEmail: boolean;
}

export interface UserUpdateRequest {
  Id: number;
  Username: string;
  Email: string;
  FirstName: string;
  LastName: string;
  PhoneNumber?: string;
  RoleIds: number[];
  IsActive: boolean;
}

export interface AssignRoleRequest {
  UserId: number;
  RoleIds: number[];
}

// Email Management Types
export interface EmailTemplate {
  Id: number;
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
  Id: number;
  To: string;
  Cc?: string;
  Bcc?: string;
  Subject: string;
  Body?: string;
  TemplateId?: number;
  TemplateName?: string;
  Status: string;
  SentAt?: string;
  DeliveredAt?: string;
  OpenedAt?: string;
  ErrorMessage?: string;
  RetryCount: number;
  CreatedAt: string;
  UserId?: number;
  UserEmail?: string;
}

export interface SendEmailRequest {
  To: string[];
  Cc?: string[];
  Bcc?: string[];
  Subject: string;
  Body: string;
  IsHtml: boolean;
  TemplateId?: number;
  TemplateVariables?: { [key: string]: string };
}

export interface EmailTestRequest {
  TemplateId: number;
  RecipientEmail: string;
  TestVariables?: { [key: string]: string };
}