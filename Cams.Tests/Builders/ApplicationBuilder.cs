using cams.Backend.Model;

namespace Cams.Tests.Builders;

public class ApplicationBuilder
{
    private Application _application;

    public ApplicationBuilder()
    {
        _application = new Application
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Name = "Test Application",
            Description = "Test Description",
            Version = "1.0.0",
            Environment = "Development",
            Tags = "test,sample",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            DatabaseConnections = new List<DatabaseConnection>()
        };
    }

    public ApplicationBuilder WithId(Guid id)
    {
        _application.Id = id;
        return this;
    }

    public ApplicationBuilder WithUserId(Guid userId)
    {
        _application.UserId = userId;
        return this;
    }

    public ApplicationBuilder WithName(string name)
    {
        _application.Name = name;
        return this;
    }

    public ApplicationBuilder WithDescription(string description)
    {
        _application.Description = description;
        return this;
    }

    public ApplicationBuilder AsInactive()
    {
        _application.IsActive = false;
        return this;
    }

    public ApplicationBuilder WithDatabaseConnections(params DatabaseConnection[] connections)
    {
        _application.DatabaseConnections = connections.ToList();
        return this;
    }

    public Application Build() => _application;
}