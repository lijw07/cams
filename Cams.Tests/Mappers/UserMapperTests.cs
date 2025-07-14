using System;
using System.Collections.Generic;
using System.Linq;
using Xunit;
using cams.Backend.Mappers;
using cams.Backend.Model;
using cams.Backend.View;
using FluentAssertions;

namespace cams.Backend.Tests.Mappers
{
    public class UserMapperTests
    {
        private readonly UserMapper _mapper;

        public UserMapperTests()
        {
            _mapper = new UserMapper();
        }

        [Fact]
        public void MapToLoginResponse_Should_Map_All_Properties_Correctly()
        {
            // Arrange
            var user = new User
            {
                Id = Guid.NewGuid(),
                Username = "testuser",
                Email = "test@example.com",
                FirstName = "John",
                LastName = "Doe"
            };

            var token = "test-jwt-token";
            var refreshToken = "test-refresh-token";

            // Act
            var result = _mapper.MapToLoginResponse(user, token, refreshToken);

            // Assert
            result.Should().NotBeNull();
            result.Token.Should().Be(token);
            result.RefreshToken.Should().Be(refreshToken);
            result.Username.Should().Be(user.Username);
            result.Email.Should().Be(user.Email);
            result.Expiration.Should().BeCloseTo(DateTime.UtcNow.AddMinutes(60), TimeSpan.FromSeconds(5));
        }

        [Fact]
        public void MapToLoginResponse_Should_Handle_Null_User_Properties()
        {
            // Arrange
            var user = new User
            {
                Id = Guid.NewGuid(),
                Username = "testuser",
                Email = "test@example.com",
                FirstName = null,
                LastName = null
            };

            var token = "test-token";
            var refreshToken = "test-refresh";

            // Act
            var result = _mapper.MapToLoginResponse(user, token, refreshToken);

            // Assert
            result.Should().NotBeNull();
            result.Token.Should().Be(token);
            result.RefreshToken.Should().Be(refreshToken);
            result.Username.Should().Be(user.Username);
            result.Email.Should().Be(user.Email);
        }

        [Fact]
        public void MapToEntity_Should_Map_All_Properties_Correctly()
        {
            // Arrange
            var request = new CreateUserRequest
            {
                Username = "newuser",
                Email = "newuser@example.com",
                FirstName = "Jane",
                LastName = "Smith",
                PhoneNumber = "+1234567890",
                Password = "password123",
                IsActive = true
            };

            // Act
            var result = _mapper.MapToEntity(request);

            // Assert
            result.Should().NotBeNull();
            result.Username.Should().Be(request.Username);
            result.Email.Should().Be(request.Email);
            result.FirstName.Should().Be(request.FirstName);
            result.LastName.Should().Be(request.LastName);
            result.PhoneNumber.Should().Be(request.PhoneNumber);
            result.PasswordHash.Should().Be(string.Empty); // Should be set by service
            result.IsActive.Should().BeTrue(); // Mapper always sets to true
            result.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
            result.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
            result.Id.Should().NotBe(Guid.Empty);
        }

        [Fact]
        public void MapToEntity_Should_Handle_Null_Optional_Properties()
        {
            // Arrange
            var request = new CreateUserRequest
            {
                Username = "newuser",
                Email = "newuser@example.com",
                FirstName = null,
                LastName = null,
                PhoneNumber = null,
                Password = "password123",
                IsActive = false
            };

            // Act
            var result = _mapper.MapToEntity(request);

            // Assert
            result.Should().NotBeNull();
            result.Username.Should().Be(request.Username);
            result.Email.Should().Be(request.Email);
            result.FirstName.Should().BeNull();
            result.LastName.Should().BeNull();
            result.PhoneNumber.Should().BeNull();
            result.IsActive.Should().BeTrue(); // Mapper always sets to true
        }

        [Fact]
        public void MapToEntity_Should_Set_CreatedAt_And_UpdatedAt_To_Same_Value()
        {
            // Arrange
            var request = new CreateUserRequest
            {
                Username = "testuser",
                Email = "test@example.com",
                Password = "password123"
            };

            // Act
            var result = _mapper.MapToEntity(request);

            // Assert
            result.CreatedAt.Should().Be(result.UpdatedAt);
        }

