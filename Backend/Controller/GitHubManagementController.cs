using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using cams.Backend.Services;
using cams.Backend.View;
using cams.Backend.Helpers;
using Backend.Helpers;

namespace cams.Backend.Controller
{
    [Authorize]
    [ApiController]
    [Route("api/github-management")]
    public class GitHubManagementController : BaseController
    {
        private readonly IGitHubManagementService _gitHubService;
        private readonly ILogger<GitHubManagementController> _logger;

        public GitHubManagementController(
            IGitHubManagementService gitHubService,
            ILogger<GitHubManagementController> logger)
        {
            _gitHubService = gitHubService;
            _logger = logger;
        }

        /// <summary>
        /// Create a GitHub user invitation
        /// </summary>
        [HttpPost("users")]
        [Authorize(Roles = "PlatformAdmin")]
        public async Task<IActionResult> CreateGitHubUser([FromBody] CreateGitHubUserRequest request)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                _logger.LogInformation("User {UserId} creating GitHub user for {Email}", userId, request.Email);
                
                var result = await _gitHubService.CreateGitHubUserAsync(request, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating GitHub user");
                return StatusCode(500, new { Message = "Failed to create GitHub user invitation" });
            }
        }

        /// <summary>
        /// Get GitHub user information
        /// </summary>
        [HttpGet("users/{username}")]
        public async Task<IActionResult> GetGitHubUser(string username)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                var result = await _gitHubService.GetGitHubUserAsync(username, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting GitHub user {Username}", username);
                return NotFound(new { Message = $"GitHub user '{username}' not found" });
            }
        }

        /// <summary>
        /// Get organization members
        /// </summary>
        [HttpGet("organizations/{organization}/members")]
        public async Task<IActionResult> GetOrganizationMembers(string organization)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                var members = await _gitHubService.GetOrganizationMembersAsync(organization, userId);
                return Ok(members);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting organization members for {Organization}", organization);
                return StatusCode(500, new { Message = "Failed to get organization members" });
            }
        }

        /// <summary>
        /// Grant repository access to a user
        /// </summary>
        [HttpPost("repository-access")]
        [Authorize(Roles = "PlatformAdmin")]
        public async Task<IActionResult> GrantRepositoryAccess([FromBody] GrantRepositoryAccessRequest request)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                _logger.LogInformation("User {UserId} granting {Permission} access to {Username} for {Org}/{Repo}", 
                    userId, request.Permission, request.Username, request.Organization, request.Repository);
                
                var result = await _gitHubService.GrantRepositoryAccessAsync(request, userId);
                
                if (result)
                {
                    return Ok(new { Message = "Repository access granted successfully" });
                }
                
                return BadRequest(new { Message = "Failed to grant repository access" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error granting repository access");
                return StatusCode(500, new { Message = "Failed to grant repository access" });
            }
        }

        /// <summary>
        /// Revoke repository access from a user
        /// </summary>
        [HttpDelete("repository-access")]
        [Authorize(Roles = "PlatformAdmin")]
        public async Task<IActionResult> RevokeRepositoryAccess([FromBody] RevokeRepositoryAccessRequest request)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                _logger.LogInformation("User {UserId} revoking access from {Username} for {Org}/{Repo}", 
                    userId, request.Username, request.Organization, request.Repository);
                
                var result = await _gitHubService.RevokeRepositoryAccessAsync(request, userId);
                
                if (result)
                {
                    return Ok(new { Message = "Repository access revoked successfully" });
                }
                
                return BadRequest(new { Message = "Failed to revoke repository access" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error revoking repository access");
                return StatusCode(500, new { Message = "Failed to revoke repository access" });
            }
        }

        /// <summary>
        /// Get user's repository access
        /// </summary>
        [HttpGet("users/{username}/repository-access")]
        public async Task<IActionResult> GetUserRepositoryAccess(string username, [FromQuery] string organization)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                var access = await _gitHubService.GetUserRepositoryAccessAsync(username, organization, userId);
                return Ok(access);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting repository access for user {Username}", username);
                return StatusCode(500, new { Message = "Failed to get user repository access" });
            }
        }

        /// <summary>
        /// Get organization repositories
        /// </summary>
        [HttpGet("organizations/{organization}/repositories")]
        public async Task<IActionResult> GetOrganizationRepositories(string organization)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                var repos = await _gitHubService.GetOrganizationRepositoriesAsync(organization, userId);
                return Ok(repos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting repositories for organization {Organization}", organization);
                return StatusCode(500, new { Message = "Failed to get organization repositories" });
            }
        }

        /// <summary>
        /// Create a new team
        /// </summary>
        [HttpPost("teams")]
        [Authorize(Roles = "PlatformAdmin")]
        public async Task<IActionResult> CreateTeam([FromBody] CreateGitHubTeamRequest request)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                _logger.LogInformation("User {UserId} creating team {TeamName} in {Organization}", 
                    userId, request.TeamName, request.Organization);
                
                var team = await _gitHubService.CreateTeamAsync(request, userId);
                return Ok(team);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating team");
                return StatusCode(500, new { Message = "Failed to create team" });
            }
        }

        /// <summary>
        /// Add user to team
        /// </summary>
        [HttpPost("teams/{teamSlug}/members")]
        [Authorize(Roles = "PlatformAdmin")]
        public async Task<IActionResult> AddUserToTeam(
            string teamSlug, 
            [FromQuery] string organization,
            [FromBody] AddUserToTeamRequest request)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                var result = await _gitHubService.AddUserToTeamAsync(organization, teamSlug, request.Username, userId);
                
                if (result)
                {
                    return Ok(new { Message = "User added to team successfully" });
                }
                
                return BadRequest(new { Message = "Failed to add user to team" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding user to team");
                return StatusCode(500, new { Message = "Failed to add user to team" });
            }
        }

        /// <summary>
        /// Remove user from team
        /// </summary>
        [HttpDelete("teams/{teamSlug}/members/{username}")]
        [Authorize(Roles = "PlatformAdmin")]
        public async Task<IActionResult> RemoveUserFromTeam(
            string teamSlug, 
            string username,
            [FromQuery] string organization)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                var result = await _gitHubService.RemoveUserFromTeamAsync(organization, teamSlug, username, userId);
                
                if (result)
                {
                    return Ok(new { Message = "User removed from team successfully" });
                }
                
                return BadRequest(new { Message = "Failed to remove user from team" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing user from team");
                return StatusCode(500, new { Message = "Failed to remove user from team" });
            }
        }

        /// <summary>
        /// Remove user from organization
        /// </summary>
        [HttpDelete("organizations/{organization}/members/{username}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RemoveUserFromOrganization(string organization, string username)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                _logger.LogWarning("User {UserId} removing {Username} from organization {Organization}", 
                    userId, username, organization);
                
                var result = await _gitHubService.RemoveUserFromOrganizationAsync(organization, username, userId);
                
                if (result)
                {
                    return Ok(new { Message = "User removed from organization successfully" });
                }
                
                return BadRequest(new { Message = "Failed to remove user from organization" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing user from organization");
                return StatusCode(500, new { Message = "Failed to remove user from organization" });
            }
        }

        /// <summary>
        /// Get user access summary
        /// </summary>
        [HttpGet("users/{username}/access-summary")]
        public async Task<IActionResult> GetUserAccessSummary(string username, [FromQuery] string organization)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                var summary = await _gitHubService.GetUserAccessSummaryAsync(username, organization, userId);
                return Ok(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting access summary for user {Username}", username);
                return StatusCode(500, new { Message = "Failed to get user access summary" });
            }
        }

        /// <summary>
        /// Bulk grant repository access
        /// </summary>
        [HttpPost("repository-access/bulk")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> BulkGrantRepositoryAccess([FromBody] BulkRepositoryAccessRequest request)
        {
            try
            {
                var userId = UserHelper.GetCurrentUserId(User);
                _logger.LogInformation("User {UserId} bulk granting access to {UserCount} users for {RepoCount} repositories", 
                    userId, request.Usernames.Count, request.Repositories.Count);
                
                var results = new List<object>();
                
                foreach (var repo in request.Repositories)
                {
                    foreach (var username in request.Usernames)
                    {
                        try
                        {
                            var grantRequest = new GrantRepositoryAccessRequest
                            {
                                Organization = request.Organization,
                                Repository = repo,
                                Username = username,
                                Permission = request.Permission,
                                TeamName = request.TeamName
                            };
                            
                            var success = await _gitHubService.GrantRepositoryAccessAsync(grantRequest, userId);
                            results.Add(new { Username = username, Repository = repo, Success = success });
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed to grant access to {Username} for {Repository}", username, repo);
                            results.Add(new { Username = username, Repository = repo, Success = false, Error = ex.Message });
                        }
                    }
                }
                
                return Ok(new { Results = results });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in bulk repository access grant");
                return StatusCode(500, new { Message = "Failed to process bulk repository access" });
            }
        }
    }

    public class AddUserToTeamRequest
    {
        public string Username { get; set; } = string.Empty;
    }
}