import { applicationService } from './applicationService';
import { roleService } from './roleService';
import { usersService } from './usersService';

export interface DashboardStats {
  totalUsers: number;
  totalApplications: number;
  totalDatabaseConnections: number;
  totalRoles: number;
  isLoading: boolean;
  error?: string;
}

export const dashboardService = {
  async getDashboardStats(): Promise<Omit<DashboardStats, 'isLoading' | 'error'>> {
    try {
      // Fetch counts using existing endpoints with minimal page size
      const [usersResponse, applicationsResponse, rolesResponse] = await Promise.all([
        usersService.getUsers({ PageNumber: 1, PageSize: 1 }),
        applicationService.getApplicationsPaginated({ PageNumber: 1, PageSize: 1 }),
        roleService.getAllRoles()
      ]);

      return {
        totalUsers: usersResponse.Pagination.TotalItems,
        totalApplications: applicationsResponse.TotalCount,
        totalDatabaseConnections: 0, // This would need a separate endpoint or calculation
        totalRoles: rolesResponse.length
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }
};