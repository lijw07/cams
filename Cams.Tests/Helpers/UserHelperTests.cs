using Xunit;
using FluentAssertions;
using cams.Backend.Helpers;
using System.Security.Claims;

namespace Cams.Tests.Helpers
{
    public class UserHelperTests
    {
        #region Test Helpers

        private static ClaimsPrincipal CreateUserWithClaims(params Claim[] claims)
        {
            var identity = new ClaimsIdentity(claims, "test");
            return new ClaimsPrincipal(identity);
        }

        private static ClaimsPrincipal CreateUserWithUserId(Guid userId)
        {
            return CreateUserWithClaims(new Claim(ClaimTypes.NameIdentifier, userId.ToString()));
        }

        private static ClaimsPrincipal CreateUserWithUsername(string username)
        {
            return CreateUserWithClaims(new Claim(ClaimTypes.Name, username));
        }

        private static ClaimsPrincipal CreateUserWithEmail(string email)
        {
            return CreateUserWithClaims(new Claim(ClaimTypes.Email, email));
        }

        private static ClaimsPrincipal CreateUserWithRole(string role)
        {
            return CreateUserWithClaims(new Claim(ClaimTypes.Role, role));
        }

        private static ClaimsPrincipal CreateCompleteUser(Guid userId, string username, string email, params string[] roles)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Name, username),
                new Claim(ClaimTypes.Email, email)
            };

            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            return CreateUserWithClaims(claims.ToArray());
        }

        #endregion

        #region GetCurrentUserId Tests

        [Fact]
        public void GetCurrentUserId_WithValidUserIdClaim_ReturnsUserId()
        {
            // Arrange
            var expectedUserId = Guid.NewGuid();
            var user = CreateUserWithUserId(expectedUserId);

            // Act
            var result = UserHelper.GetCurrentUserId(user);

            // Assert
            result.Should().Be(expectedUserId);
        }

        [Fact]
        public void GetCurrentUserId_WithNullUser_ThrowsNullReferenceException()
        {
            // Arrange
            ClaimsPrincipal user = null!;

            // Act & Assert
            var action = () => UserHelper.GetCurrentUserId(user);
            action.Should().Throw<NullReferenceException>();
        }

        [Fact]
        public void GetCurrentUserId_WithNoNameIdentifierClaim_ThrowsUnauthorizedAccessException()
        {
            // Arrange
            var user = CreateUserWithClaims(new Claim(ClaimTypes.Name, "testuser"));

            // Act & Assert
            var action = () => UserHelper.GetCurrentUserId(user);
            action.Should().Throw<UnauthorizedAccessException>()
                .WithMessage("User ID not found in token");
        }

        [Fact]
        public void GetCurrentUserId_WithEmptyNameIdentifierClaim_ThrowsUnauthorizedAccessException()
        {
            // Arrange
            var user = CreateUserWithClaims(new Claim(ClaimTypes.NameIdentifier, string.Empty));

            // Act & Assert
            var action = () => UserHelper.GetCurrentUserId(user);
            action.Should().Throw<UnauthorizedAccessException>()
                .WithMessage("User ID not found in token");
        }

        [Fact]
        public void GetCurrentUserId_WithInvalidGuidFormat_ThrowsUnauthorizedAccessException()
        {
            // Arrange
            var user = CreateUserWithClaims(new Claim(ClaimTypes.NameIdentifier, "not-a-guid"));

            // Act & Assert
            var action = () => UserHelper.GetCurrentUserId(user);
            action.Should().Throw<UnauthorizedAccessException>()
                .WithMessage("User ID not found in token");
        }

        [Fact]
        public void GetCurrentUserId_WithPartialGuidFormat_ThrowsUnauthorizedAccessException()
        {
            // Arrange
            var user = CreateUserWithClaims(new Claim(ClaimTypes.NameIdentifier, "12345678-1234-1234"));

            // Act & Assert
            var action = () => UserHelper.GetCurrentUserId(user);
            action.Should().Throw<UnauthorizedAccessException>()
                .WithMessage("User ID not found in token");
        }

        [Fact]
        public void GetCurrentUserId_WithNullNameIdentifierValue_ThrowsArgumentNullException()
        {
            // Act & Assert - Cannot create claim with null value
            var action = () => new Claim(ClaimTypes.NameIdentifier, (string)null!);
            action.Should().Throw<ArgumentNullException>();
        }

        [Theory]
        [InlineData("00000000-0000-0000-0000-000000000000")] // Empty GUID
        [InlineData("12345678-1234-5678-9012-123456789abc")] // Valid GUID format
        [InlineData("AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE")] // Uppercase GUID
        public void GetCurrentUserId_WithValidGuidFormats_ReturnsCorrectGuid(string guidString)
        {
            // Arrange
            var expectedGuid = Guid.Parse(guidString);
            var user = CreateUserWithClaims(new Claim(ClaimTypes.NameIdentifier, guidString));

            // Act
            var result = UserHelper.GetCurrentUserId(user);

            // Assert
            result.Should().Be(expectedGuid);
        }

        [Fact]
        public void GetCurrentUserId_WithMultipleNameIdentifierClaims_ReturnsFirstOne()
        {
            // Arrange
            var firstGuid = Guid.NewGuid();
            var secondGuid = Guid.NewGuid();
            var user = CreateUserWithClaims(
                new Claim(ClaimTypes.NameIdentifier, firstGuid.ToString()),
                new Claim(ClaimTypes.NameIdentifier, secondGuid.ToString())
            );

            // Act
            var result = UserHelper.GetCurrentUserId(user);

            // Assert
            result.Should().Be(firstGuid);
        }

        #endregion

        #region GetCurrentUsername Tests

        [Fact]
        public void GetCurrentUsername_WithValidNameClaim_ReturnsUsername()
        {
            // Arrange
            var expectedUsername = "testuser";
            var user = CreateUserWithUsername(expectedUsername);

            // Act
            var result = UserHelper.GetCurrentUsername(user);

            // Assert
            result.Should().Be(expectedUsername);
        }

        [Fact]
        public void GetCurrentUsername_WithNullUser_ThrowsNullReferenceException()
        {
            // Arrange
            ClaimsPrincipal user = null!;

            // Act & Assert
            var action = () => UserHelper.GetCurrentUsername(user);
            action.Should().Throw<NullReferenceException>();
        }

        [Fact]
        public void GetCurrentUsername_WithNoNameClaim_ReturnsNull()
        {
            // Arrange
            var user = CreateUserWithClaims(new Claim(ClaimTypes.Email, "test@example.com"));

            // Act
            var result = UserHelper.GetCurrentUsername(user);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public void GetCurrentUsername_WithEmptyNameClaim_ReturnsEmptyString()
        {
            // Arrange
            var user = CreateUserWithClaims(new Claim(ClaimTypes.Name, string.Empty));

            // Act
            var result = UserHelper.GetCurrentUsername(user);

            // Assert
            result.Should().Be(string.Empty);
        }

        [Fact]
        public void GetCurrentUsername_WithNullNameClaimValue_ThrowsArgumentNullException()
        {
            // Act & Assert - Cannot create claim with null value
            var action = () => new Claim(ClaimTypes.Name, (string)null!);
            action.Should().Throw<ArgumentNullException>();
        }

        [Theory]
        [InlineData("admin")]
        [InlineData("user@domain.com")]
        [InlineData("Test_User_123")]
        [InlineData("user with spaces")]
        [InlineData("unicode-αβγ")]
        public void GetCurrentUsername_WithVariousUsernameFormats_ReturnsCorrectUsername(string username)
        {
            // Arrange
            var user = CreateUserWithUsername(username);

            // Act
            var result = UserHelper.GetCurrentUsername(user);

            // Assert
            result.Should().Be(username);
        }

        [Fact]
        public void GetCurrentUsername_WithMultipleNameClaims_ReturnsFirstOne()
        {
            // Arrange
            var firstName = "firstuser";
            var secondName = "seconduser";
            var user = CreateUserWithClaims(
                new Claim(ClaimTypes.Name, firstName),
                new Claim(ClaimTypes.Name, secondName)
            );

            // Act
            var result = UserHelper.GetCurrentUsername(user);

            // Assert
            result.Should().Be(firstName);
        }

        #endregion

        #region GetCurrentUserEmail Tests

        [Fact]
        public void GetCurrentUserEmail_WithValidEmailClaim_ReturnsEmail()
        {
            // Arrange
            var expectedEmail = "user@example.com";
            var user = CreateUserWithEmail(expectedEmail);

            // Act
            var result = UserHelper.GetCurrentUserEmail(user);

            // Assert
            result.Should().Be(expectedEmail);
        }

        [Fact]
        public void GetCurrentUserEmail_WithNullUser_ThrowsNullReferenceException()
        {
            // Arrange
            ClaimsPrincipal user = null!;

            // Act & Assert
            var action = () => UserHelper.GetCurrentUserEmail(user);
            action.Should().Throw<NullReferenceException>();
        }

        [Fact]
        public void GetCurrentUserEmail_WithNoEmailClaim_ReturnsNull()
        {
            // Arrange
            var user = CreateUserWithClaims(new Claim(ClaimTypes.Name, "testuser"));

            // Act
            var result = UserHelper.GetCurrentUserEmail(user);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public void GetCurrentUserEmail_WithEmptyEmailClaim_ReturnsEmptyString()
        {
            // Arrange
            var user = CreateUserWithClaims(new Claim(ClaimTypes.Email, string.Empty));

            // Act
            var result = UserHelper.GetCurrentUserEmail(user);

            // Assert
            result.Should().Be(string.Empty);
        }

        [Fact]
        public void GetCurrentUserEmail_WithNullEmailClaimValue_ThrowsArgumentNullException()
        {
            // Act & Assert - Cannot create claim with null value
            var action = () => new Claim(ClaimTypes.Email, (string)null!);
            action.Should().Throw<ArgumentNullException>();
        }

        [Theory]
        [InlineData("user@example.com")]
        [InlineData("admin@company.org")]
        [InlineData("test.user+tag@subdomain.example.co.uk")]
        [InlineData("simple@local")]
        [InlineData("user@[192.168.1.1]")]
        public void GetCurrentUserEmail_WithVariousEmailFormats_ReturnsCorrectEmail(string email)
        {
            // Arrange
            var user = CreateUserWithEmail(email);

            // Act
            var result = UserHelper.GetCurrentUserEmail(user);

            // Assert
            result.Should().Be(email);
        }

        [Fact]
        public void GetCurrentUserEmail_WithMultipleEmailClaims_ReturnsFirstOne()
        {
            // Arrange
            var firstEmail = "first@example.com";
            var secondEmail = "second@example.com";
            var user = CreateUserWithClaims(
                new Claim(ClaimTypes.Email, firstEmail),
                new Claim(ClaimTypes.Email, secondEmail)
            );

            // Act
            var result = UserHelper.GetCurrentUserEmail(user);

            // Assert
            result.Should().Be(firstEmail);
        }

        #endregion

        #region HasRole Tests

        [Fact]
        public void HasRole_WithUserHavingSpecifiedRole_ReturnsTrue()
        {
            // Arrange
            var role = "Admin";
            var user = CreateUserWithRole(role);

            // Act
            var result = UserHelper.HasRole(user, role);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public void HasRole_WithUserNotHavingSpecifiedRole_ReturnsFalse()
        {
            // Arrange
            var user = CreateUserWithRole("User");

            // Act
            var result = UserHelper.HasRole(user, "Admin");

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void HasRole_WithNullUser_ThrowsNullReferenceException()
        {
            // Arrange
            ClaimsPrincipal user = null!;

            // Act & Assert
            var action = () => UserHelper.HasRole(user, "Admin");
            action.Should().Throw<NullReferenceException>();
        }

        [Fact]
        public void HasRole_WithUserHavingNoRoles_ReturnsFalse()
        {
            // Arrange
            var user = CreateUserWithClaims(new Claim(ClaimTypes.Name, "testuser"));

            // Act
            var result = UserHelper.HasRole(user, "Admin");

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void HasRole_WithEmptyRoleString_ReturnsFalse()
        {
            // Arrange
            var user = CreateUserWithRole("Admin");

            // Act
            var result = UserHelper.HasRole(user, string.Empty);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void HasRole_WithNullRoleString_ThrowsArgumentNullException()
        {
            // Arrange
            var user = CreateUserWithRole("Admin");

            // Act & Assert
            var action = () => UserHelper.HasRole(user, null!);
            action.Should().Throw<ArgumentNullException>();
        }

        [Fact]
        public void HasRole_WithMultipleRoles_ReturnsTrueForAnyMatchingRole()
        {
            // Arrange
            var user = CreateUserWithClaims(
                new Claim(ClaimTypes.Role, "User"),
                new Claim(ClaimTypes.Role, "Admin"),
                new Claim(ClaimTypes.Role, "Moderator")
            );

            // Act
            var hasAdmin = UserHelper.HasRole(user, "Admin");
            var hasUser = UserHelper.HasRole(user, "User");
            var hasModerator = UserHelper.HasRole(user, "Moderator");
            var hasSuperAdmin = UserHelper.HasRole(user, "SuperAdmin");

            // Assert
            hasAdmin.Should().BeTrue();
            hasUser.Should().BeTrue();
            hasModerator.Should().BeTrue();
            hasSuperAdmin.Should().BeFalse();
        }

        [Theory]
        [InlineData("Admin", "admin")] // Different casing
        [InlineData("USER", "user")] // Different casing
        [InlineData("Moderator", "MODERATOR")] // Different casing
        public void HasRole_WithDifferentCasing_ReturnsFalse(string userRole, string checkRole)
        {
            // Arrange - Note: ClaimsPrincipal.IsInRole is case-sensitive by default
            var user = CreateUserWithRole(userRole);

            // Act
            var result = UserHelper.HasRole(user, checkRole);

            // Assert
            result.Should().BeFalse("ClaimsPrincipal.IsInRole is case-sensitive");
        }

        [Theory]
        [InlineData("Admin")]
        [InlineData("User")]
        [InlineData("PlatformAdmin")]
        [InlineData("Custom_Role_123")]
        [InlineData("Role with spaces")]
        public void HasRole_WithExactRoleMatch_ReturnsTrue(string role)
        {
            // Arrange
            var user = CreateUserWithRole(role);

            // Act
            var result = UserHelper.HasRole(user, role);

            // Assert
            result.Should().BeTrue();
        }

        #endregion

        #region Integration Tests

        [Fact]
        public void AllMethods_WithCompleteUserClaims_WorkCorrectly()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var username = "admin_user";
            var email = "admin@example.com";
            var roles = new[] { "Admin", "User" };
            var user = CreateCompleteUser(userId, username, email, roles);

            // Act
            var extractedUserId = UserHelper.GetCurrentUserId(user);
            var extractedUsername = UserHelper.GetCurrentUsername(user);
            var extractedEmail = UserHelper.GetCurrentUserEmail(user);
            var hasAdminRole = UserHelper.HasRole(user, "Admin");
            var hasUserRole = UserHelper.HasRole(user, "User");
            var hasSuperAdminRole = UserHelper.HasRole(user, "SuperAdmin");

            // Assert
            extractedUserId.Should().Be(userId);
            extractedUsername.Should().Be(username);
            extractedEmail.Should().Be(email);
            hasAdminRole.Should().BeTrue();
            hasUserRole.Should().BeTrue();
            hasSuperAdminRole.Should().BeFalse();
        }

        [Fact]
        public void AllMethods_WithMinimalClaims_HandleMissingDataGracefully()
        {
            // Arrange - User with only userId
            var userId = Guid.NewGuid();
            var user = CreateUserWithUserId(userId);

            // Act
            var extractedUserId = UserHelper.GetCurrentUserId(user);
            var extractedUsername = UserHelper.GetCurrentUsername(user);
            var extractedEmail = UserHelper.GetCurrentUserEmail(user);
            var hasRole = UserHelper.HasRole(user, "Admin");

            // Assert
            extractedUserId.Should().Be(userId);
            extractedUsername.Should().BeNull();
            extractedEmail.Should().BeNull();
            hasRole.Should().BeFalse();
        }

        [Fact]
        public void SecurityScenario_UnauthorizedUserAccess_ThrowsException()
        {
            // Arrange - User without proper authentication claims
            var user = CreateUserWithClaims(
                new Claim("custom_claim", "some_value"),
                new Claim(ClaimTypes.Name, "hacker")
            );

            // Act & Assert - Should fail to get user ID
            var action = () => UserHelper.GetCurrentUserId(user);
            action.Should().Throw<UnauthorizedAccessException>()
                .WithMessage("User ID not found in token");

            // But other methods should work gracefully
            UserHelper.GetCurrentUsername(user).Should().Be("hacker");
            UserHelper.GetCurrentUserEmail(user).Should().BeNull();
            UserHelper.HasRole(user, "Admin").Should().BeFalse();
        }

        [Fact]
        public void SecurityScenario_MalformedUserIdClaim_ThrowsException()
        {
            // Arrange - Simulating a tampered token with invalid user ID
            var user = CreateUserWithClaims(
                new Claim(ClaimTypes.NameIdentifier, "invalid-user-id"),
                new Claim(ClaimTypes.Name, "legitimate_user"),
                new Claim(ClaimTypes.Email, "user@example.com"),
                new Claim(ClaimTypes.Role, "Admin")
            );

            // Act & Assert - Should fail on user ID extraction
            var action = () => UserHelper.GetCurrentUserId(user);
            action.Should().Throw<UnauthorizedAccessException>()
                .WithMessage("User ID not found in token");

            // Other methods should still work
            UserHelper.GetCurrentUsername(user).Should().Be("legitimate_user");
            UserHelper.GetCurrentUserEmail(user).Should().Be("user@example.com");
            UserHelper.HasRole(user, "Admin").Should().BeTrue();
        }

        [Fact]
        public void EdgeCase_EmptyClaimsPrincipal_HandledGracefully()
        {
            // Arrange
            var user = new ClaimsPrincipal();

            // Act & Assert
            var getUserIdAction = () => UserHelper.GetCurrentUserId(user);
            getUserIdAction.Should().Throw<UnauthorizedAccessException>();

            UserHelper.GetCurrentUsername(user).Should().BeNull();
            UserHelper.GetCurrentUserEmail(user).Should().BeNull();
            UserHelper.HasRole(user, "Admin").Should().BeFalse();
        }

        [Fact]
        public void EdgeCase_ClaimsPrincipalWithEmptyIdentity_HandledGracefully()
        {
            // Arrange
            var identity = new ClaimsIdentity();
            var user = new ClaimsPrincipal(identity);

            // Act & Assert
            var getUserIdAction = () => UserHelper.GetCurrentUserId(user);
            getUserIdAction.Should().Throw<UnauthorizedAccessException>();

            UserHelper.GetCurrentUsername(user).Should().BeNull();
            UserHelper.GetCurrentUserEmail(user).Should().BeNull();
            UserHelper.HasRole(user, "Admin").Should().BeFalse();
        }

        [Fact]
        public void EdgeCase_MultipleIdentitiesInClaimsPrincipal_UsesFirstIdentity()
        {
            // Arrange
            var firstIdentity = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Name, "first_user")
            }, "first_auth");

            var secondIdentity = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Name, "second_user")
            }, "second_auth");

            var user = new ClaimsPrincipal(new[] { firstIdentity, secondIdentity });

            // Act
            var username = UserHelper.GetCurrentUsername(user);

            // Assert
            username.Should().Be("first_user", "should use first identity's claims");
        }

        #endregion
    }
}