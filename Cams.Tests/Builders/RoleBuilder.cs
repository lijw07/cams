using cams.Backend.Model;

namespace Cams.Tests.Builders;

public class RoleBuilder
{
    private Role _role;

    public RoleBuilder()
    {
        _role = new Role
        {
            Id = Guid.NewGuid(),
            Name = "TestRole",
            Description = "Test role description",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            UserRoles = new List<UserRole>()
        };
    }

    public static RoleBuilder Create() => new RoleBuilder();

    public RoleBuilder WithId(Guid id)
    {
        _role.Id = id;
        return this;
    }

    public RoleBuilder WithName(string name)
    {
        _role.Name = name;
        return this;
    }

    public RoleBuilder WithDescription(string description)
    {
        _role.Description = description;
        return this;
    }

    public RoleBuilder WithActive(bool isActive)
    {
        _role.IsActive = isActive;
        return this;
    }

    public RoleBuilder AsInactive()
    {
        _role.IsActive = false;
        return this;
    }

    public Role Build() => _role;
}