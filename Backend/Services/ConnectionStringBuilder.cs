using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using cams.Backend.Configuration;
using cams.Backend.Model;
using cams.Backend.View;
using cams.Backend.Enums;

namespace cams.Backend.Services
{
    public class ConnectionStringBuilder : IConnectionStringBuilder
    {
        private readonly JwtSettings _jwtSettings;

        public ConnectionStringBuilder(IOptions<JwtSettings> jwtSettings)
        {
            _jwtSettings = jwtSettings.Value;
        }

        public string GetConnectionString(DatabaseConnection? connection, DatabaseConnectionRequest? connectionDetails)
        {
            if (connection == null && connectionDetails == null)
                throw new ArgumentException("Either connection or connectionDetails must be provided");

            var type = connection?.Type ?? connectionDetails!.Type;
            var isConnectionStringType = type == DatabaseType.SqlServer || 
                                       type == DatabaseType.MySQL || 
                                       type == DatabaseType.PostgreSQL ||
                                       type == DatabaseType.Oracle ||
                                       type == DatabaseType.SQLite;

            if (isConnectionStringType)
            {
                // For connection string types, prefer the connection string if provided
                var connectionString = connection?.ConnectionString ?? connectionDetails?.ConnectionString;
                if (!string.IsNullOrEmpty(connectionString))
                {
                    return connection != null ? DecryptString(connectionString) : connectionString;
                }

                // Otherwise, build from components
                return BuildConnectionString(connection, connectionDetails);
            }
            else if (type == DatabaseType.RestApi)
            {
                // For REST API, return the base URL
                return connection?.ApiBaseUrl ?? connectionDetails?.ApiBaseUrl ?? string.Empty;
            }

            throw new NotSupportedException($"Database type {type} is not supported");
        }

        private string BuildConnectionString(DatabaseConnection? connection, DatabaseConnectionRequest? connectionDetails)
        {
            var type = connection?.Type ?? connectionDetails!.Type;
            var server = connection?.Server ?? connectionDetails?.Server ?? "";
            var database = connection?.Database ?? connectionDetails?.Database ?? "";
            var username = connection?.Username ?? connectionDetails?.Username ?? "";
            var password = connection != null 
                ? DecryptString(connection.PasswordHash ?? "") 
                : connectionDetails?.Password ?? "";
            var port = connection?.Port ?? connectionDetails?.Port;
            var additionalSettings = connection?.AdditionalSettings ?? connectionDetails?.AdditionalSettings ?? "";

            switch (type)
            {
                case DatabaseType.SqlServer:
                    var sqlBuilder = new StringBuilder($"Server={server}");
                    if (port.HasValue && port.Value != 1433)
                        sqlBuilder.Append($",{port}");
                    
                    sqlBuilder.Append($";Database={database}");
                    
                    if (!string.IsNullOrEmpty(username))
                    {
                        sqlBuilder.Append($";User Id={username};Password={password}");
                    }
                    else
                    {
                        sqlBuilder.Append(";Integrated Security=true");
                    }
                    
                    if (!string.IsNullOrEmpty(additionalSettings))
                        sqlBuilder.Append($";{additionalSettings}");
                    
                    return sqlBuilder.ToString();

                case DatabaseType.MySQL:
                    var mysqlBuilder = new StringBuilder($"Server={server}");
                    if (port.HasValue)
                        mysqlBuilder.Append($";Port={port}");
                    else
                        mysqlBuilder.Append(";Port=3306");
                    
                    mysqlBuilder.Append($";Database={database}");
                    mysqlBuilder.Append($";User={username};Password={password}");
                    
                    if (!string.IsNullOrEmpty(additionalSettings))
                        mysqlBuilder.Append($";{additionalSettings}");
                    
                    return mysqlBuilder.ToString();

                case DatabaseType.PostgreSQL:
                    var pgBuilder = new StringBuilder($"Host={server}");
                    if (port.HasValue)
                        pgBuilder.Append($";Port={port}");
                    else
                        pgBuilder.Append(";Port=5432");
                    
                    pgBuilder.Append($";Database={database}");
                    pgBuilder.Append($";Username={username};Password={password}");
                    
                    if (!string.IsNullOrEmpty(additionalSettings))
                        pgBuilder.Append($";{additionalSettings}");
                    
                    return pgBuilder.ToString();

                case DatabaseType.Oracle:
                    var oracleBuilder = new StringBuilder($"Data Source={server}");
                    if (port.HasValue)
                        oracleBuilder.Append($":{port}");
                    else
                        oracleBuilder.Append(":1521");
                    
                    if (!string.IsNullOrEmpty(database))
                        oracleBuilder.Append($"/{database}");
                    
                    oracleBuilder.Append($";User Id={username};Password={password}");
                    
                    if (!string.IsNullOrEmpty(additionalSettings))
                        oracleBuilder.Append($";{additionalSettings}");
                    
                    return oracleBuilder.ToString();

                case DatabaseType.SQLite:
                    return $"Data Source={database}";

                default:
                    throw new NotSupportedException($"Database type {type} is not supported");
            }
        }

        private string DecryptString(string encryptedText)
        {
            if (string.IsNullOrEmpty(encryptedText))
                return encryptedText;

            try
            {
                var key = Encoding.UTF8.GetBytes(_jwtSettings.Secret.PadRight(32).Substring(0, 32));
                var fullCipher = Convert.FromBase64String(encryptedText);

                using var aes = Aes.Create();
                aes.Key = key;
                
                var iv = new byte[16];
                var cipher = new byte[fullCipher.Length - 16];
                
                Buffer.BlockCopy(fullCipher, 0, iv, 0, iv.Length);
                Buffer.BlockCopy(fullCipher, iv.Length, cipher, 0, cipher.Length);
                
                aes.IV = iv;

                using var decryptor = aes.CreateDecryptor();
                using var msDecrypt = new MemoryStream(cipher);
                using var csDecrypt = new CryptoStream(msDecrypt, decryptor, CryptoStreamMode.Read);
                using var srDecrypt = new StreamReader(csDecrypt);
                
                return srDecrypt.ReadToEnd();
            }
            catch
            {
                // If decryption fails, assume it's not encrypted
                return encryptedText;
            }
        }
    }
}