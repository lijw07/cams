using Xunit;
using FluentAssertions;
using cams.Backend.Helpers;
using cams.Backend.Model;
using cams.Backend.Constants;
using Cams.Tests.Builders;

namespace Cams.Tests.Helpers
{
    public class RoleHelperTests
    {
        #region Constants Tests

        [Fact]
        public void RoleConstants_ShouldMatchExpectedValues()
        {
            // Assert
            RoleHelper.PLATFORM_ADMIN.Should().Be("PlatformAdmin");
            RoleHelper.ADMIN.Should().Be("Admin");
            RoleHelper.USER.Should().Be("User");
        }

        [Fact]
        public void RoleConstants_ShouldMatchBackingConstants()
        {
            // Assert
            RoleHelper.PLATFORM_ADMIN.Should().Be(RoleConstants.PLATFORM_ADMIN);
            RoleHelper.ADMIN.Should().Be(RoleConstants.ADMIN);
            RoleHelper.USER.Should().Be(RoleConstants.USER);
        }

        #endregion

        #region HasRole Tests

        [Fact]
        public void HasRole_WithNullUser_ReturnsFalse()
        {
            // Arrange
            User? user = null;

            // Act
            var result = RoleHelper.HasRole(user!, RoleHelper.ADMIN);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void HasRole_WithUserWithNullUserRoles_ReturnsFalse()
        {
            // Arrange
            var user = UserBuilder.Create().Build();
            user.UserRoles = null!;

            // Act
            var result = RoleHelper.HasRole(user, RoleHelper.ADMIN);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void HasRole_WithEmptyRequiredRoles_ReturnsFalse()
        {
            // Arrange
            var user = UserBuilder.Create().Build();

            // Act
            var result = RoleHelper.HasRole(user);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void HasRole_WithUserHavingMatchingActiveRole_ReturnsTrue()
        {
            // Arrange
            var role = RoleBuilder.Create().WithName(RoleHelper.ADMIN).Build();
            var userRole = new UserRole
            {
                Role = role,
                IsActive = true
            };
            var user = UserBuilder.Create().WithRoles(userRole).Build();

            // Act
            var result = RoleHelper.HasRole(user, RoleHelper.ADMIN);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public void HasRole_WithUserHavingInactiveRole_ReturnsFalse()
        {
            // Arrange
            var role = RoleBuilder.Create().WithName(RoleHelper.ADMIN).Build();
            var userRole = new UserRole
            {
                Role = role,
                IsActive = false
            };
            var user = UserBuilder.Create().WithRoles(userRole).Build();

            // Act
            var result = RoleHelper.HasRole(user, RoleHelper.ADMIN);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void HasRole_WithUserHavingRoleButRoleIsInactive_ReturnsFalse()
        {
            // Arrange
            var role = RoleBuilder.Create().WithName(RoleHelper.ADMIN).AsInactive().Build();
            var userRole = new UserRole
            {
                Role = role,
                IsActive = true
            };
            var user = UserBuilder.Create().WithRoles(userRole).Build();

            // Act
            var result = RoleHelper.HasRole(user, RoleHelper.ADMIN);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void HasRole_WithUserHavingBothUserRoleAndRoleInactive_ReturnsFalse()
        {
            // Arrange
            var role = RoleBuilder.Create().WithName(RoleHelper.ADMIN).AsInactive().Build();
            var userRole = new UserRole
            {
                Role = role,
                IsActive = false
            };
            var user = UserBuilder.Create().WithRoles(userRole).Build();

            // Act
            var result = RoleHelper.HasRole(user, RoleHelper.ADMIN);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void HasRole_WithCaseInsensitiveRoleComparison_ReturnsTrue()
        {
            // Arrange
            var role = RoleBuilder.Create().WithName("admin").Build(); // lowercase
            var userRole = new UserRole
            {
                Role = role,
                IsActive = true
            };
            var user = UserBuilder.Create().WithRoles(userRole).Build();

            // Act
            var result = RoleHelper.HasRole(user, "ADMIN"); // uppercase

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public void HasRole_WithMultipleRequiredRoles_ReturnsTrueIfAnyMatch()
        {
            // Arrange
            var adminRole = RoleBuilder.Create().WithName(RoleHelper.ADMIN).Build();
            var userRole = new UserRole
            {
                Role = adminRole,
                IsActive = true
            };
            var user = UserBuilder.Create().WithRoles(userRole).Build();

            // Act
            var result = RoleHelper.HasRole(user, RoleHelper.PLATFORM_ADMIN, RoleHelper.ADMIN, RoleHelper.USER);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public void HasRole_WithMultipleUserRoles_ReturnsTrueIfAnyMatch()
        {
            // Arrange
            var adminRole = RoleBuilder.Create().WithName(RoleHelper.ADMIN).Build();
            var userRole1 = RoleBuilder.Create().WithName(RoleHelper.USER).Build();
            
            var userRole = new UserRole { Role = adminRole, IsActive = true };
            var userRole2 = new UserRole { Role = userRole1, IsActive = true };
            
            var user = UserBuilder.Create().WithRoles(userRole, userRole2).Build();

            // Act
            var result = RoleHelper.HasRole(user, RoleHelper.PLATFORM_ADMIN);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void HasRole_WithMixedActiveInactiveRoles_OnlyChecksActiveOnes()
        {
            // Arrange
            var adminRole = RoleBuilder.Create().WithName(RoleHelper.ADMIN).Build();
            var userRole1 = RoleBuilder.Create().WithName(RoleHelper.USER).Build();
            
            var activeUserRole = new UserRole { Role = userRole1, IsActive = true };
            var inactiveUserRole = new UserRole { Role = adminRole, IsActive = false };
            
            var user = UserBuilder.Create().WithRoles(activeUserRole, inactiveUserRole).Build();

            // Act
            var resultAdmin = RoleHelper.HasRole(user, RoleHelper.ADMIN);
            var resultUser = RoleHelper.HasRole(user, RoleHelper.USER);

            // Assert
            resultAdmin.Should().BeFalse();
            resultUser.Should().BeTrue();
        }

        [Theory]
        [InlineData("PlatformAdmin")]
        [InlineData("Admin")]
        [InlineData("User")]
        [InlineData("CustomRole")]
        public void HasRole_WithValidRoleName_WorksCorrectly(string roleName)
        {
            // Arrange
            var role = RoleBuilder.Create().WithName(roleName).Build();
            var userRole = new UserRole
            {
                Role = role,
                IsActive = true
            };
            var user = UserBuilder.Create().WithRoles(userRole).Build();

            // Act
            var result = RoleHelper.HasRole(user, roleName);

            // Assert
            result.Should().BeTrue();
        }

        #endregion

        #region IsAdmin Tests

        [Fact]
        public void IsAdmin_WithNullUser_ReturnsFalse()
        {
            // Act
            var result = RoleHelper.IsAdmin(null!);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void IsAdmin_WithUserHavingAdminRole_ReturnsTrue()
        {
            // Arrange
            var adminRole = RoleBuilder.Create().WithName(RoleHelper.ADMIN).Build();
            var userRole = new UserRole
            {
                Role = adminRole,
                IsActive = true
            };
            var user = UserBuilder.Create().WithRoles(userRole).Build();

            // Act
            var result = RoleHelper.IsAdmin(user);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public void IsAdmin_WithUserHavingPlatformAdminRole_ReturnsTrue()
        {
            // Arrange
            var platformAdminRole = RoleBuilder.Create().WithName(RoleHelper.PLATFORM_ADMIN).Build();
            var userRole = new UserRole
            {
                Role = platformAdminRole,
                IsActive = true
            };
            var user = UserBuilder.Create().WithRoles(userRole).Build();

            // Act
            var result = RoleHelper.IsAdmin(user);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public void IsAdmin_WithUserHavingBothAdminAndPlatformAdminRoles_ReturnsTrue()
        {
            // Arrange
            var adminRole = RoleBuilder.Create().WithName(RoleHelper.ADMIN).Build();
            var platformAdminRole = RoleBuilder.Create().WithName(RoleHelper.PLATFORM_ADMIN).Build();
            
            var userRole1 = new UserRole { Role = adminRole, IsActive = true };
            var userRole2 = new UserRole { Role = platformAdminRole, IsActive = true };
            
            var user = UserBuilder.Create().WithRoles(userRole1, userRole2).Build();

            // Act
            var result = RoleHelper.IsAdmin(user);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public void IsAdmin_WithUserHavingOnlyUserRole_ReturnsFalse()
        {
            // Arrange
            var userRole1 = RoleBuilder.Create().WithName(RoleHelper.USER).Build();
            var userRole = new UserRole
            {
                Role = userRole1,
                IsActive = true
            };
            var user = UserBuilder.Create().WithRoles(userRole).Build();

            // Act
            var result = RoleHelper.IsAdmin(user);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void IsAdmin_WithUserHavingInactiveAdminRole_ReturnsFalse()
        {
            // Arrange
            var adminRole = RoleBuilder.Create().WithName(RoleHelper.ADMIN).Build();
            var userRole = new UserRole
            {
                Role = adminRole,
                IsActive = false
            };
            var user = UserBuilder.Create().WithRoles(userRole).Build();

            // Act
            var result = RoleHelper.IsAdmin(user);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void IsAdmin_WithUserHavingActiveAdminRoleButInactiveRole_ReturnsFalse()
        {
            // Arrange
            var adminRole = RoleBuilder.Create().WithName(RoleHelper.ADMIN).AsInactive().Build();
            var userRole = new UserRole
            {
                Role = adminRole,
                IsActive = true
            };
            var user = UserBuilder.Create().WithRoles(userRole).Build();

            // Act
            var result = RoleHelper.IsAdmin(user);

            // Assert
            result.Should().BeFalse();
        }

        #endregion

        #region IsPlatformAdmin Tests

        [Fact]
        public void IsPlatformAdmin_WithNullUser_ReturnsFalse()
        {
            // Act
            var result = RoleHelper.IsPlatformAdmin(null!);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void IsPlatformAdmin_WithUserHavingPlatformAdminRole_ReturnsTrue()
        {
            // Arrange
            var platformAdminRole = RoleBuilder.Create().WithName(RoleHelper.PLATFORM_ADMIN).Build();
            var userRole = new UserRole
            {
                Role = platformAdminRole,
                IsActive = true
            };
            var user = UserBuilder.Create().WithRoles(userRole).Build();

            // Act
            var result = RoleHelper.IsPlatformAdmin(user);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public void IsPlatformAdmin_WithUserHavingOnlyAdminRole_ReturnsFalse()
        {
            // Arrange
            var adminRole = RoleBuilder.Create().WithName(RoleHelper.ADMIN).Build();
            var userRole = new UserRole
            {
                Role = adminRole,
                IsActive = true
            };
            var user = UserBuilder.Create().WithRoles(userRole).Build();

            // Act
            var result = RoleHelper.IsPlatformAdmin(user);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void IsPlatformAdmin_WithUserHavingOnlyUserRole_ReturnsFalse()
        {
            // Arrange
            var userRole1 = RoleBuilder.Create().WithName(RoleHelper.USER).Build();
            var userRole = new UserRole
            {
                Role = userRole1,
                IsActive = true
            };
            var user = UserBuilder.Create().WithRoles(userRole).Build();

            // Act
            var result = RoleHelper.IsPlatformAdmin(user);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void IsPlatformAdmin_WithUserHavingInactivePlatformAdminRole_ReturnsFalse()
        {
            // Arrange
            var platformAdminRole = RoleBuilder.Create().WithName(RoleHelper.PLATFORM_ADMIN).Build();
            var userRole = new UserRole
            {
                Role = platformAdminRole,
                IsActive = false
            };
            var user = UserBuilder.Create().WithRoles(userRole).Build();

            // Act
            var result = RoleHelper.IsPlatformAdmin(user);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void IsPlatformAdmin_WithUserHavingActivePlatformAdminRoleButInactiveRole_ReturnsFalse()
        {
            // Arrange
            var platformAdminRole = RoleBuilder.Create().WithName(RoleHelper.PLATFORM_ADMIN).AsInactive().Build();
            var userRole = new UserRole
            {
                Role = platformAdminRole,
                IsActive = true
            };
            var user = UserBuilder.Create().WithRoles(userRole).Build();

            // Act
            var result = RoleHelper.IsPlatformAdmin(user);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void IsPlatformAdmin_CaseInsensitive_ReturnsTrue()
        {
            // Arrange
            var platformAdminRole = RoleBuilder.Create().WithName("platformadmin").Build(); // lowercase
            var userRole = new UserRole
            {
                Role = platformAdminRole,
                IsActive = true
            };
            var user = UserBuilder.Create().WithRoles(userRole).Build();

            // Act
            var result = RoleHelper.IsPlatformAdmin(user);

            // Assert
            result.Should().BeTrue();
        }

        #endregion

        #region GetUserRoles Tests

        [Fact]
        public void GetUserRoles_WithNullUser_ReturnsEmptyList()
        {
            // Act
            var result = RoleHelper.GetUserRoles(null!);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetUserRoles_WithUserWithNullUserRoles_ReturnsEmptyList()
        {
            // Arrange
            var user = UserBuilder.Create().Build();
            user.UserRoles = null!;

            // Act
            var result = RoleHelper.GetUserRoles(user);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetUserRoles_WithUserWithNoRoles_ReturnsEmptyList()
        {
            // Arrange
            var user = UserBuilder.Create().Build();

            // Act
            var result = RoleHelper.GetUserRoles(user);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetUserRoles_WithUserWithActiveRoles_ReturnsRoleNames()
        {
            // Arrange
            var adminRole = RoleBuilder.Create().WithName(RoleHelper.ADMIN).Build();
            var userRole1 = RoleBuilder.Create().WithName(RoleHelper.USER).Build();
            
            var userRole = new UserRole { Role = adminRole, IsActive = true };
            var userRole2 = new UserRole { Role = userRole1, IsActive = true };
            
            var user = UserBuilder.Create().WithRoles(userRole, userRole2).Build();

            // Act
            var result = RoleHelper.GetUserRoles(user);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(2);
            result.Should().Contain(RoleHelper.ADMIN);
            result.Should().Contain(RoleHelper.USER);
        }

        [Fact]
        public void GetUserRoles_WithUserWithMixedActiveInactiveRoles_ReturnsOnlyActiveRoleNames()
        {
            // Arrange
            var adminRole = RoleBuilder.Create().WithName(RoleHelper.ADMIN).Build();
            var userRole1 = RoleBuilder.Create().WithName(RoleHelper.USER).Build();
            var platformAdminRole = RoleBuilder.Create().WithName(RoleHelper.PLATFORM_ADMIN).Build();
            
            var activeUserRole = new UserRole { Role = userRole1, IsActive = true };
            var inactiveUserRole = new UserRole { Role = adminRole, IsActive = false };
            var activePlatformAdminRole = new UserRole { Role = platformAdminRole, IsActive = true };
            
            var user = UserBuilder.Create().WithRoles(activeUserRole, inactiveUserRole, activePlatformAdminRole).Build();

            // Act
            var result = RoleHelper.GetUserRoles(user);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(2);
            result.Should().Contain(RoleHelper.USER);
            result.Should().Contain(RoleHelper.PLATFORM_ADMIN);
            result.Should().NotContain(RoleHelper.ADMIN);
        }

        [Fact]
        public void GetUserRoles_WithUserWithActiveUserRoleButInactiveRole_ReturnsEmptyList()
        {
            // Arrange
            var adminRole = RoleBuilder.Create().WithName(RoleHelper.ADMIN).AsInactive().Build();
            var userRole = new UserRole
            {
                Role = adminRole,
                IsActive = true
            };
            var user = UserBuilder.Create().WithRoles(userRole).Build();

            // Act
            var result = RoleHelper.GetUserRoles(user);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetUserRoles_WithUserWithInactiveUserRoleButActiveRole_ReturnsEmptyList()
        {
            // Arrange
            var adminRole = RoleBuilder.Create().WithName(RoleHelper.ADMIN).Build();
            var userRole = new UserRole
            {
                Role = adminRole,
                IsActive = false
            };
            var user = UserBuilder.Create().WithRoles(userRole).Build();

            // Act
            var result = RoleHelper.GetUserRoles(user);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetUserRoles_WithUserWithMultipleActiveRoles_ReturnsAllRoleNames()
        {
            // Arrange
            var adminRole = RoleBuilder.Create().WithName(RoleHelper.ADMIN).Build();
            var platformAdminRole = RoleBuilder.Create().WithName(RoleHelper.PLATFORM_ADMIN).Build();
            var userRole1 = RoleBuilder.Create().WithName(RoleHelper.USER).Build();
            var customRole = RoleBuilder.Create().WithName("CustomRole").Build();
            
            var userRole = new UserRole { Role = adminRole, IsActive = true };
            var userRole2 = new UserRole { Role = platformAdminRole, IsActive = true };
            var userRole3 = new UserRole { Role = userRole1, IsActive = true };
            var userRole4 = new UserRole { Role = customRole, IsActive = true };
            
            var user = UserBuilder.Create().WithRoles(userRole, userRole2, userRole3, userRole4).Build();

            // Act
            var result = RoleHelper.GetUserRoles(user);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(4);
            result.Should().Contain(RoleHelper.ADMIN);
            result.Should().Contain(RoleHelper.PLATFORM_ADMIN);
            result.Should().Contain(RoleHelper.USER);
            result.Should().Contain("CustomRole");
        }

        [Fact]
        public void GetUserRoles_PreservesOriginalRoleNameCasing()
        {
            // Arrange
            var customRole = RoleBuilder.Create().WithName("Custom_Role_With_Underscores").Build();
            var userRole = new UserRole
            {
                Role = customRole,
                IsActive = true
            };
            var user = UserBuilder.Create().WithRoles(userRole).Build();

            // Act
            var result = RoleHelper.GetUserRoles(user);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(1);
            result.Should().Contain("Custom_Role_With_Underscores");
        }

        #endregion

        #region Integration and Security Tests

        [Fact]
        public void AllMethods_WithComplexUserRoleScenario_WorkConsistently()
        {
            // Arrange - User with mixed active/inactive roles and roles
            var adminRole = RoleBuilder.Create().WithName(RoleHelper.ADMIN).Build();
            var platformAdminRole = RoleBuilder.Create().WithName(RoleHelper.PLATFORM_ADMIN).AsInactive().Build(); // Inactive role
            var userRole1 = RoleBuilder.Create().WithName(RoleHelper.USER).Build();
            var customRole = RoleBuilder.Create().WithName("CustomRole").Build();
            
            var activeAdminUserRole = new UserRole { Role = adminRole, IsActive = true };
            var activePlatformAdminUserRole = new UserRole { Role = platformAdminRole, IsActive = true }; // Active UserRole but inactive Role
            var inactiveUserUserRole = new UserRole { Role = userRole1, IsActive = false }; // Inactive UserRole
            var activeCustomUserRole = new UserRole { Role = customRole, IsActive = true };
            
            var user = UserBuilder.Create().WithRoles(
                activeAdminUserRole, 
                activePlatformAdminUserRole, 
                inactiveUserUserRole, 
                activeCustomUserRole
            ).Build();

            // Act
            var hasAdmin = RoleHelper.HasRole(user, RoleHelper.ADMIN);
            var hasPlatformAdmin = RoleHelper.HasRole(user, RoleHelper.PLATFORM_ADMIN);
            var hasUser = RoleHelper.HasRole(user, RoleHelper.USER);
            var hasCustom = RoleHelper.HasRole(user, "CustomRole");
            
            var isAdmin = RoleHelper.IsAdmin(user);
            var isPlatformAdmin = RoleHelper.IsPlatformAdmin(user);
            
            var userRoles = RoleHelper.GetUserRoles(user);

            // Assert
            hasAdmin.Should().BeTrue("user has active Admin role");
            hasPlatformAdmin.Should().BeFalse("PlatformAdmin role itself is inactive");
            hasUser.Should().BeFalse("UserRole for User is inactive");
            hasCustom.Should().BeTrue("user has active CustomRole");
            
            isAdmin.Should().BeTrue("user has Admin role which qualifies as admin");
            isPlatformAdmin.Should().BeFalse("PlatformAdmin role is inactive");
            
            userRoles.Should().HaveCount(2);
            userRoles.Should().Contain(RoleHelper.ADMIN);
            userRoles.Should().Contain("CustomRole");
            userRoles.Should().NotContain(RoleHelper.PLATFORM_ADMIN);
            userRoles.Should().NotContain(RoleHelper.USER);
        }

        [Fact]
        public void SecurityScenario_UserLosesAdminPrivileges_WhenRoleDeactivated()
        {
            // Arrange - User initially has active admin role
            var adminRole = RoleBuilder.Create().WithName(RoleHelper.ADMIN).Build();
            var userRole = new UserRole
            {
                Role = adminRole,
                IsActive = true
            };
            var user = UserBuilder.Create().WithRoles(userRole).Build();

            // Verify initial admin status
            RoleHelper.IsAdmin(user).Should().BeTrue();
            RoleHelper.HasRole(user, RoleHelper.ADMIN).Should().BeTrue();

            // Act - Deactivate the role (security operation)
            adminRole.IsActive = false;

            // Assert - User should lose admin privileges immediately
            RoleHelper.IsAdmin(user).Should().BeFalse("role was deactivated");
            RoleHelper.HasRole(user, RoleHelper.ADMIN).Should().BeFalse("role was deactivated");
            RoleHelper.GetUserRoles(user).Should().BeEmpty("role was deactivated");
        }

        [Fact]
        public void SecurityScenario_UserLosesAdminPrivileges_WhenUserRoleDeactivated()
        {
            // Arrange - User initially has active admin role
            var adminRole = RoleBuilder.Create().WithName(RoleHelper.ADMIN).Build();
            var userRole = new UserRole
            {
                Role = adminRole,
                IsActive = true
            };
            var user = UserBuilder.Create().WithRoles(userRole).Build();

            // Verify initial admin status
            RoleHelper.IsAdmin(user).Should().BeTrue();
            RoleHelper.HasRole(user, RoleHelper.ADMIN).Should().BeTrue();

            // Act - Deactivate the user role assignment (security operation)
            userRole.IsActive = false;

            // Assert - User should lose admin privileges immediately
            RoleHelper.IsAdmin(user).Should().BeFalse("user role assignment was deactivated");
            RoleHelper.HasRole(user, RoleHelper.ADMIN).Should().BeFalse("user role assignment was deactivated");
            RoleHelper.GetUserRoles(user).Should().BeEmpty("user role assignment was deactivated");
        }

        [Theory]
        [InlineData("admin", RoleHelper.ADMIN)] // lowercase
        [InlineData("ADMIN", RoleHelper.ADMIN)] // uppercase  
        [InlineData("Admin", RoleHelper.ADMIN)] // mixed case
        [InlineData("platformadmin", RoleHelper.PLATFORM_ADMIN)] // lowercase
        [InlineData("PLATFORMADMIN", RoleHelper.PLATFORM_ADMIN)] // uppercase
        [InlineData("PlatformAdmin", RoleHelper.PLATFORM_ADMIN)] // exact match
        public void CaseInsensitiveRoleComparison_WorksForAllMethods(string roleNameInDatabase, string roleNameToCheck)
        {
            // Arrange
            var role = RoleBuilder.Create().WithName(roleNameInDatabase).Build();
            var userRole = new UserRole
            {
                Role = role,
                IsActive = true
            };
            var user = UserBuilder.Create().WithRoles(userRole).Build();

            // Act & Assert
            RoleHelper.HasRole(user, roleNameToCheck).Should().BeTrue("role comparison should be case insensitive");
        }

        #endregion
    }
}