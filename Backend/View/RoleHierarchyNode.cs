namespace cams.Backend.View;

public class RoleHierarchyNode
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsSystem { get; set; }
    public bool IsActive { get; set; }
    public int UserCount { get; set; }
    public Guid? ParentRoleId { get; set; }
    public int Level { get; set; }
    public List<RoleHierarchyNode> Children { get; set; } = new();
}