import { ConnectionTestSchedule, ConnectionTestScheduleRequest } from '../types';

import { apiService } from './api';

export const connectionTestScheduleService = {
  // Get all schedules
  async getSchedules(): Promise<ConnectionTestSchedule[]> {
    return apiService.get('/connection-test-schedules');
  },

  // Get schedule by application ID
  async getScheduleByApplicationId(applicationId: string): Promise<ConnectionTestSchedule | null> {
    try {
      return await apiService.get(`/connection-test-schedules/application/${applicationId}`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Create or update schedule
  async upsertSchedule(data: ConnectionTestScheduleRequest): Promise<ConnectionTestSchedule> {
    return apiService.post('/connection-test-schedules', data);
  },

  // Update schedule
  async updateSchedule(id: string, data: Partial<ConnectionTestScheduleRequest>): Promise<ConnectionTestSchedule> {
    return apiService.put(`/connection-test-schedules/${id}`, data);
  },

  // Delete schedule
  async deleteSchedule(id: string): Promise<void> {
    return apiService.delete(`/connection-test-schedules/${id}`);
  },

  // Toggle schedule enable/disable
  async toggleSchedule(id: string, isEnabled: boolean): Promise<ConnectionTestSchedule> {
    return apiService.patch(`/connection-test-schedules/${id}/toggle`, { IsEnabled: isEnabled });
  },

  // Validate cron expression
  async validateCronExpression(expression: string): Promise<{ IsValid: boolean; Description?: string; NextRunTime?: string }> {
    return apiService.post('/connection-test-schedules/validate-cron', { Expression: expression });
  },

  // Run schedule now (manual trigger)
  async runScheduleNow(id: string): Promise<{
    status: string;
    message: string;
    duration: string;
    totalConnections: number;
    successfulTests: number;
    failedTests: number;
    testResults: Array<{
      connectionId: string;
      connectionName: string;
      isSuccessful: boolean;
      message: string;
      responseTime: string;
    }>;
  }> {
    return apiService.post(`/connection-test-schedules/${id}/run-now`);
  },

  // Get cron expression presets
  getCronPresets(): Array<{ label: string; value: string; description: string }> {
    return [
      { label: 'Every 5 minutes', value: '*/5 * * * *', description: 'Runs every 5 minutes' },
      { label: 'Every 15 minutes', value: '*/15 * * * *', description: 'Runs every 15 minutes' },
      { label: 'Every 30 minutes', value: '*/30 * * * *', description: 'Runs every 30 minutes' },
      { label: 'Every hour', value: '0 * * * *', description: 'Runs at the start of every hour' },
      { label: 'Every 6 hours', value: '0 */6 * * *', description: 'Runs every 6 hours' },
      { label: 'Twice daily', value: '0 9,17 * * *', description: 'Runs at 9 AM and 5 PM' },
      { label: 'Daily at midnight', value: '0 0 * * *', description: 'Runs every day at midnight' },
      { label: 'Daily at 6 AM', value: '0 6 * * *', description: 'Runs every day at 6 AM' },
      { label: 'Weekly on Monday', value: '0 0 * * 1', description: 'Runs every Monday at midnight' },
      { label: 'Monthly', value: '0 0 1 * *', description: 'Runs on the 1st of every month' },
    ];
  }
};