using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using cams.Backend.Configuration;
using cams.Backend.Data;
using cams.Backend.Services;
using cams.Backend.Mappers;
using cams.Backend.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Use PascalCase for consistency between frontend and backend
        options.JsonSerializerOptions.PropertyNamingPolicy = null; // null = use property names as-is (PascalCase)
        options.JsonSerializerOptions.Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping;
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
        // Allow numbers to be read as strings for more flexible enum parsing
        options.JsonSerializerOptions.NumberHandling = System.Text.Json.Serialization.JsonNumberHandling.AllowReadingFromString;
    });

// Configure API behavior to suppress automatic 400 responses
builder.Services.Configure<Microsoft.AspNetCore.Mvc.ApiBehaviorOptions>(options =>
{
    options.SuppressModelStateInvalidFilter = true;
});
builder.Services.AddEndpointsApiExplorer();

// Configure Entity Framework
// Register DbContext factory (which also registers DbContext)
builder.Services.AddDbContextFactory<ApplicationDbContext>(options =>
{
    var connectionString = GetConnectionString(builder.Configuration);
    options.UseNpgsql(connectionString);
}, ServiceLifetime.Scoped);

// Configure Swagger with JWT support
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "CAMS API", Version = "v1" });
    
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Add health checks
builder.Services.AddHealthChecks();

// Development-specific configuration is handled by appsettings.Development.json


// Add SignalR
builder.Services.AddSignalR();

// Configure JWT settings
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
builder.Services.Configure<JwtSettings>(jwtSettings);


// Add authentication
var key = Encoding.ASCII.GetBytes(jwtSettings.Get<JwtSettings>()?.Secret ?? throw new InvalidOperationException("JWT Secret is not configured"));

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings.Get<JwtSettings>()?.Issuer,
        ValidateAudience = true,
        ValidAudience = jwtSettings.Get<JwtSettings>()?.Audience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
    
    // Configure SignalR authentication
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

// Register services
builder.Services.AddScoped<IAuthenticationService, AuthenticationService>();

// Register services
builder.Services.AddScoped<IApplicationService, ApplicationService>();
builder.Services.AddScoped<IConnectionStringBuilder, ConnectionStringBuilder>();
builder.Services.AddScoped<IDatabaseConnectionService, DatabaseConnectionService>();
builder.Services.AddScoped<IUserService, UserService>();

builder.Services.AddScoped<ILoggingService, LoggingService>();
builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<IMigrationService, MigrationService>();
builder.Services.AddScoped<IConnectionTestScheduleService, ConnectionTestScheduleService>();
builder.Services.AddScoped<IConnectionTestService, ConnectionTestService>();
builder.Services.AddScoped<IGitHubManagementService, GitHubManagementService>();

// Register HttpClient factory for GitHub API
builder.Services.AddHttpClient();

// Register background services
builder.Services.AddHostedService<ConnectionTestSchedulerService>();

// Register mappers
builder.Services.AddScoped<IUserMapper, UserMapper>();
builder.Services.AddScoped<IApplicationMapper, ApplicationMapper>();
builder.Services.AddScoped<IDatabaseConnectionMapper, DatabaseConnectionMapper>();
builder.Services.AddScoped<IApplicationWithConnectionMapper, ApplicationWithConnectionMapper>();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("CamsPolicy", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",           // Local development frontend
                "http://localhost:8080",           // Local development API
                "http://frontend:3000",            // Docker frontend service
                "http://127.0.0.1:3000",          // Alternative local
                "http://0.0.0.0:3000",            // Alternative Docker
                "http://host.docker.internal:3000" // Docker Desktop host access
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials()
            .SetIsOriginAllowed(_ => true); // Allow SignalR connections
    });

    // Development policy with specific origins (required when using credentials)
    options.AddPolicy("Development", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",           // Local development frontend
                "http://127.0.0.1:3000",          // Alternative local
                "http://frontend:3000"             // Docker frontend service
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

var app = builder.Build();

// Seed data with retry logic
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    
    await SeedDataWithRetryAsync(context, logger);
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    
    // Disable HTTPS redirection in development to avoid port warnings
    // app.UseHttpsRedirection(); // Commented out for development
}
else
{
    app.UseHttpsRedirection();
}

// Use environment-specific CORS policy
if (app.Environment.IsDevelopment())
{
    app.UseCors("Development");
}
else
{
    app.UseCors("CamsPolicy");
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Map SignalR hubs
app.MapHub<MigrationHub>("/hubs/migration");

// Map health check endpoint
app.MapHealthChecks("/health");

app.Run();

// Helper method for building connection string
static string GetConnectionString(IConfiguration configuration)
{
    // Check if running in Docker (environment variables are present)
    var dbHost = configuration["DB_HOST"];
    var dbPort = configuration["DB_PORT"];
    var dbName = configuration["DB_NAME"];
    var dbUser = configuration["DB_USER"];
    var dbPassword = configuration["DB_PASSWORD"];
    
    if (!string.IsNullOrEmpty(dbHost) && !string.IsNullOrEmpty(dbName))
    {
        // Build PostgreSQL connection string from environment variables
        var connectionString = $"Host={dbHost};Port={dbPort ?? "5432"};Database={dbName};Username={dbUser ?? "postgres"};Password={dbPassword};";
        Console.WriteLine($"Using environment-based connection string: Host={dbHost};Port={dbPort ?? "5432"};Database={dbName};...");
        return connectionString;
    }
    
    // Fall back to appsettings.json connection string
    var fallbackConnectionString = configuration.GetConnectionString("DefaultConnection");
    Console.WriteLine($"Using appsettings.json connection string: {fallbackConnectionString}");
    return fallbackConnectionString ?? throw new InvalidOperationException("No connection string configured");
}

// Helper method for seeding data with retry logic
static async Task SeedDataWithRetryAsync(ApplicationDbContext context, ILogger logger)
{
    const int maxRetries = 10; // Increased retries for database creation
    const int delayMs = 10000; // 10 seconds delay
    
    for (int attempt = 1; attempt <= maxRetries; attempt++)
    {
        try
        {
            logger.LogInformation("Attempting to seed data (attempt {Attempt}/{MaxRetries})", attempt, maxRetries);
            
            // Check if we can connect to the database
            logger.LogInformation("Testing database connection...");
            await context.Database.CanConnectAsync();
            logger.LogInformation("Database connection successful");
            
            await DataSeeder.SeedAsync(context);
            logger.LogInformation("Data seeding completed successfully");
            return;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Data seeding attempt {Attempt} failed: {Error}", attempt, ex.Message);
            
            if (attempt == maxRetries)
            {
                logger.LogError(ex, "Data seeding failed after {MaxRetries} attempts. Application will continue but may not function properly", maxRetries);
                return; // Don't crash the application
            }
            
            logger.LogInformation("Waiting {DelayMs}ms before retry...", delayMs);
            await Task.Delay(delayMs);
        }
    }
}

// Make the Program class accessible to test projects
public partial class Program { }