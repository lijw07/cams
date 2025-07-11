using cams.Backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Claims;

namespace cams.Backend.Attributes
{
    public class RequireRoleAttribute(params string[] roles) : Attribute, IAsyncActionFilter
    {
        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var httpContext = context.HttpContext;
            var user = httpContext.User;

            if (!user.Identity?.IsAuthenticated ?? true)
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out Guid userId))
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            var roleService = httpContext.RequestServices.GetRequiredService<IRoleService>();
            var logger = httpContext.RequestServices.GetRequiredService<ILogger<RequireRoleAttribute>>();
            
            logger.LogInformation("RequireRole: Checking user {UserId} for roles: {RequiredRoles}", userId, string.Join(", ", roles));
            
            bool hasRequiredRole = false;
            foreach (var role in roles)
            {
                var hasRole = await roleService.UserHasRoleAsync(userId, role);
                logger.LogInformation("RequireRole: User {UserId} has role '{Role}': {HasRole}", userId, role, hasRole);
                
                if (hasRole)
                {
                    hasRequiredRole = true;
                    break;
                }
            }

            if (!hasRequiredRole)
            {
                logger.LogWarning("RequireRole: User {UserId} does not have any of the required roles: {RequiredRoles}", userId, string.Join(", ", roles));
                context.Result = new ForbidResult();
                return;
            }
            
            logger.LogInformation("RequireRole: User {UserId} has required role access", userId);

            await next();
        }
    }
}