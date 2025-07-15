import { 
  GitHubUser, 
  GitHubRepository, 
  RepositoryAccess, 
  GitHubTeam,
  GitHubAccessSummary,
  CreateGitHubUserRequest,
  GrantRepositoryAccessRequest,
  RevokeRepositoryAccessRequest,
  CreateGitHubTeamRequest,
  BulkRepositoryAccessRequest
} from '../types/github';
import { apiService } from './api';

export const githubManagementService = {
  // User Management
  async createGitHubUser(request: CreateGitHubUserRequest): Promise<GitHubUser> {
    return apiService.post('/github-management/users', request);
  },

  async getGitHubUser(username: string): Promise<GitHubUser> {
    return apiService.get(`/github-management/users/${username}`);
  },

  async getOrganizationMembers(organization: string): Promise<GitHubUser[]> {
    return apiService.get(`/github-management/organizations/${organization}/members`);
  },

  async inviteUserToOrganization(organization: string, usernameOrEmail: string): Promise<boolean> {
    return apiService.post(`/github-management/organizations/${organization}/invitations`, {
      usernameOrEmail
    });
  },

  async removeUserFromOrganization(organization: string, username: string): Promise<void> {
    return apiService.delete(`/github-management/organizations/${organization}/members/${username}`);
  },

  // Repository Access Management
  async grantRepositoryAccess(request: GrantRepositoryAccessRequest): Promise<void> {
    return apiService.post('/github-management/repository-access', request);
  },

  async revokeRepositoryAccess(request: RevokeRepositoryAccessRequest): Promise<void> {
    return apiService.delete('/github-management/repository-access', request);
  },

  async getUserRepositoryAccess(username: string, organization: string): Promise<RepositoryAccess[]> {
    const params = new URLSearchParams({ organization });
    return apiService.get(`/github-management/users/${username}/repository-access?${params}`);
  },

  async getOrganizationRepositories(organization: string): Promise<GitHubRepository[]> {
    return apiService.get(`/github-management/organizations/${organization}/repositories`);
  },

  // Team Management
  async createTeam(request: CreateGitHubTeamRequest): Promise<GitHubTeam> {
    return apiService.post('/github-management/teams', request);
  },

  async addUserToTeam(organization: string, teamSlug: string, username: string): Promise<void> {
    const params = new URLSearchParams({ organization });
    return apiService.post(`/github-management/teams/${teamSlug}/members?${params}`, { Username: username });
  },

  async removeUserFromTeam(organization: string, teamSlug: string, username: string): Promise<void> {
    const params = new URLSearchParams({ organization });
    return apiService.delete(`/github-management/teams/${teamSlug}/members/${username}?${params}`);
  },

  async getOrganizationTeams(organization: string): Promise<GitHubTeam[]> {
    return apiService.get(`/github-management/organizations/${organization}/teams`);
  },

  // Access Summary
  async getUserAccessSummary(username: string, organization: string): Promise<GitHubAccessSummary> {
    const params = new URLSearchParams({ organization });
    return apiService.get(`/github-management/users/${username}/access-summary?${params}`);
  },

  // Bulk Operations
  async bulkGrantRepositoryAccess(request: BulkRepositoryAccessRequest): Promise<{
    Results: Array<{
      Username: string;
      Repository: string;
      Success: boolean;
      Error?: string;
    }>;
  }> {
    return apiService.post('/github-management/repository-access/bulk', request);
  }
};