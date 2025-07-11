namespace cams.Backend.View
{
    public class RoleHierarchyResponse
    {
        public List<RoleHierarchyNode> Roles { get; set; } = new();
        public int TotalRoles { get; set; }
        public int MaxDepth { get; set; }
    }
}