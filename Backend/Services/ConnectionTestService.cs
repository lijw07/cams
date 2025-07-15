using System.Data.Common;
using cams.Backend.Data;
using cams.Backend.Enums;
using cams.Backend.View;
using cams.Backend.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Npgsql;
using MySqlConnector;
using Microsoft.Data.SqlClient;
// using Oracle.ManagedDataAccess.Client; // Requires Oracle.EntityFrameworkCore package
using Microsoft.Data.Sqlite;

namespace cams.Backend.Services
{
    public class ConnectionTestService : IConnectionTestService
    {
        private readonly ILogger<ConnectionTestService> _logger;
        private readonly IDbContextFactory<ApplicationDbContext> _contextFactory;
        private readonly IConnectionStringBuilder _connectionStringBuilder;
        private readonly ApplicationDbContext _context;
        private const int DefaultTimeoutSeconds = 10;

        public ConnectionTestService(
            ILogger<ConnectionTestService> logger,
            IDbContextFactory<ApplicationDbContext> contextFactory,
            IConnectionStringBuilder connectionStringBuilder,
            ApplicationDbContext context)
        {
            _logger = logger;
            _contextFactory = contextFactory;
            _connectionStringBuilder = connectionStringBuilder;
            _context = context;
        }

        public async Task<DatabaseConnectionTestResponse> TestConnectionAsync(
            string connectionString,
            DatabaseType databaseType,
            Guid userId,
            CancellationToken cancellationToken = default)
        {
            var startTime = DateTime.UtcNow;
            
            try
            {
                _logger.LogInformation("User {UserId} testing {DatabaseType} connection", userId, databaseType);
                
                // Create options for the specific database type
                var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
                ConfigureDbContext(optionsBuilder, connectionString, databaseType);
                
                using var context = new ApplicationDbContext(optionsBuilder.Options);
                
                // Set command timeout
                context.Database.SetCommandTimeout(TimeSpan.FromSeconds(DefaultTimeoutSeconds));
                
                // Test the connection using EF Core's built-in method
                var canConnect = await context.Database.CanConnectAsync(cancellationToken);
                
                if (canConnect)
                {
                    // Get additional information about the connection
                    var additionalInfo = await GetConnectionInfoAsync(context, databaseType, cancellationToken);
                    
                    _logger.LogInformation("Connection test successful for user {UserId}, {DatabaseType}", 
                        userId, databaseType);
                    
                    return new DatabaseConnectionTestResponse
                    {
                        IsSuccessful = true,
                        Message = $"{databaseType} connection successful",
                        TestedAt = DateTime.UtcNow,
                        ResponseTime = DateTime.UtcNow - startTime,
                        AdditionalInfo = additionalInfo
                    };
                }
                else
                {
                    _logger.LogWarning("Connection test failed for user {UserId}, {DatabaseType} - CanConnect returned false", 
                        userId, databaseType);
                    
                    return new DatabaseConnectionTestResponse
                    {
                        IsSuccessful = false,
                        Message = "Unable to establish connection to the database",
                        TestedAt = DateTime.UtcNow,
                        ResponseTime = DateTime.UtcNow - startTime
                    };
                }
            }
            catch (DbUpdateException dbEx)
            {
                return CreateErrorResponse(dbEx, databaseType, startTime, "Database connection failed");
            }
            catch (InvalidOperationException invOpEx)
            {
                return CreateErrorResponse(invOpEx, databaseType, startTime, "Invalid connection configuration");
            }
            catch (TimeoutException timeoutEx)
            {
                return CreateErrorResponse(timeoutEx, databaseType, startTime, "Connection timeout");
            }
            catch (Exception ex)
            {
                return CreateErrorResponse(ex, databaseType, startTime, "Connection test failed");
            }
        }