        [Fact]
        public void MapToResponse_Should_Map_All_Properties_Correctly()
        {
            // Arrange
            var user = new User
            {
                Id = Guid.NewGuid(),
                Username = "testuser",
                Email = "test@example.com",
                FirstName = "John",
                LastName = "Doe",
                PhoneNumber = "+1234567890",
                CreatedAt = DateTime.UtcNow.AddDays(-30),
                UpdatedAt = DateTime.UtcNow.AddDays(-1),
                LastLoginAt = DateTime.UtcNow.AddHours(-2),
                IsActive = true
            };

            // Act
            var result = _mapper.MapToResponse(user);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().Be(user.Id);
            result.Username.Should().Be(user.Username);
            result.Email.Should().Be(user.Email);
            result.FirstName.Should().Be(user.FirstName);
            result.LastName.Should().Be(user.LastName);
            result.PhoneNumber.Should().Be(user.PhoneNumber);
            result.CreatedAt.Should().Be(user.CreatedAt);
            result.UpdatedAt.Should().Be(user.UpdatedAt);
            result.LastLoginAt.Should().Be(user.LastLoginAt);
            result.IsActive.Should().Be(user.IsActive);
        }

        [Fact]
        public void MapToResponse_Should_Handle_Null_Names_As_Empty_Strings()
        {
            // Arrange
            var user = new User
            {
                Id = Guid.NewGuid(),
                Username = "testuser",
                Email = "test@example.com",
                FirstName = null,
                LastName = null,
                PhoneNumber = null,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                LastLoginAt = null,
                IsActive = false
            };

            // Act
            var result = _mapper.MapToResponse(user);

            // Assert
            result.Should().NotBeNull();
            result.FirstName.Should().Be(string.Empty);
            result.LastName.Should().Be(string.Empty);
            result.PhoneNumber.Should().BeNull();
            result.LastLoginAt.Should().BeNull();
            result.IsActive.Should().BeFalse();
        }

        [Fact]
        public void MapToProfileResponse_Should_Map_All_Properties_Correctly()
        {
            // Arrange
            var activeRole1 = new Role { Id = Guid.NewGuid(), Name = "Admin", IsActive = true };
            var activeRole2 = new Role { Id = Guid.NewGuid(), Name = "User", IsActive = true };
            var inactiveRole = new Role { Id = Guid.NewGuid(), Name = "Inactive Role", IsActive = false };

            var user = new User
            {
                Id = Guid.NewGuid(),
                Username = "testuser",
                Email = "test@example.com",
                FirstName = "John",
                LastName = "Doe",
                PhoneNumber = "+1234567890",
                CreatedAt = DateTime.UtcNow.AddDays(-30),
                UpdatedAt = DateTime.UtcNow.AddDays(-1),
                LastLoginAt = DateTime.UtcNow.AddHours(-2),
                IsActive = true,
                UserRoles = new List<UserRole>
                {
                    new UserRole { Role = activeRole1, IsActive = true },
                    new UserRole { Role = activeRole2, IsActive = true },
                    new UserRole { Role = inactiveRole, IsActive = true }, // Role is inactive
                    new UserRole { Role = activeRole1, IsActive = false } // UserRole is inactive
                }
            };

            var applicationCount = 5;
            var connectionCount = 10;

            // Act
            var result = _mapper.MapToProfileResponse(user, applicationCount, connectionCount);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().Be(user.Id);
            result.Username.Should().Be(user.Username);
            result.Email.Should().Be(user.Email);
            result.FirstName.Should().Be(user.FirstName);
            result.LastName.Should().Be(user.LastName);
            result.PhoneNumber.Should().Be(user.PhoneNumber);
            result.CreatedAt.Should().Be(user.CreatedAt);
            result.UpdatedAt.Should().Be(user.UpdatedAt);
            result.LastLoginAt.Should().Be(user.LastLoginAt);
            result.IsActive.Should().Be(user.IsActive);
            result.ApplicationCount.Should().Be(applicationCount);
            result.DatabaseConnectionCount.Should().Be(connectionCount);
            result.Roles.Should().HaveCount(2);
            result.Roles.Should().Contain("Admin");
            result.Roles.Should().Contain("User");
            result.Roles.Should().NotContain("Inactive Role");
        }

