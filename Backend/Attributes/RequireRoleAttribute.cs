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
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            var roleService = httpContext.RequestServices.GetRequiredService<IRoleService>();
            
            bool hasRequiredRole = false;
            foreach (var role in roles)
            {
                if (await roleService.UserHasRoleAsync(userId, role))
                {
                    hasRequiredRole = true;
                    break;
                }
            }

            if (!hasRequiredRole)
            {
                context.Result = new ForbidResult();
                return;
            }

            await next();
        }
    }
}