import { apiService } from './api';

export enum EmailPriority {
  Low = 1,
  Normal = 2,
  High = 3,
  Urgent = 4,
}

export enum EmailStatus {
  Draft = 1,
  Queued = 2,
  Sending = 3,
  Sent = 4,
  Failed = 5,
  Cancelled = 6,
}

export interface EmailMessage {
  id: number;
  fromEmail: string;
  fromName: string;
  toEmail: string;
  toName?: string;
  ccEmails?: string;
  bccEmails?: string;
  subject: string;
  body: string;
  plainTextBody?: string;
  isHtml: boolean;
  priority: EmailPriority;
  status: EmailStatus;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  deliveredAt?: string;
  errorMessage?: string;
  retryCount: number;
  attachmentCount: number;
}

export interface SendEmailRequest {
  toEmail: string;
  toName?: string;
  ccEmails?: string[];
  bccEmails?: string[];
  subject: string;
  body: string;
  isHtml?: boolean;
  priority?: EmailPriority;
  attachments?: EmailAttachmentRequest[];
}

export interface EmailAttachmentRequest {
  fileName: string;
  contentType: string;
  fileData: string; // base64 encoded
}

export interface EmailAttachment {
  id: number;
  emailMessageId: number;
  fileName: string;
  contentType: string;
  fileSize: number;
  createdAt: string;
}

export interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  isHtml: boolean;
  variables: string[];
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmailTemplateRequest {
  name: string;
  subject: string;
  body: string;
  isHtml: boolean;
  category?: string;
}

export const emailService = {
  // Email sending
  async sendEmail(data: SendEmailRequest): Promise<{ 
    emailId: number; 
    message: string; 
    queuedAt: string; 
  }> {
    return apiService.post('/email/send', data);
  },

  async sendBulkEmail(data: {
    recipients: Array<{ email: string; name?: string }>;
    subject: string;
    body: string;
    isHtml?: boolean;
    priority?: EmailPriority;
  }): Promise<{ 
    emailIds: number[]; 
    message: string; 
    queuedCount: number; 
  }> {
    return apiService.post('/email/send-bulk', data);
  },

  // Email management
  async getEmails(params?: {
    page?: number;
    pageSize?: number;
    status?: EmailStatus;
    priority?: EmailPriority;
    searchTerm?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<{
    emails: EmailMessage[];
    totalCount: number;
    pageCount: number;
    currentPage: number;
    pageSize: number;
  }> {
    return apiService.get('/email', params);
  },

  async getEmail(id: number): Promise<EmailMessage> {
    return apiService.get(`/email/${id}`);
  },

  async deleteEmail(id: number): Promise<{ message: string }> {
    return apiService.delete(`/email/${id}`);
  },

  async retryEmail(id: number): Promise<{ message: string }> {
    return apiService.post(`/email/${id}/retry`);
  },

  async cancelEmail(id: number): Promise<{ message: string }> {
    return apiService.post(`/email/${id}/cancel`);
  },

  // Email attachments
  async getEmailAttachments(emailId: number): Promise<EmailAttachment[]> {
    return apiService.get(`/email/${emailId}/attachments`);
  },

  async downloadAttachment(emailId: number, attachmentId: number): Promise<Blob> {
    const response = await fetch(`/api/email/${emailId}/attachments/${attachmentId}/download`);
    return response.blob();
  },

  // Email templates
  async getTemplates(): Promise<EmailTemplate[]> {
    return apiService.get('/email/templates');
  },

  async getTemplate(id: number): Promise<EmailTemplate> {
    return apiService.get(`/email/templates/${id}`);
  },

  async createTemplate(data: CreateEmailTemplateRequest): Promise<EmailTemplate> {
    return apiService.post('/email/templates', data);
  },

  async updateTemplate(id: number, data: CreateEmailTemplateRequest): Promise<EmailTemplate> {
    return apiService.put(`/email/templates/${id}`, data);
  },

  async deleteTemplate(id: number): Promise<{ message: string }> {
    return apiService.delete(`/email/templates/${id}`);
  },

  async sendTemplateEmail(templateId: number, data: {
    toEmail: string;
    toName?: string;
    variables?: Record<string, string>;
    priority?: EmailPriority;
  }): Promise<{ 
    emailId: number; 
    message: string; 
  }> {
    return apiService.post(`/email/templates/${templateId}/send`, data);
  },

  // Email statistics
  async getEmailStats(params?: {
    fromDate?: string;
    toDate?: string;
  }): Promise<{
    totalSent: number;
    totalFailed: number;
    totalQueued: number;
    totalDelivered: number;
    deliveryRate: number;
    recentActivity: Array<{
      date: string;
      sent: number;
      failed: number;
    }>;
  }> {
    return apiService.get('/email/stats', params);
  },

  // Email queue management
  async getQueueStatus(): Promise<{
    queuedCount: number;
    processingCount: number;
    failedCount: number;
    retryCount: number;
    lastProcessed?: string;
  }> {
    return apiService.get('/email/queue/status');
  },

  async processQueue(): Promise<{ message: string; processedCount: number }> {
    return apiService.post('/email/queue/process');
  },

  async clearFailedEmails(): Promise<{ message: string; clearedCount: number }> {
    return apiService.post('/email/queue/clear-failed');
  },

  // Email validation
  async validateEmailAddress(email: string): Promise<{
    isValid: boolean;
    message: string;
    suggestions?: string[];
  }> {
    return apiService.post('/email/validate', { email });
  },

  async testEmailConnection(): Promise<{
    isSuccessful: boolean;
    message: string;
    serverResponse?: string;
  }> {
    return apiService.post('/email/test-connection');
  },
};