        [Fact]
        public void MapToProfileResponse_Should_Handle_Null_Optional_Properties()
        {
            // Arrange
            var user = new User
            {
                Id = Guid.NewGuid(),
                Username = "testuser",
                Email = "test@example.com",
                FirstName = null,
                LastName = null,
                PhoneNumber = null,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                LastLoginAt = null,
                IsActive = true,
                UserRoles = new List<UserRole>()
            };

            // Act
            var result = _mapper.MapToProfileResponse(user, 0, 0);

            // Assert
            result.Should().NotBeNull();
            result.FirstName.Should().BeNull();
            result.LastName.Should().BeNull();
            result.PhoneNumber.Should().BeNull();
            result.LastLoginAt.Should().BeNull();
            result.ApplicationCount.Should().Be(0);
            result.DatabaseConnectionCount.Should().Be(0);
            result.Roles.Should().BeEmpty();
        }

        [Fact]
        public void MapToProfileResponse_Should_Filter_Only_Active_Roles()
        {
            // Arrange
            var activeRole = new Role { Id = Guid.NewGuid(), Name = "Admin", IsActive = true };
            var inactiveRole = new Role { Id = Guid.NewGuid(), Name = "Inactive", IsActive = false };

            var user = new User
            {
                Id = Guid.NewGuid(),
                Username = "testuser",
                Email = "test@example.com",
                UserRoles = new List<UserRole>
                {
                    new UserRole { Role = activeRole, IsActive = true },
                    new UserRole { Role = inactiveRole, IsActive = true }, // Role is inactive
                    new UserRole { Role = activeRole, IsActive = false } // UserRole is inactive
                }
            };

            // Act
            var result = _mapper.MapToProfileResponse(user, 0, 0);

            // Assert
            result.Roles.Should().HaveCount(1);
            result.Roles.Should().Contain("Admin");
            result.Roles.Should().NotContain("Inactive");
        }

        [Fact]
        public void MapToProfileSummaryResponse_Should_Map_All_Properties_Correctly()
        {
            // Arrange
            var user = new User
            {
                Id = Guid.NewGuid(),
                Username = "testuser",
                Email = "test@example.com",
                FirstName = "John",
                LastName = "Doe",
                LastLoginAt = DateTime.UtcNow.AddHours(-1),
                IsActive = true
            };

            // Act
            var result = _mapper.MapToProfileSummaryResponse(user);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().Be(user.Id);
            result.Username.Should().Be(user.Username);
            result.Email.Should().Be(user.Email);
            result.FirstName.Should().Be(user.FirstName);
            result.LastName.Should().Be(user.LastName);
            result.LastLoginAt.Should().Be(user.LastLoginAt);
            result.IsActive.Should().Be(user.IsActive);
        }

        [Fact]
        public void MapToProfileSummaryResponse_Should_Handle_Null_Optional_Properties()
        {
            // Arrange
            var user = new User
            {
                Id = Guid.NewGuid(),
                Username = "testuser",
                Email = "test@example.com",
                FirstName = null,
                LastName = null,
                LastLoginAt = null,
                IsActive = false
            };

            // Act
            var result = _mapper.MapToProfileSummaryResponse(user);

            // Assert
            result.Should().NotBeNull();
            result.FirstName.Should().BeNull();
            result.LastName.Should().BeNull();
            result.LastLoginAt.Should().BeNull();
            result.IsActive.Should().BeFalse();
        }

        [Fact]
        public void MapToProfileSummaryResponse_Should_Calculate_FullName_Correctly()
        {
            // Arrange
            var user = new User
            {
                Id = Guid.NewGuid(),
                Username = "testuser",
                Email = "test@example.com",
                FirstName = "John",
                LastName = "Doe",
                IsActive = true
            };

            // Act
            var result = _mapper.MapToProfileSummaryResponse(user);

            // Assert
            result.FullName.Should().Be("John Doe");
        }

