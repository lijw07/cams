using cams.Backend.Model;
using cams.Backend.Enums;

namespace Cams.Tests.Builders;

public class DatabaseConnectionBuilder
{
    private DatabaseConnection _connection;

    public DatabaseConnectionBuilder()
    {
        _connection = new DatabaseConnection
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            ApplicationId = Guid.NewGuid(),
            Name = "Test Connection",
            Description = "Test Connection Description",
            Type = DatabaseType.SqlServer,
            Server = "localhost",
            Port = 1433,
            Database = "TestDB",
            Username = "testuser",
            PasswordHash = "encryptedpassword",
            IsActive = true,
            Status = ConnectionStatus.Connected,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public static DatabaseConnectionBuilder Create() => new DatabaseConnectionBuilder();

    public DatabaseConnectionBuilder WithId(Guid id)
    {
        _connection.Id = id;
        return this;
    }

    public DatabaseConnectionBuilder WithApplicationId(Guid applicationId)
    {
        _connection.ApplicationId = applicationId;
        return this;
    }

    public DatabaseConnectionBuilder WithUserId(Guid userId)
    {
        _connection.UserId = userId;
        return this;
    }

    public DatabaseConnectionBuilder WithName(string name)
    {
        _connection.Name = name;
        return this;
    }

    public DatabaseConnectionBuilder WithType(DatabaseType type)
    {
        _connection.Type = type;
        return this;
    }

    public DatabaseConnectionBuilder WithServer(string server, int? port = null)
    {
        _connection.Server = server;
        _connection.Port = port;
        return this;
    }

    public DatabaseConnectionBuilder WithDatabase(string database)
    {
        _connection.Database = database;
        return this;
    }

    public DatabaseConnectionBuilder WithCredentials(string username, string passwordHash)
    {
        _connection.Username = username;
        _connection.PasswordHash = passwordHash;
        return this;
    }

    public DatabaseConnectionBuilder WithConnectionString(string connectionString)
    {
        _connection.ConnectionString = connectionString;
        return this;
    }

    public DatabaseConnectionBuilder AsInactive()
    {
        _connection.IsActive = false;
        return this;
    }

    public DatabaseConnectionBuilder WithStatus(ConnectionStatus status)
    {
        _connection.Status = status;
        return this;
    }

    public DatabaseConnection Build() => _connection;
}