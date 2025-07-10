import { User } from './auth';

// Role Management Types
export interface Role {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userCount: number;
  permissions: string[];
}

export interface RoleRequest {
  name: string;
  description?: string;
  isActive: boolean;
  permissions: string[];
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  category: string;
  isSystemPermission: boolean;
}

// User Management Types
export interface UserManagementDto extends User {
  roleNames: string[];
  lastLoginFormatted?: string;
}

export interface UserCreateRequest {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  password: string;
  roleIds: number[];
  isActive: boolean;
  sendWelcomeEmail: boolean;
}

export interface UserUpdateRequest {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  roleIds: number[];
  isActive: boolean;
}

export interface AssignRoleRequest {
  userId: number;
  roleIds: number[];
}

// Email Management Types
export interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  isHtml: boolean;
  isActive: boolean;
  category: string;
  description?: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplateRequest {
  name: string;
  subject: string;
  body: string;
  isHtml: boolean;
  isActive: boolean;
  category: string;
  description?: string;
}

export interface EmailLog {
  id: number;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body?: string;
  templateId?: number;
  templateName?: string;
  status: string;
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  errorMessage?: string;
  retryCount: number;
  createdAt: string;
  userId?: number;
  userEmail?: string;
}

export interface SendEmailRequest {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  isHtml: boolean;
  templateId?: number;
  templateVariables?: { [key: string]: string };
}

export interface EmailTestRequest {
  templateId: number;
  recipientEmail: string;
  testVariables?: { [key: string]: string };
}