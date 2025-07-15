// GitHub Management Types

export interface GitHubUser {
  Login: string;
  Id: number;
  Email?: string;
  Name?: string;
  Company?: string;
  Location?: string;
  Bio?: string;
  AvatarUrl: string;
  HtmlUrl: string;
  CreatedAt: string;
  UpdatedAt: string;
  IsOrganizationMember: boolean;
  Teams: string[];
}

export interface GitHubRepository {
  Id: number;
  Name: string;
  FullName: string;
  Description?: string;
  Private: boolean;
  HtmlUrl: string;
  DefaultBranch: string;
  CreatedAt: string;
  UpdatedAt: string;
  Topics: string[];
  Permissions?: RepositoryPermissions;
}

export interface RepositoryPermissions {
  Admin: boolean;
  Push: boolean;
  Pull: boolean;
}

export interface RepositoryAccess {
  Repository: string;
  Username: string;
  Permission: 'read' | 'write' | 'admin';
  TeamName?: string;
  GrantedAt: string;
  GrantedBy: string;
}

export interface GitHubTeam {
  Id: number;
  Name: string;
  Slug: string;
  Description?: string;
  Privacy: 'secret' | 'closed';
  Permission: string;
  MembersCount: number;
  ReposCount: number;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface GitHubAccessSummary {
  Username: string;
  Organization: string;
  IsOrganizationMember: boolean;
  Teams: string[];
  RepositoryAccess: RepositoryAccessInfo[];
  LastActivityAt?: string;
}

export interface RepositoryAccessInfo {
  Repository: string;
  Permission: string;
  Source: string; // "direct" or "team:team-name"
}

// Request Types
export interface CreateGitHubUserRequest {
  Email: string;
  Username: string;
  FullName: string;
  Company?: string;
  Location?: string;
  SendWelcomeEmail: boolean;
}

export interface GrantRepositoryAccessRequest {
  Organization: string;
  Repository: string;
  Username: string;
  Permission: 'read' | 'write' | 'admin';
  TeamName?: string;
}

export interface RevokeRepositoryAccessRequest {
  Organization: string;
  Repository: string;
  Username: string;
}

export interface CreateGitHubTeamRequest {
  Organization: string;
  TeamName: string;
  Description?: string;
  Privacy: 'secret' | 'closed';
  Maintainers?: string[];
  RepoNames?: string[];
}

export interface BulkRepositoryAccessRequest {
  Organization: string;
  Repositories: string[];
  Usernames: string[];
  Permission: 'read' | 'write' | 'admin';
  TeamName?: string;
}