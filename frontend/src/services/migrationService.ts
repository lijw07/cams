import type { components } from '../types/api.generated';
import type {
  MigrationResult,
  MigrationValidationResult
} from '../types/migration';

import { apiService } from './api';

// Type aliases for cleaner code
type BulkMigrationRequest = components['schemas']['BulkMigrationRequest'];
type BulkUserImportRequest = components['schemas']['BulkUserImportRequest'];
type BulkRoleImportRequest = components['schemas']['BulkRoleImportRequest'];
type BulkApplicationImportRequest = components['schemas']['BulkApplicationImportRequest'];

// Re-export types for component usage
export type {
  BulkMigrationRequest,
  BulkUserImportRequest,
  BulkRoleImportRequest,
  BulkApplicationImportRequest,
  MigrationResult,
  MigrationValidationResult
};

export const migrationService = {
  // Validate migration data
  async validateMigration(request: BulkMigrationRequest): Promise<MigrationValidationResult> {
    return apiService.post('/migration/validate', request);
  },

  // Import data (can be validation-only or actual import)
  async importData(request: BulkMigrationRequest): Promise<MigrationResult> {
    return apiService.post('/migration/import', request);
  },

  // Specific import methods
  async importUsers(request: BulkUserImportRequest): Promise<MigrationResult> {
    return apiService.post('/migration/users', request);
  },

  async importRoles(request: BulkRoleImportRequest): Promise<MigrationResult> {
    return apiService.post('/migration/roles', request);
  },

  async importApplications(request: BulkApplicationImportRequest): Promise<MigrationResult> {
    return apiService.post('/migration/applications', request);
  },

  // Get migration templates
  async getTemplate(type: 'users' | 'roles' | 'applications'): Promise<any> {
    return apiService.get(`/migration/template/${type}`);
  },

  // Helper methods for file processing
  parseCSV(csvText: string): any[] {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) throw new Error('CSV must have at least a header and one data row');

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      
      headers.forEach((header, index) => {
        let value: any = values[index] || '';
        
        // Try to parse boolean values
        if (value.toLowerCase() === 'true') value = true;
        else if (value.toLowerCase() === 'false') value = false;
        // Try to parse numbers
        else if (!isNaN(Number(value)) && value !== '') value = Number(value);
        
        row[header] = value;
      });
      
      data.push(row);
    }

    return data;
  },

  validateJSON(jsonText: string): boolean {
    try {
      JSON.parse(jsonText);
      return true;
    } catch {
      return false;
    }
  },

  // Generate example data for different types
  generateExampleUsers(): BulkUserImportRequest {
    return {
      Users: [
        {
          Username: 'john.doe',
          Email: 'john.doe@example.com',
          Password: 'TempPassword123!',
          FirstName: 'John',
          LastName: 'Doe',
          PhoneNumber: '123-456-7890',
          IsActive: true,
          Roles: ['User']
        },
        {
          Username: 'jane.smith',
          Email: 'jane.smith@example.com',
          FirstName: 'Jane',
          LastName: 'Smith',
          IsActive: true,
          Roles: ['User', 'Admin']
        }
      ],
      OverwriteExisting: false,
      SendWelcomeEmails: true
    };
  },

  generateExampleRoles(): BulkRoleImportRequest {
    return {
      Roles: [
        {
          Name: 'Developer',
          Description: 'Software development team members',
          IsActive: true,
          Permissions: ['Read', 'Write', 'Execute']
        },
        {
          Name: 'QA Tester',
          Description: 'Quality assurance team members',
          IsActive: true,
          Permissions: ['Read', 'Test']
        }
      ],
      OverwriteExisting: false
    };
  },

  generateExampleApplications(): BulkApplicationImportRequest {
    return {
      Applications: [
        {
          Name: 'Customer Portal',
          Description: 'Web portal for customer account management',
          Version: '2.1.0',
          Environment: 'Production',
          Tags: 'web, customer, portal',
          IsActive: true
        },
        {
          Name: 'Internal API',
          Description: 'REST API for internal services',
          Version: '1.5.2',
          Environment: 'Development',
          Tags: 'api, rest, internal',
          IsActive: true
        }
      ],
      OverwriteExisting: false
    };
  },

  // Convert data to CSV format for download
  convertToCSV(data: any[], filename: string): void {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Wrap in quotes if contains comma or is string
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        }).join(',')
      )
    ].join('\n');

    this.downloadFile(csvContent, filename, 'text/csv');
  },

  // Download JSON template
  downloadJSON(data: any, filename: string): void {
    const jsonContent = JSON.stringify(data, null, 2);
    this.downloadFile(jsonContent, filename, 'application/json');
  },

  // Generic file download helper
  downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};