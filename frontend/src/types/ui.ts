import React from 'react';

// UI State Types
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface SortParams {
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

export interface PaginationRequest extends Record<string, unknown> {
  PageNumber?: number;
  PageSize?: number;
  SearchTerm?: string;
  SortBy?: string;
  SortDirection?: 'asc' | 'desc';
}

export interface PagedResult<T> {
  Items: T[];
  TotalCount: number;
  PageNumber: number;
  PageSize: number;
  TotalPages: number;
  HasPrevious: boolean;
  HasNext: boolean;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  options?: { value: string | number; label: string }[];
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | undefined;
  };
}

// Navigation Types
export interface NavItem {
  label: string;
  href: string;
  icon?: any; // React component type
  badge?: string | number;
  children?: NavItem[];
}

// Notification Types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  isRead: boolean;
  source?: string;
  actionUrl?: string;
}

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  removeNotification: (id: string) => void;
  deleteNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAllNotifications: () => void;
}

// Theme Types
export type Theme = 'light' | 'dark' | 'system';

// Modal Types
export interface ModalState {
  isOpen: boolean;
  data?: any;
}

// Table Types
export interface TableColumn<T = any> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}