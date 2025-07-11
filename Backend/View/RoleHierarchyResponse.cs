namespace cams.Backend.View
{
    public class RoleHierarchyResponse
    {
        public List<RoleHierarchyNode> Roles { get; set; } = new();
        public int TotalRoles { get; set; }
        public int MaxDepth { get; set; }
    }

    public class RoleHierarchyNode
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsSystem { get; set; }
        public bool IsActive { get; set; }
        public int UserCount { get; set; }
        public int? ParentRoleId { get; set; }
        public int Level { get; set; }
        public List<RoleHierarchyNode> Children { get; set; } = new();
    }
}