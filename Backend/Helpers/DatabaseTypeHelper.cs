using cams.Backend.Enums;

namespace cams.Backend.Helpers
{
    public static class DatabaseTypeHelper
    {
        /// <summary>
        /// Gets the display name for a database type
        /// </summary>
        /// <param name="type">The database type</param>
        /// <returns>Human-readable display name</returns>
        public static string GetDisplayName(DatabaseType type)
        {
            return type switch
            {
                DatabaseType.SqlServer => "Microsoft SQL Server",
                DatabaseType.MySQL => "MySQL",
                DatabaseType.PostgreSQL => "PostgreSQL",
                DatabaseType.Oracle => "Oracle Database",
                DatabaseType.SQLite => "SQLite",
                DatabaseType.MongoDB => "MongoDB",
                DatabaseType.Redis => "Redis",
                DatabaseType.RestApi => "REST API",
                DatabaseType.GraphQL => "GraphQL API",
                DatabaseType.WebSocket => "WebSocket",
                DatabaseType.Custom => "Custom Connection",
                _ => type.ToString()
            };
        }

        /// <summary>
        /// Gets the category for a database type
        /// </summary>
        /// <param name="type">The database type</param>
        /// <returns>Database category</returns>
        public static string GetCategory(DatabaseType type)
        {
            return type switch
            {
                DatabaseType.SqlServer or 
                DatabaseType.MySQL or 
                DatabaseType.PostgreSQL or 
                DatabaseType.Oracle or 
                DatabaseType.SQLite => "Relational Database",
                
                DatabaseType.MongoDB => "Document Database",
                DatabaseType.Redis => "Key-Value Store",
                
                DatabaseType.RestApi or 
                DatabaseType.GraphQL or 
                DatabaseType.WebSocket => "API Connection",
                
                DatabaseType.Custom => "Custom",
                _ => "Other"
            };
        }

        /// <summary>
        /// Gets all database types with their metadata
        /// </summary>
        /// <returns>List of database type information</returns>
        public static IEnumerable<DatabaseTypeInfo> GetAllDatabaseTypes()
        {
            return Enum.GetValues<DatabaseType>()
                .Select(t => new DatabaseTypeInfo
                {
                    Value = (int)t,
                    Name = t.ToString(),
                    DisplayName = GetDisplayName(t),
                    Category = GetCategory(t)
                });
        }

        /// <summary>
        /// Checks if a database type is a relational database
        /// </summary>
        /// <param name="type">The database type</param>
        /// <returns>True if relational, false otherwise</returns>
        public static bool IsRelationalDatabase(DatabaseType type)
        {
            return type is DatabaseType.SqlServer or 
                          DatabaseType.MySQL or 
                          DatabaseType.PostgreSQL or 
                          DatabaseType.Oracle or 
                          DatabaseType.SQLite;
        }

        /// <summary>
        /// Checks if a database type is an API connection
        /// </summary>
        /// <param name="type">The database type</param>
        /// <returns>True if API connection, false otherwise</returns>
        public static bool IsApiConnection(DatabaseType type)
        {
            return type is DatabaseType.RestApi or 
                          DatabaseType.GraphQL or 
                          DatabaseType.WebSocket;
        }
    }

    public class DatabaseTypeInfo
    {
        public int Value { get; set; }
        public string Name { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
    }
}