        [Fact]
        public void MapToProfileSummaryResponse_Should_Handle_FullName_With_Null_Names()
        {
            // Arrange
            var user = new User
            {
                Id = Guid.NewGuid(),
                Username = "testuser",
                Email = "test@example.com",
                FirstName = null,
                LastName = null,
                IsActive = true
            };

            // Act
            var result = _mapper.MapToProfileSummaryResponse(user);

            // Assert
            result.FullName.Should().Be(string.Empty);
        }

        [Fact]
        public void MapToProfileSummaryResponse_Should_Handle_FullName_With_Partial_Names()
        {
            // Arrange - Only first name
            var userWithFirstName = new User
            {
                Id = Guid.NewGuid(),
                Username = "testuser1",
                Email = "test1@example.com",
                FirstName = "John",
                LastName = null,
                IsActive = true
            };

            // Arrange - Only last name
            var userWithLastName = new User
            {
                Id = Guid.NewGuid(),
                Username = "testuser2",
                Email = "test2@example.com",
                FirstName = null,
                LastName = "Doe",
                IsActive = true
            };

            // Act
            var resultFirstOnly = _mapper.MapToProfileSummaryResponse(userWithFirstName);
            var resultLastOnly = _mapper.MapToProfileSummaryResponse(userWithLastName);

            // Assert
            resultFirstOnly.FullName.Should().Be("John");
            resultLastOnly.FullName.Should().Be("Doe");
        }

        [Theory]
        [InlineData("", "")]
        [InlineData("John", "")]
        [InlineData("", "Doe")]
        [InlineData("John", "Doe")]
        [InlineData("   ", "   ")]
        public void MapToProfileSummaryResponse_Should_Handle_Various_Name_Combinations(string firstName, string lastName)
        {
            // Arrange
            var user = new User
            {
                Id = Guid.NewGuid(),
                Username = "testuser",
                Email = "test@example.com",
                FirstName = string.IsNullOrEmpty(firstName) ? null : firstName,
                LastName = string.IsNullOrEmpty(lastName) ? null : lastName,
                IsActive = true
            };

            // Act
            var result = _mapper.MapToProfileSummaryResponse(user);

            // Assert
            var expectedFullName = $"{firstName} {lastName}".Trim();
            result.FullName.Should().Be(expectedFullName);
        }

        [Fact]
        public void MapToLoginResponse_Should_Not_Include_UserId_From_Mapper()
        {
            // Arrange
            var user = new User
            {
                Id = Guid.NewGuid(),
                Username = "testuser",
                Email = "test@example.com"
            };

            // Act
            var result = _mapper.MapToLoginResponse(user, "token", "refresh");

            // Assert
            // Note: UserId is not set by the mapper based on the implementation
            result.UserId.Should().Be(Guid.Empty);
        }

        [Fact]
        public void MapToEntity_Should_Always_Set_IsActive_To_True()
        {
            // Arrange - Test both true and false request values
            var activeRequest = new CreateUserRequest
            {
                Username = "activeuser",
                Email = "active@example.com",
                Password = "password123",
                IsActive = true
            };

            var inactiveRequest = new CreateUserRequest
            {
                Username = "inactiveuser",
                Email = "inactive@example.com",
                Password = "password123",
                IsActive = false
            };

            // Act
            var activeResult = _mapper.MapToEntity(activeRequest);
            var inactiveResult = _mapper.MapToEntity(inactiveRequest);

            // Assert - Mapper always sets IsActive to true regardless of request value
            activeResult.IsActive.Should().BeTrue();
            inactiveResult.IsActive.Should().BeTrue();
        }

        [Fact]
        public void MapToEntity_Should_Set_Empty_PasswordHash()
        {
            // Arrange
            var request = new CreateUserRequest
            {
                Username = "testuser",
                Email = "test@example.com",
                Password = "supersecretpassword",
                IsActive = true
            };

            // Act
            var result = _mapper.MapToEntity(request);

            // Assert
            result.PasswordHash.Should().Be(string.Empty);
            // Password from request should not be copied to PasswordHash
        }
    }
}