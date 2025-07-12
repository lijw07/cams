#!/bin/bash

echo "Fixing failing tests in CAMS project..."

# Fix UsersControllerTests
echo "Fixing UsersControllerTests..."
sed -i '' 's/_controller.ControllerContext = CreateControllerContext(userId);/_controller.ControllerContext = CreateControllerContext(userId, "Platform_Admin");/g' Cams.Tests/Controllers/UsersControllerTests.cs

# Fix specific test methods that need different roles
# GetUsers_WithSearchTerm_ReturnsFilteredResults needs Platform_Admin role
sed -i '' '/public async Task GetUsers_WithSearchTerm_ReturnsFilteredResults/,/^    \[Fact\]/{s/CreateControllerContext(userId, "Platform_Admin");/CreateControllerContext(userId, "Platform_Admin");/g}' Cams.Tests/Controllers/UsersControllerTests.cs

# Fix RoleControllerTests that need specific roles
echo "Fixing RoleControllerTests..."
# GetRoleStats_WhenRoleNotFound_ReturnsNotFound needs Platform_Admin role
sed -i '' '/public async Task GetRoleStats_WhenRoleNotFound_ReturnsNotFound/,/^    \[Fact\]/{s/CreateControllerContext(userId);/CreateControllerContext(userId, "Platform_Admin");/g}' Cams.Tests/Controllers/RoleControllerTests.cs

# AssignUsersToRole_WhenAssignmentFails_ReturnsBadRequest needs Platform_Admin role
sed -i '' '/public async Task AssignUsersToRole_WhenAssignmentFails_ReturnsBadRequest/,/^    \[Fact\]/{s/CreateControllerContext(userId);/CreateControllerContext(userId, "Platform_Admin");/g}' Cams.Tests/Controllers/RoleControllerTests.cs

echo "Running tests to verify fixes..."
dotnet test --filter "FullyQualifiedName~UsersControllerTests|FullyQualifiedName~RoleControllerTests" --no-restore --verbosity minimal

echo "Done!"