using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using cams.Backend.Data;
using cams.Backend.Enums;
using cams.Backend.Model;
using cams.Backend.View;
using Microsoft.EntityFrameworkCore;

namespace cams.Backend.Services
{
    public class GitHubManagementService : IGitHubManagementService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<GitHubManagementService> _logger;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;
        private string? _organizationToken;
        private string? _defaultOrganization;

        public GitHubManagementService(
            ApplicationDbContext context,
            ILogger<GitHubManagementService> logger,
            IConfiguration configuration,
            IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _logger = logger;
            _configuration = configuration;
            _httpClient = httpClientFactory.CreateClient();
            
            // Initialize GitHub client
            _organizationToken = _configuration["GitHub:OrganizationToken"];
            _defaultOrganization = _configuration["GitHub:DefaultOrganization"];
            
            _httpClient.DefaultRequestHeaders.Add("Accept", "application/vnd.github.v3+json");
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "CAMS-GitHub-Manager");
            if (!string.IsNullOrEmpty(_organizationToken))
            {
                _httpClient.DefaultRequestHeaders.Authorization = 
                    new AuthenticationHeaderValue("token", _organizationToken);
            }
        }

        public async Task<GitHubUserResponse> CreateGitHubUserAsync(CreateGitHubUserRequest request, Guid requestingUserId)
        {
            _logger.LogInformation("User {UserId} creating GitHub account for {Email}", requestingUserId, request.Email);
            
            // Note: GitHub doesn't have an API to create user accounts directly
            // This would typically involve:
            // 1. Creating an invitation to your organization
            // 2. Sending an email to the user to sign up for GitHub
            // 3. Once they sign up, they can accept the organization invitation
            
            // For now, we'll create an invitation
            var inviteUrl = $"https://api.github.com/orgs/{_defaultOrganization}/invitations";
            var inviteData = new
            {
                email = request.Email,
                role = "direct_member",
                team_ids = new int[] { } // Add to specific teams if needed
            };
            
            var response = await _httpClient.PostAsync(inviteUrl, 
                new StringContent(JsonSerializer.Serialize(inviteData), Encoding.UTF8, "application/json"));
            
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var invitation = JsonSerializer.Deserialize<dynamic>(content);
                
                // Log the invitation
                await LogGitHubActionAsync("user.invited", requestingUserId, request.Email, null, null);
                
                return new GitHubUserResponse
                {
                    Email = request.Email,
                    Name = request.FullName,
                    Login = request.Username, // This will be their eventual username
                    IsOrganizationMember = false // Not yet, until they accept
                };
            }
            
            throw new Exception($"Failed to create GitHub invitation: {response.StatusCode}");
        }

        public async Task<bool> GrantRepositoryAccessAsync(GrantRepositoryAccessRequest request, Guid requestingUserId)
        {
            _logger.LogInformation("User {UserId} granting {Permission} access to {Username} for {Org}/{Repo}", 
                requestingUserId, request.Permission, request.Username, request.Organization, request.Repository);
            
            // If team name is provided, add user to team instead of direct access
            if (!string.IsNullOrEmpty(request.TeamName))
            {
                await AddUserToTeamAsync(request.Organization, request.TeamName, request.Username, requestingUserId);
                return await GrantTeamRepositoryAccessAsync(
                    request.Organization, request.TeamName, request.Repository, request.Permission, requestingUserId);
            }
            
            // Direct repository access via collaborator API
            var url = $"https://api.github.com/repos/{request.Organization}/{request.Repository}/collaborators/{request.Username}";
            var data = new { permission = request.Permission };
            
            var response = await _httpClient.PutAsync(url,
                new StringContent(JsonSerializer.Serialize(data), Encoding.UTF8, "application/json"));
            
            if (response.IsSuccessStatusCode)
            {
                await LogGitHubActionAsync("repo.access.granted", requestingUserId, request.Username, 
                    $"{request.Organization}/{request.Repository}", request.Permission);
                return true;
            }
            
            _logger.LogError("Failed to grant repository access: {StatusCode}", response.StatusCode);
            return false;
        }

        public async Task<bool> RevokeRepositoryAccessAsync(RevokeRepositoryAccessRequest request, Guid requestingUserId)
        {
            _logger.LogInformation("User {UserId} revoking access from {Username} for {Org}/{Repo}", 
                requestingUserId, request.Username, request.Organization, request.Repository);
            
            var url = $"https://api.github.com/repos/{request.Organization}/{request.Repository}/collaborators/{request.Username}";
            
            var response = await _httpClient.DeleteAsync(url);
            
            if (response.IsSuccessStatusCode)
            {
                await LogGitHubActionAsync("repo.access.revoked", requestingUserId, request.Username, 
                    $"{request.Organization}/{request.Repository}", null);
                return true;
            }
            
            _logger.LogError("Failed to revoke repository access: {StatusCode}", response.StatusCode);
            return false;
        }

        public async Task<List<GitHubRepositoryResponse>> GetOrganizationRepositoriesAsync(string organization, Guid requestingUserId)
        {
            var url = $"https://api.github.com/orgs/{organization}/repos?per_page=100";
            var repositories = new List<GitHubRepositoryResponse>();
            
            while (!string.IsNullOrEmpty(url))
            {
                var response = await _httpClient.GetAsync(url);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Failed to get organization repositories: {StatusCode}", response.StatusCode);
                    break;
                }
                
                var content = await response.Content.ReadAsStringAsync();
                var repos = JsonSerializer.Deserialize<List<dynamic>>(content);
                
                foreach (var repo in repos)
                {
                    repositories.Add(new GitHubRepositoryResponse
                    {
                        Id = repo.GetProperty("id").GetInt64(),
                        Name = repo.GetProperty("name").GetString(),
                        FullName = repo.GetProperty("full_name").GetString(),
                        Description = repo.GetProperty("description").GetString(),
                        Private = repo.GetProperty("private").GetBoolean(),
                        HtmlUrl = repo.GetProperty("html_url").GetString(),
                        DefaultBranch = repo.GetProperty("default_branch").GetString(),
                        CreatedAt = repo.GetProperty("created_at").GetDateTime(),
                        UpdatedAt = repo.GetProperty("updated_at").GetDateTime()
                    });
                }
                
                // Check for pagination
                url = GetNextPageUrl(response.Headers);
            }
            
            return repositories;
        }

        public async Task<GitHubTeamResponse> CreateTeamAsync(CreateGitHubTeamRequest request, Guid requestingUserId)
        {
            _logger.LogInformation("User {UserId} creating team {TeamName} in {Org}", 
                requestingUserId, request.TeamName, request.Organization);
            
            var url = $"https://api.github.com/orgs/{request.Organization}/teams";
            var data = new
            {
                name = request.TeamName,
                description = request.Description,
                privacy = request.Privacy,
                maintainers = request.Maintainers ?? new List<string>(),
                repo_names = request.RepoNames ?? new List<string>()
            };
            
            var response = await _httpClient.PostAsync(url,
                new StringContent(JsonSerializer.Serialize(data), Encoding.UTF8, "application/json"));
            
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var team = JsonSerializer.Deserialize<dynamic>(content);
                
                await LogGitHubActionAsync("team.created", requestingUserId, null, null, request.TeamName);
                
                return new GitHubTeamResponse
                {
                    Id = team.GetProperty("id").GetInt64(),
                    Name = team.GetProperty("name").GetString(),
                    Slug = team.GetProperty("slug").GetString(),
                    Description = team.GetProperty("description").GetString(),
                    Privacy = team.GetProperty("privacy").GetString()
                };
            }
            
            throw new Exception($"Failed to create team: {response.StatusCode}");
        }

        public async Task<bool> AddUserToTeamAsync(string organization, string teamSlug, string username, Guid requestingUserId)
        {
            _logger.LogInformation("User {UserId} adding {Username} to team {Team} in {Org}", 
                requestingUserId, username, teamSlug, organization);
            
            // First get the team ID
            var teamUrl = $"https://api.github.com/orgs/{organization}/teams/{teamSlug}";
            var teamResponse = await _httpClient.GetAsync(teamUrl);
            
            if (!teamResponse.IsSuccessStatusCode)
            {
                _logger.LogError("Team not found: {Team}", teamSlug);
                return false;
            }
            
            var teamContent = await teamResponse.Content.ReadAsStringAsync();
            var team = JsonSerializer.Deserialize<dynamic>(teamContent);
            var teamId = team.GetProperty("id").GetInt64();
            
            // Add user to team
            var membershipUrl = $"https://api.github.com/teams/{teamId}/memberships/{username}";
            var response = await _httpClient.PutAsync(membershipUrl,
                new StringContent("{\"role\":\"member\"}", Encoding.UTF8, "application/json"));
            
            if (response.IsSuccessStatusCode)
            {
                await LogGitHubActionAsync("team.member.added", requestingUserId, username, null, teamSlug);
                return true;
            }
            
            _logger.LogError("Failed to add user to team: {StatusCode}", response.StatusCode);
            return false;
        }

        public async Task<bool> RemoveUserFromTeamAsync(string organization, string teamSlug, string username, Guid requestingUserId)
        {
            _logger.LogInformation("User {UserId} removing {Username} from team {Team} in {Org}", 
                requestingUserId, username, teamSlug, organization);
            
            // First get the team ID
            var teamUrl = $"https://api.github.com/orgs/{organization}/teams/{teamSlug}";
            var teamResponse = await _httpClient.GetAsync(teamUrl);
            
            if (!teamResponse.IsSuccessStatusCode)
            {
                _logger.LogError("Team not found: {Team}", teamSlug);
                return false;
            }
            
            var teamContent = await teamResponse.Content.ReadAsStringAsync();
            var team = JsonSerializer.Deserialize<dynamic>(teamContent);
            var teamId = team.GetProperty("id").GetInt64();
            
            // Remove user from team
            var membershipUrl = $"https://api.github.com/teams/{teamId}/memberships/{username}";
            var response = await _httpClient.DeleteAsync(membershipUrl);
            
            if (response.IsSuccessStatusCode)
            {
                await LogGitHubActionAsync("team.member.removed", requestingUserId, username, null, teamSlug);
                return true;
            }
            
            _logger.LogError("Failed to remove user from team: {StatusCode}", response.StatusCode);
            return false;
        }

        public async Task<bool> RemoveUserFromOrganizationAsync(string organization, string username, Guid requestingUserId)
        {
            _logger.LogInformation("User {UserId} removing {Username} from organization {Org}", 
                requestingUserId, username, organization);
            
            var url = $"https://api.github.com/orgs/{organization}/members/{username}";
            var response = await _httpClient.DeleteAsync(url);
            
            if (response.IsSuccessStatusCode)
            {
                await LogGitHubActionAsync("org.member.removed", requestingUserId, username, null, null);
                return true;
            }
            
            _logger.LogError("Failed to remove user from organization: {StatusCode}", response.StatusCode);
            return false;
        }

        // Helper methods
        private async Task LogGitHubActionAsync(string action, Guid actorId, string? targetUser, 
            string? repository, string? team)
        {
            var auditLog = new AuditLog
            {
                UserId = actorId,
                Action = AuditAction.Update.ToString(),
                EntityType = "GitHubAccess",
                EntityId = targetUser ?? repository ?? team ?? "unknown",
                Description = JsonSerializer.Serialize(new
                {
                    gitHubAction = action,
                    targetUser,
                    repository,
                    team,
                    timestamp = DateTime.UtcNow
                }),
                IpAddress = "system",
                UserAgent = "GitHubManagementService",
                Timestamp = DateTime.UtcNow
            };
            
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();
        }

        private string? GetNextPageUrl(HttpResponseHeaders headers)
        {
            if (headers.TryGetValues("Link", out var linkHeaders))
            {
                var linkHeader = linkHeaders.FirstOrDefault();
                if (!string.IsNullOrEmpty(linkHeader))
                {
                    var links = linkHeader.Split(',');
                    foreach (var link in links)
                    {
                        if (link.Contains("rel=\"next\""))
                        {
                            var match = System.Text.RegularExpressions.Regex.Match(link, "<(.+?)>");
                            if (match.Success)
                            {
                                return match.Groups[1].Value;
                            }
                        }
                    }
                }
            }
            return null;
        }

        // Implement remaining interface methods...
        public async Task<GitHubUserResponse> GetGitHubUserAsync(string username, Guid requestingUserId)
        {
            var url = $"https://api.github.com/users/{username}";
            var response = await _httpClient.GetAsync(url);
            
            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"User not found: {username}");
            }
            
            var content = await response.Content.ReadAsStringAsync();
            var user = JsonSerializer.Deserialize<dynamic>(content);
            
            // Check organization membership
            var orgUrl = $"https://api.github.com/orgs/{_defaultOrganization}/members/{username}";
            var orgResponse = await _httpClient.GetAsync(orgUrl);
            
            return new GitHubUserResponse
            {
                Login = user.GetProperty("login").GetString(),
                Id = user.GetProperty("id").GetInt64(),
                Email = user.TryGetProperty("email", out JsonElement email) ? email.GetString() : null,
                Name = user.TryGetProperty("name", out JsonElement name) ? name.GetString() : null,
                AvatarUrl = user.GetProperty("avatar_url").GetString(),
                HtmlUrl = user.GetProperty("html_url").GetString(),
                CreatedAt = user.GetProperty("created_at").GetDateTime(),
                UpdatedAt = user.GetProperty("updated_at").GetDateTime(),
                IsOrganizationMember = orgResponse.IsSuccessStatusCode
            };
        }

        public async Task<List<GitHubUserResponse>> GetOrganizationMembersAsync(string organization, Guid requestingUserId)
        {
            var members = new List<GitHubUserResponse>();
            var url = $"https://api.github.com/orgs/{organization}/members?per_page=100";
            
            while (!string.IsNullOrEmpty(url))
            {
                var response = await _httpClient.GetAsync(url);
                if (!response.IsSuccessStatusCode) break;
                
                var content = await response.Content.ReadAsStringAsync();
                var users = JsonSerializer.Deserialize<List<dynamic>>(content);
                
                foreach (var user in users)
                {
                    members.Add(new GitHubUserResponse
                    {
                        Login = user.GetProperty("login").GetString(),
                        Id = user.GetProperty("id").GetInt64(),
                        AvatarUrl = user.GetProperty("avatar_url").GetString(),
                        HtmlUrl = user.GetProperty("html_url").GetString(),
                        IsOrganizationMember = true
                    });
                }
                
                url = GetNextPageUrl(response.Headers);
            }
            
            return members;
        }

        public async Task<bool> InviteUserToOrganizationAsync(string organization, string usernameOrEmail, Guid requestingUserId)
        {
            var inviteUrl = $"https://api.github.com/orgs/{organization}/invitations";
            object data;
            if (usernameOrEmail.Contains("@"))
            {
                data = new { email = usernameOrEmail };
            }
            else
            {
                var userId = await GetUserIdAsync(usernameOrEmail);
                data = new { invitee_id = userId };
            }
            
            var content = new StringContent(JsonSerializer.Serialize(data), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync(inviteUrl, content);
            
            return response.IsSuccessStatusCode;
        }

        private async Task<long> GetUserIdAsync(string username)
        {
            var userResponse = await _httpClient.GetAsync($"https://api.github.com/users/{username}");
            if (!userResponse.IsSuccessStatusCode)
                throw new Exception($"User not found: {username}");
                
            var content = await userResponse.Content.ReadAsStringAsync();
            var user = JsonSerializer.Deserialize<dynamic>(content);
            return user.GetProperty("id").GetInt64();
        }

        public async Task<List<RepositoryAccessResponse>> GetUserRepositoryAccessAsync(string username, string organization, Guid requestingUserId)
        {
            // This would need to iterate through all repos and check collaborator status
            // GitHub API doesn't provide a direct endpoint for this
            var repositories = await GetOrganizationRepositoriesAsync(organization, requestingUserId);
            var userAccess = new List<RepositoryAccessResponse>();
            
            foreach (var repo in repositories)
            {
                var url = $"https://api.github.com/repos/{organization}/{repo.Name}/collaborators/{username}/permission";
                var response = await _httpClient.GetAsync(url);
                
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var permission = JsonSerializer.Deserialize<dynamic>(content);
                    
                    userAccess.Add(new RepositoryAccessResponse
                    {
                        Repository = repo.Name,
                        Username = username,
                        Permission = permission.GetProperty("permission").GetString(),
                        GrantedAt = DateTime.UtcNow // Would need to store this separately
                    });
                }
            }
            
            return userAccess;
        }

        public async Task<List<GitHubTeamResponse>> GetOrganizationTeamsAsync(string organization, Guid requestingUserId)
        {
            var teams = new List<GitHubTeamResponse>();
            var url = $"https://api.github.com/orgs/{organization}/teams?per_page=100";
            
            while (!string.IsNullOrEmpty(url))
            {
                var response = await _httpClient.GetAsync(url);
                if (!response.IsSuccessStatusCode) break;
                
                var content = await response.Content.ReadAsStringAsync();
                var teamList = JsonSerializer.Deserialize<List<dynamic>>(content);
                
                foreach (var team in teamList)
                {
                    teams.Add(new GitHubTeamResponse
                    {
                        Id = team.GetProperty("id").GetInt64(),
                        Name = team.GetProperty("name").GetString(),
                        Slug = team.GetProperty("slug").GetString(),
                        Description = team.TryGetProperty("description", out JsonElement desc) ? desc.GetString() : null,
                        Privacy = team.GetProperty("privacy").GetString()
                    });
                }
                
                url = GetNextPageUrl(response.Headers);
            }
            
            return teams;
        }

        public async Task<bool> GrantTeamRepositoryAccessAsync(string organization, string teamSlug, string repository, string permission, Guid requestingUserId)
        {
            var url = $"https://api.github.com/orgs/{organization}/teams/{teamSlug}/repos/{organization}/{repository}";
            var data = new { permission };
            
            var response = await _httpClient.PutAsync(url,
                new StringContent(JsonSerializer.Serialize(data), Encoding.UTF8, "application/json"));
            
            return response.IsSuccessStatusCode;
        }

        public async Task<bool> RevokeTeamRepositoryAccessAsync(string organization, string teamSlug, string repository, Guid requestingUserId)
        {
            var url = $"https://api.github.com/orgs/{organization}/teams/{teamSlug}/repos/{organization}/{repository}";
            var response = await _httpClient.DeleteAsync(url);
            
            return response.IsSuccessStatusCode;
        }

        public async Task<List<GitHubAuditLogEntry>> GetRepositoryAccessAuditLogAsync(string organization, string repository, Guid requestingUserId)
        {
            // This would query our internal audit logs
            var logs = await _context.AuditLogs
                .Where(l => l.EntityType == "GitHubAccess" && l.Description != null && l.Description.Contains(repository))
                .OrderByDescending(l => l.Timestamp)
                .Take(100)
                .ToListAsync();
            
            return logs.Select(l => new GitHubAuditLogEntry
            {
                Action = l.Action.ToString(),
                Actor = l.UserId.ToString(),
                Repository = repository,
                Timestamp = l.Timestamp,
                AdditionalData = JsonSerializer.Deserialize<Dictionary<string, object>>(l.Description ?? "{}")
            }).ToList();
        }

        public async Task<GitHubAccessSummary> GetUserAccessSummaryAsync(string username, string organization, Guid requestingUserId)
        {
            var user = await GetGitHubUserAsync(username, requestingUserId);
            var repoAccess = await GetUserRepositoryAccessAsync(username, organization, requestingUserId);
            
            // Get teams
            var teamsUrl = $"https://api.github.com/orgs/{organization}/teams";
            var teams = new List<string>();
            // Would need to check team membership for each team
            
            return new GitHubAccessSummary
            {
                Username = username,
                Organization = organization,
                IsOrganizationMember = user.IsOrganizationMember,
                Teams = teams,
                RepositoryAccess = repoAccess.Select(r => new RepositoryAccessInfo
                {
                    Repository = r.Repository,
                    Permission = r.Permission,
                    Source = r.TeamName != null ? $"team:{r.TeamName}" : "direct"
                }).ToList()
            };
        }
    }
}