        public async Task<DatabaseConnectionTestResponse> TestConnectionWithDetailsAsync(
            DatabaseConnectionTestRequest request,
            Guid userId,
            CancellationToken cancellationToken = default)
        {
            // If testing an existing connection by ID
            if (request.ConnectionId.HasValue)
            {
                var connection = await _context.DatabaseConnections
                    .FirstOrDefaultAsync(c => c.Id == request.ConnectionId.Value && c.UserId == userId, cancellationToken);
                if (connection == null)
                {
                    return new DatabaseConnectionTestResponse
                    {
                        IsSuccessful = false,
                        Message = "Connection not found",
                        TestedAt = DateTime.UtcNow,
                        ResponseTime = TimeSpan.Zero
                    };
                }
                
                // Handle GitHub API connections
                if (connection.Type == DatabaseType.GitHub_API)
                {
                    return await TestGitHubApiConnectionAsync(connection, userId, cancellationToken);
                }
                
                var connectionString = _connectionStringBuilder.GetConnectionString(connection, null);
                return await TestConnectionAsync(connectionString, connection.Type, userId, cancellationToken);
            }
            
            // If testing with provided connection details
            if (request.ConnectionDetails != null)
            {
                // Handle GitHub API connections
                if (request.ConnectionDetails.Type == DatabaseType.GitHub_API)
                {
                    return await TestGitHubApiConnectionAsync(request.ConnectionDetails, userId, cancellationToken);
                }
                
                var connectionString = _connectionStringBuilder.GetConnectionString(null, request.ConnectionDetails);
                return await TestConnectionAsync(connectionString, request.ConnectionDetails.Type, userId, cancellationToken);
            }
            
            return new DatabaseConnectionTestResponse
            {
                IsSuccessful = false,
                Message = "Either ConnectionId or ConnectionDetails must be provided",
                TestedAt = DateTime.UtcNow,
                ResponseTime = TimeSpan.Zero
            };
        }

        private void ConfigureDbContext(DbContextOptionsBuilder optionsBuilder, string connectionString, DatabaseType databaseType)
        {
            switch (databaseType)
            {
                case DatabaseType.SqlServer:
                    optionsBuilder.UseSqlServer(connectionString, options =>
                    {
                        options.CommandTimeout(DefaultTimeoutSeconds);
                        options.EnableRetryOnFailure(
                            maxRetryCount: 1,
                            maxRetryDelay: TimeSpan.FromSeconds(2),
                            errorNumbersToAdd: null);
                    });
                    break;
                    
                case DatabaseType.PostgreSQL:
                    optionsBuilder.UseNpgsql(connectionString, options =>
                    {
                        options.CommandTimeout(DefaultTimeoutSeconds);
                        options.EnableRetryOnFailure(
                            maxRetryCount: 1,
                            maxRetryDelay: TimeSpan.FromSeconds(2),
                            errorCodesToAdd: null);
                    });
                    break;
                    
                case DatabaseType.MySQL:
                    optionsBuilder.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString), options =>
                    {
                        options.CommandTimeout(DefaultTimeoutSeconds);
                        options.EnableRetryOnFailure(
                            maxRetryCount: 1,
                            maxRetryDelay: TimeSpan.FromSeconds(2),
                            errorNumbersToAdd: null);
                    });
                    break;
                    
                case DatabaseType.SQLite:
                    optionsBuilder.UseSqlite(connectionString, options =>
                    {
                        options.CommandTimeout(DefaultTimeoutSeconds);
                    });
                    break;
                    
                case DatabaseType.Oracle:
                    // Oracle requires a separate package: Oracle.EntityFrameworkCore
                    // Uncomment the following lines after installing Oracle.EntityFrameworkCore package
                    // optionsBuilder.UseOracle(connectionString, options =>
                    // {
                    //     options.CommandTimeout(DefaultTimeoutSeconds);
                    // });
                    throw new NotSupportedException("Oracle support requires Oracle.EntityFrameworkCore package to be installed");
                    // break;
                    
                default:
                    throw new NotSupportedException($"Database type {databaseType} is not supported for EF Core connection testing");
            }
        }

        private async Task<Dictionary<string, object>> GetConnectionInfoAsync(
            ApplicationDbContext context, 
            DatabaseType databaseType,
            CancellationToken cancellationToken)
        {
            var info = new Dictionary<string, object>
            {
                { "Provider", context.Database.ProviderName ?? "Unknown" }
            };

            try
            {
                var connection = context.Database.GetDbConnection();
                
                // Open connection if not already open
                if (connection.State != System.Data.ConnectionState.Open)
                {
                    await context.Database.OpenConnectionAsync(cancellationToken);
                }

                // Add common properties
                if (!string.IsNullOrEmpty(connection.ServerVersion))
                {
                    info["ServerVersion"] = connection.ServerVersion;
                }
                
                if (!string.IsNullOrEmpty(connection.Database))
                {
                    info["Database"] = connection.Database;
                }

                // Database-specific information
                switch (databaseType)
                {
                    case DatabaseType.SqlServer:
                        if (connection is SqlConnection sqlConn)
                        {
                            info["DataSource"] = sqlConn.DataSource;
                            info["PacketSize"] = sqlConn.PacketSize;
                        }
                        break;
                        
                    case DatabaseType.PostgreSQL:
                        if (connection is NpgsqlConnection pgConn)
                        {
                            info["Host"] = pgConn.Host;
                            info["Port"] = pgConn.Port;
                            info["PostgreSqlVersion"] = pgConn.PostgreSqlVersion?.ToString() ?? "Unknown";
                        }
                        break;
                        
                    case DatabaseType.MySQL:
                        if (connection is MySqlConnection mysqlConn)
                        {
                            info["DataSource"] = mysqlConn.DataSource;
                        }
                        break;
                }

                // Close the connection
                await context.Database.CloseConnectionAsync();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to get additional connection info for {DatabaseType}", databaseType);
            }

            return info;
        }

        private DatabaseConnectionTestResponse CreateErrorResponse(
            Exception exception, 
            DatabaseType databaseType, 
            DateTime startTime, 
            string userMessage)
        {
            var errorCode = GetErrorCode(exception, databaseType);
            var detailedMessage = GetUserFriendlyErrorMessage(exception, databaseType);
            
            _logger.LogError(exception, "Connection test failed for {DatabaseType} with error code {ErrorCode}", 
                databaseType, errorCode);
            
            return new DatabaseConnectionTestResponse
            {
                IsSuccessful = false,
                Message = $"{userMessage}: {detailedMessage}",
                TestedAt = DateTime.UtcNow,
                ResponseTime = DateTime.UtcNow - startTime,
                ErrorCode = errorCode,
                ErrorDetails = GetSanitizedErrorDetails(exception)
            };
        }

        private string GetErrorCode(Exception exception, DatabaseType databaseType)
        {
            return exception switch
            {
                SqlException sqlEx => $"SQL_{sqlEx.Number}",
                NpgsqlException pgEx when pgEx.SqlState != null => $"PG_{pgEx.SqlState}",
                MySqlException mysqlEx => $"MYSQL_{mysqlEx.Number}",
                // OracleException oraEx => $"ORA_{oraEx.Number}",
                TimeoutException => "TIMEOUT",
                UnauthorizedAccessException => "UNAUTHORIZED",
                InvalidOperationException => "INVALID_CONFIG",
                _ => $"{databaseType}_ERROR"
            };
        }

        private string GetUserFriendlyErrorMessage(Exception exception, DatabaseType databaseType)
        {
            return exception switch
            {
                SqlException sqlEx => GetSqlServerErrorMessage(sqlEx),
                NpgsqlException pgEx => GetPostgreSqlErrorMessage(pgEx),
                MySqlException mysqlEx => GetMySqlErrorMessage(mysqlEx),
                TimeoutException => "The connection attempt timed out. Please check your network connectivity and server availability.",
                UnauthorizedAccessException => "Access denied. Please check your credentials.",
                InvalidOperationException invEx when invEx.Message.Contains("connection string") => 
                    "Invalid connection configuration. Please verify your connection settings.",
                _ => "Unable to connect to the database. Please verify your connection settings and try again."
            };
        }

        private string GetSqlServerErrorMessage(SqlException ex)
        {
            return ex.Number switch
            {
                -1 => "Cannot connect to SQL Server. Please verify the server address and network connectivity.",
                2 => "SQL Server not found or network error. Please check the server name and instance.",
                4060 => "Cannot open database. Please verify the database name exists.",
                18456 => "Login failed. Please check your username and password.",
                _ => $"SQL Server error: {ex.Message}"
            };
        }

        private string GetPostgreSqlErrorMessage(NpgsqlException ex)
        {
            return ex.SqlState switch
            {
                "28P01" => "Authentication failed. Please check your username and password.",
                "3D000" => "Database does not exist. Please verify the database name.",
                "08001" => "Unable to connect to PostgreSQL server. Please check the server address and port.",
                "08006" => "Connection failure. The server may be down or unreachable.",
                _ => $"PostgreSQL error: {ex.Message}"
            };
        }

        private string GetMySqlErrorMessage(MySqlException ex)
        {
            return ex.Number switch
            {
                1042 => "Unable to connect to MySQL server. Please check the server address.",
                1044 => "Access denied to database. Please check your permissions.",
                1045 => "Access denied. Please check your username and password.",
                1049 => "Unknown database. Please verify the database name.",
                _ => $"MySQL error: {ex.Message}"
            };
        }

        private string GetSanitizedErrorDetails(Exception exception)
        {
            // Remove sensitive information from error messages
            var message = exception.Message;
            
            // Remove potential passwords or connection strings
            message = System.Text.RegularExpressions.Regex.Replace(
                message, 
                @"(password|pwd|pass)=[^;]+", 
                "password=***", 
                System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            
            message = System.Text.RegularExpressions.Regex.Replace(
                message, 
                @"(apikey|api_key|key)=[^;]+", 
                "apikey=***", 
                System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            
            return message;
        }

        private async Task<DatabaseConnectionTestResponse> TestGitHubApiConnectionAsync(
            DatabaseConnection connection,
            Guid userId,
            CancellationToken cancellationToken = default)
        {
            var startTime = DateTime.UtcNow;
            
            try
            {
                _logger.LogInformation("User {UserId} testing GitHub API connection {ConnectionName}", userId, connection.Name);
                
                using var httpClient = new HttpClient();
                httpClient.DefaultRequestHeaders.Add("User-Agent", "CAMS-Application");
                
                var token = connection.GitHubToken ?? connection.ApiKey;
                if (string.IsNullOrEmpty(token))
                {
                    return new DatabaseConnectionTestResponse
                    {
                        IsSuccessful = false,
                        Message = "GitHub token is required for authentication",
                        TestedAt = DateTime.UtcNow,
                        ResponseTime = DateTime.UtcNow - startTime,
                        ErrorCode = "GITHUB_NO_TOKEN"
                    };
                }
                
                httpClient.DefaultRequestHeaders.Add("Authorization", $"token {token}");
                
                // Test user authentication
                var response = await httpClient.GetAsync("https://api.github.com/user", cancellationToken);
                
                if (response.IsSuccessStatusCode)
                {
                    var userInfo = await response.Content.ReadAsStringAsync(cancellationToken);
                    var additionalInfo = new Dictionary<string, object>
                    {
                        { "ApiEndpoint", "https://api.github.com" },
                        { "AuthenticationMethod", "Personal Access Token" },
                        { "RateLimitRemaining", response.Headers.GetValues("X-RateLimit-Remaining").FirstOrDefault() ?? "Unknown" },
                        { "RateLimitReset", response.Headers.GetValues("X-RateLimit-Reset").FirstOrDefault() ?? "Unknown" }
                    };
                    
                    if (!string.IsNullOrEmpty(connection.GitHubOrganization))
                    {
                        additionalInfo["Organization"] = connection.GitHubOrganization;
                    }
                    
                    if (!string.IsNullOrEmpty(connection.GitHubRepository))
                    {
                        additionalInfo["Repository"] = connection.GitHubRepository;
                    }
                    
                    _logger.LogInformation("GitHub API connection test successful for user {UserId}", userId);
                    
                    return new DatabaseConnectionTestResponse
                    {
                        IsSuccessful = true,
                        Message = "GitHub API connection successful",
                        TestedAt = DateTime.UtcNow,
                        ResponseTime = DateTime.UtcNow - startTime,
                        AdditionalInfo = additionalInfo
                    };
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                    var errorCode = response.StatusCode switch
                    {
                        System.Net.HttpStatusCode.Unauthorized => "GITHUB_UNAUTHORIZED",
                        System.Net.HttpStatusCode.Forbidden => "GITHUB_FORBIDDEN",
                        System.Net.HttpStatusCode.NotFound => "GITHUB_NOT_FOUND",
                        _ => $"GITHUB_HTTP_{(int)response.StatusCode}"
                    };
                    
                    _logger.LogWarning("GitHub API connection test failed for user {UserId} with status {StatusCode}: {ErrorContent}", 
                        userId, response.StatusCode, errorContent);
                    
                    return new DatabaseConnectionTestResponse
                    {
                        IsSuccessful = false,
                        Message = $"GitHub API authentication failed: {response.StatusCode}",
                        TestedAt = DateTime.UtcNow,
                        ResponseTime = DateTime.UtcNow - startTime,
                        ErrorCode = errorCode,
                        ErrorDetails = errorContent
                    };
                }
            }
            catch (HttpRequestException httpEx)
            {
                return CreateErrorResponse(httpEx, DatabaseType.GitHub_API, startTime, "GitHub API connection failed");
            }
            catch (TaskCanceledException tcEx) when (tcEx.CancellationToken == cancellationToken)
            {
                return CreateErrorResponse(tcEx, DatabaseType.GitHub_API, startTime, "GitHub API request cancelled");
            }
            catch (Exception ex)
            {
                return CreateErrorResponse(ex, DatabaseType.GitHub_API, startTime, "GitHub API connection test failed");
            }
        }

        private async Task<DatabaseConnectionTestResponse> TestGitHubApiConnectionAsync(
            DatabaseConnectionRequest connectionDetails,
            Guid userId,
            CancellationToken cancellationToken = default)
        {
            var startTime = DateTime.UtcNow;
            
            try
            {
                _logger.LogInformation("User {UserId} testing GitHub API connection with details", userId);
                
                using var httpClient = new HttpClient();
                httpClient.DefaultRequestHeaders.Add("User-Agent", "CAMS-Application");
                
                var token = connectionDetails.ApiKey;
                if (string.IsNullOrEmpty(token))
                {
                    return new DatabaseConnectionTestResponse
                    {
                        IsSuccessful = false,
                        Message = "GitHub token is required for authentication",
                        TestedAt = DateTime.UtcNow,
                        ResponseTime = DateTime.UtcNow - startTime,
                        ErrorCode = "GITHUB_NO_TOKEN"
                    };
                }
                
                httpClient.DefaultRequestHeaders.Add("Authorization", $"token {token}");
                
                // Test user authentication
                var response = await httpClient.GetAsync("https://api.github.com/user", cancellationToken);
                
                if (response.IsSuccessStatusCode)
                {
                    var userInfo = await response.Content.ReadAsStringAsync(cancellationToken);
                    var additionalInfo = new Dictionary<string, object>
                    {
                        { "ApiEndpoint", "https://api.github.com" },
                        { "AuthenticationMethod", "Personal Access Token" },
                        { "RateLimitRemaining", response.Headers.GetValues("X-RateLimit-Remaining").FirstOrDefault() ?? "Unknown" },
                        { "RateLimitReset", response.Headers.GetValues("X-RateLimit-Reset").FirstOrDefault() ?? "Unknown" }
                    };
                    
                    if (!string.IsNullOrEmpty(connectionDetails.Username))
                    {
                        additionalInfo["Organization"] = connectionDetails.Username;
                    }
                    
                    if (!string.IsNullOrEmpty(connectionDetails.Password))
                    {
                        additionalInfo["Repository"] = connectionDetails.Password;
                    }
                    
                    _logger.LogInformation("GitHub API connection test successful for user {UserId}", userId);
                    
                    return new DatabaseConnectionTestResponse
                    {
                        IsSuccessful = true,
                        Message = "GitHub API connection successful",
                        TestedAt = DateTime.UtcNow,
                        ResponseTime = DateTime.UtcNow - startTime,
                        AdditionalInfo = additionalInfo
                    };
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                    var errorCode = response.StatusCode switch
                    {
                        System.Net.HttpStatusCode.Unauthorized => "GITHUB_UNAUTHORIZED",
                        System.Net.HttpStatusCode.Forbidden => "GITHUB_FORBIDDEN",
                        System.Net.HttpStatusCode.NotFound => "GITHUB_NOT_FOUND",
                        _ => $"GITHUB_HTTP_{(int)response.StatusCode}"
                    };
                    
                    _logger.LogWarning("GitHub API connection test failed for user {UserId} with status {StatusCode}: {ErrorContent}", 
                        userId, response.StatusCode, errorContent);
                    
                    return new DatabaseConnectionTestResponse
                    {
                        IsSuccessful = false,
                        Message = $"GitHub API authentication failed: {response.StatusCode}",
                        TestedAt = DateTime.UtcNow,
                        ResponseTime = DateTime.UtcNow - startTime,
                        ErrorCode = errorCode,
                        ErrorDetails = errorContent
                    };
                }
            }
            catch (HttpRequestException httpEx)
            {
                return CreateErrorResponse(httpEx, DatabaseType.GitHub_API, startTime, "GitHub API connection failed");
            }
            catch (TaskCanceledException tcEx) when (tcEx.CancellationToken == cancellationToken)
            {
                return CreateErrorResponse(tcEx, DatabaseType.GitHub_API, startTime, "GitHub API request cancelled");
            }
            catch (Exception ex)
            {
                return CreateErrorResponse(ex, DatabaseType.GitHub_API, startTime, "GitHub API connection test failed");
            }
        }

        public ConnectionStringValidationResponse ValidateConnectionString(string connectionString, DatabaseType databaseType)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(connectionString))
                {
                    return new ConnectionStringValidationResponse
                    {
                        IsValid = false,
                        Message = "Connection string cannot be empty"
                    };
                }

                var components = new ConnectionStringComponents();

                switch (databaseType)
                {
                    case DatabaseType.SqlServer:
                        var sqlBuilder = new SqlConnectionStringBuilder(connectionString);
                        components.Server = sqlBuilder.DataSource;
                        components.Database = sqlBuilder.InitialCatalog;
                        components.Username = sqlBuilder.UserID;
                        components.UseIntegratedSecurity = sqlBuilder.IntegratedSecurity;
                        components.ConnectionTimeout = sqlBuilder.ConnectTimeout;
                        components.CommandTimeout = sqlBuilder.CommandTimeout;
                        break;
                        
                    case DatabaseType.PostgreSQL:
                        var pgBuilder = new NpgsqlConnectionStringBuilder(connectionString);
                        components.Server = pgBuilder.Host;
                        components.Database = pgBuilder.Database;
                        components.Username = pgBuilder.Username;
                        components.Port = pgBuilder.Port;
                        components.UseIntegratedSecurity = false; // PostgreSQL doesn't support Windows integrated security
                        components.ConnectionTimeout = pgBuilder.Timeout;
                        components.CommandTimeout = pgBuilder.CommandTimeout;
                        break;
                        
                    case DatabaseType.MySQL:
                        var mysqlBuilder = new MySqlConnectionStringBuilder(connectionString);
                        components.Server = mysqlBuilder.Server;
                        components.Database = mysqlBuilder.Database;
                        components.Username = mysqlBuilder.UserID;
                        components.Port = (int)mysqlBuilder.Port;
                        components.ConnectionTimeout = (int)mysqlBuilder.ConnectionTimeout;
                        components.CommandTimeout = (int)mysqlBuilder.DefaultCommandTimeout;
                        break;
                        
                    case DatabaseType.SQLite:
                        var sqliteBuilder = new SqliteConnectionStringBuilder(connectionString);
                        components.Server = sqliteBuilder.DataSource;
                        // SQLite doesn't have these properties
                        components.Database = sqliteBuilder.DataSource;
                        break;
                        
                    case DatabaseType.Oracle:
                        // Oracle support requires Oracle.ManagedDataAccess.Client package
                        return new ConnectionStringValidationResponse
                        {
                            IsValid = false,
                            Message = "Oracle connection string validation requires Oracle.ManagedDataAccess.Client package"
                        };
                        
                    default:
                        // For unsupported types, just check if the string is not empty
                        return new ConnectionStringValidationResponse
                        {
                            IsValid = !string.IsNullOrWhiteSpace(connectionString),
                            Message = $"Basic validation only for {databaseType}",
                            ParsedComponents = components
                        };
                }

                return new ConnectionStringValidationResponse
                {
                    IsValid = true,
                    Message = "Connection string is valid",
                    ParsedComponents = components
                };
            }
            catch (ArgumentException ex)
            {
                return new ConnectionStringValidationResponse
                {
                    IsValid = false,
                    Message = $"Invalid connection string format: {ex.Message}"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating connection string for {DatabaseType}", databaseType);
                return new ConnectionStringValidationResponse
                {
                    IsValid = false,
                    Message = $"Error validating connection string: {ex.Message}"
                };
            }
        }
    }
}