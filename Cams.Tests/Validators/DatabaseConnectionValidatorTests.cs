using Xunit;
using FluentAssertions;
using cams.Backend.Validators;
using cams.Backend.View;
using cams.Backend.Enums;
using System;
using System.Linq;

namespace Cams.Tests.Validators
{
    public class DatabaseConnectionValidatorTests
    {
        private readonly DatabaseConnectionValidator _validator;

        public DatabaseConnectionValidatorTests()
        {
            _validator = new DatabaseConnectionValidator();
        }

        #region ValidateCreateRequest Tests

        [Fact]
        public void ValidateCreateRequest_WithValidRequest_ReturnsValid()
        {
            // Arrange
            var request = new DatabaseConnectionRequest
            {
                ApplicationId = Guid.NewGuid(),
                Name = "Test Connection",
                Description = "Test Description",
                Type = DatabaseType.SqlServer,
                Server = "localhost",
                Port = 1433,
                Database = "TestDB",
                Username = "testuser",
                Password = "testpass123"
            };

            // Act
            var result = _validator.ValidateCreateRequest(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeTrue();
            result.ErrorMessage.Should().BeNull();
            result.Errors.Should().BeEmpty();
        }

        [Fact]
        public void ValidateCreateRequest_WithNullName_ReturnsInvalid()
        {
            // Arrange
            var request = new DatabaseConnectionRequest
            {
                ApplicationId = Guid.NewGuid(),
                Name = null!,
                Type = DatabaseType.SqlServer,
                Server = "localhost",
                Port = 1433,
                Database = "TestDB",
                Username = "testuser",
                Password = "testpass123"
            };

            // Act
            var result = _validator.ValidateCreateRequest(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeFalse();
            result.Errors.Should().Contain("Connection name is required");
        }

        [Fact]
        public void ValidateCreateRequest_WithEmptyName_ReturnsInvalid()
        {
            // Arrange
            var request = new DatabaseConnectionRequest
            {
                ApplicationId = Guid.NewGuid(),
                Name = string.Empty,
                Type = DatabaseType.SqlServer,
                Server = "localhost",
                Port = 1433,
                Database = "TestDB",
                Username = "testuser",
                Password = "testpass123"
            };

            // Act
            var result = _validator.ValidateCreateRequest(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeFalse();
            result.Errors.Should().Contain("Connection name is required");
        }

        [Fact]
        public void ValidateCreateRequest_WithWhitespaceName_ReturnsInvalid()
        {
            // Arrange
            var request = new DatabaseConnectionRequest
            {
                ApplicationId = Guid.NewGuid(),
                Name = "   ",
                Type = DatabaseType.SqlServer,
                Server = "localhost",
                Port = 1433,
                Database = "TestDB",
                Username = "testuser",
                Password = "testpass123"
            };

            // Act
            var result = _validator.ValidateCreateRequest(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeFalse();
            result.Errors.Should().Contain("Connection name is required");
        }

        [Fact]
        public void ValidateCreateRequest_WithNameTooLong_ReturnsInvalid()
        {
            // Arrange
            var longName = new string('a', 101); // Exceeds MAX_CONNECTION_NAME_LENGTH (100)
            var request = new DatabaseConnectionRequest
            {
                ApplicationId = Guid.NewGuid(),
                Name = longName,
                Type = DatabaseType.SqlServer,
                Server = "localhost",
                Port = 1433,
                Database = "TestDB",
                Username = "testuser",
                Password = "testpass123"
            };

            // Act
            var result = _validator.ValidateCreateRequest(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeFalse();
            result.Errors.Should().Contain("Connection name cannot exceed 100 characters");
        }

        [Fact]
        public void ValidateCreateRequest_WithNullServer_ReturnsInvalid()
        {
            // Arrange
            var request = new DatabaseConnectionRequest
            {
                ApplicationId = Guid.NewGuid(),
                Name = "Test Connection",
                Type = DatabaseType.SqlServer,
                Server = null!,
                Port = 1433,
                Database = "TestDB",
                Username = "testuser",
                Password = "testpass123"
            };

            // Act
            var result = _validator.ValidateCreateRequest(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeFalse();
            result.Errors.Should().Contain("Server is required");
        }

        [Fact]
        public void ValidateCreateRequest_WithEmptyServer_ReturnsInvalid()
        {
            // Arrange
            var request = new DatabaseConnectionRequest
            {
                ApplicationId = Guid.NewGuid(),
                Name = "Test Connection",
                Type = DatabaseType.SqlServer,
                Server = string.Empty,
                Port = 1433,
                Database = "TestDB",
                Username = "testuser",
                Password = "testpass123"
            };

            // Act
            var result = _validator.ValidateCreateRequest(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeFalse();
            result.Errors.Should().Contain("Server is required");
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        [InlineData(65536)]
        [InlineData(100000)]
        public void ValidateCreateRequest_WithInvalidPort_ReturnsInvalid(int port)
        {
            // Arrange
            var request = new DatabaseConnectionRequest
            {
                ApplicationId = Guid.NewGuid(),
                Name = "Test Connection",
                Type = DatabaseType.SqlServer,
                Server = "localhost",
                Port = port,
                Database = "TestDB",
                Username = "testuser",
                Password = "testpass123"
            };

            // Act
            var result = _validator.ValidateCreateRequest(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeFalse();
            result.Errors.Should().Contain("Port must be between 1 and 65535");
        }

        [Theory]
        [InlineData(1)]
        [InlineData(80)]
        [InlineData(443)]
        [InlineData(1433)]
        [InlineData(5432)]
        [InlineData(65535)]
        public void ValidateCreateRequest_WithValidPort_ReturnsValid(int port)
        {
            // Arrange
            var request = new DatabaseConnectionRequest
            {
                ApplicationId = Guid.NewGuid(),
                Name = "Test Connection",
                Type = DatabaseType.SqlServer,
                Server = "localhost",
                Port = port,
                Database = "TestDB",
                Username = "testuser",
                Password = "testpass123"
            };

            // Act
            var result = _validator.ValidateCreateRequest(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeTrue();
        }

        [Fact]
        public void ValidateCreateRequest_WithNullUsername_ReturnsInvalid()
        {
            // Arrange
            var request = new DatabaseConnectionRequest
            {
                ApplicationId = Guid.NewGuid(),
                Name = "Test Connection",
                Type = DatabaseType.SqlServer,
                Server = "localhost",
                Port = 1433,
                Database = "TestDB",
                Username = null!,
                Password = "testpass123"
            };

            // Act
            var result = _validator.ValidateCreateRequest(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeFalse();
            result.Errors.Should().Contain("Username is required");
        }

        [Fact]
        public void ValidateCreateRequest_WithEmptyUsername_ReturnsInvalid()
        {
            // Arrange
            var request = new DatabaseConnectionRequest
            {
                ApplicationId = Guid.NewGuid(),
                Name = "Test Connection",
                Type = DatabaseType.SqlServer,
                Server = "localhost",
                Port = 1433,
                Database = "TestDB",
                Username = string.Empty,
                Password = "testpass123"
            };

            // Act
            var result = _validator.ValidateCreateRequest(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeFalse();
            result.Errors.Should().Contain("Username is required");
        }

        [Fact]
        public void ValidateCreateRequest_WithNullPassword_ReturnsInvalid()
        {
            // Arrange
            var request = new DatabaseConnectionRequest
            {
                ApplicationId = Guid.NewGuid(),
                Name = "Test Connection",
                Type = DatabaseType.SqlServer,
                Server = "localhost",
                Port = 1433,
                Database = "TestDB",
                Username = "testuser",
                Password = null!
            };

            // Act
            var result = _validator.ValidateCreateRequest(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeFalse();
            result.Errors.Should().Contain("Password is required");
        }

        [Fact]
        public void ValidateCreateRequest_WithEmptyPassword_ReturnsInvalid()
        {
            // Arrange
            var request = new DatabaseConnectionRequest
            {
                ApplicationId = Guid.NewGuid(),
                Name = "Test Connection",
                Type = DatabaseType.SqlServer,
                Server = "localhost",
                Port = 1433,
                Database = "TestDB",
                Username = "testuser",
                Password = string.Empty
            };

            // Act
            var result = _validator.ValidateCreateRequest(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeFalse();
            result.Errors.Should().Contain("Password is required");
        }

        #endregion

        #region Database-Specific Validation Tests

        [Theory]
        [InlineData(DatabaseType.SqlServer)]
        [InlineData(DatabaseType.MySQL)]
        [InlineData(DatabaseType.PostgreSQL)]
        [InlineData(DatabaseType.Oracle)]
        public void ValidateCreateRequest_WithRelationalDatabaseAndNoDatabase_ReturnsInvalid(DatabaseType dbType)
        {
            // Arrange
            var request = new DatabaseConnectionRequest
            {
                ApplicationId = Guid.NewGuid(),
                Name = "Test Connection",
                Type = dbType,
                Server = "localhost",
                Port = 1433,
                Database = null, // Missing database name
                Username = "testuser",
                Password = "testpass123"
            };

            // Act
            var result = _validator.ValidateCreateRequest(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeFalse();
            result.Errors.Should().Contain("Database name is required for relational databases");
        }

        [Fact]
        public void ValidateCreateRequest_WithMongoDBAndNoDatabase_ReturnsInvalid()
        {
            // Arrange
            var request = new DatabaseConnectionRequest
            {
                ApplicationId = Guid.NewGuid(),
                Name = "Test Connection",
                Type = DatabaseType.MongoDB,
                Server = "localhost",
                Port = 27017,
                Database = null, // Missing database name
                Username = "testuser",
                Password = "testpass123"
            };

            // Act
            var result = _validator.ValidateCreateRequest(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeFalse();
            result.Errors.Should().Contain("Database name is required for MongoDB");
        }

        [Theory]
        [InlineData(DatabaseType.RestApi)]
        [InlineData(DatabaseType.GraphQL)]
        [InlineData(DatabaseType.WebSocket)]
        public void ValidateCreateRequest_WithApiTypeAndNoConnectionString_ReturnsInvalid(DatabaseType dbType)
        {
            // Arrange
            var request = new DatabaseConnectionRequest
            {
                ApplicationId = Guid.NewGuid(),
                Name = "Test Connection",
                Type = dbType,
                Server = "localhost",
                Port = 443,
                ConnectionString = null, // Missing connection string
                Username = "testuser",
                Password = "testpass123"
            };

            // Act
            var result = _validator.ValidateCreateRequest(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeFalse();
            result.Errors.Should().Contain("Connection string/URL is required for API connections");
        }

        [Fact]
        public void ValidateCreateRequest_WithCustomTypeAndNoConnectionString_ReturnsInvalid()
        {
            // Arrange
            var request = new DatabaseConnectionRequest
            {
                ApplicationId = Guid.NewGuid(),
                Name = "Test Connection",
                Type = DatabaseType.Custom,
                Server = "localhost",
                Port = 8080,
                ConnectionString = null, // Missing connection string
                Username = "testuser",
                Password = "testpass123"
            };

            // Act
            var result = _validator.ValidateCreateRequest(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeFalse();
            result.Errors.Should().Contain("Connection string is required for custom connections");
        }

        [Theory]
        [InlineData(DatabaseType.RestApi)]
        [InlineData(DatabaseType.GraphQL)]
        [InlineData(DatabaseType.WebSocket)]
        public void ValidateCreateRequest_WithApiTypeAndValidConnectionString_ReturnsValid(DatabaseType dbType)
        {
            // Arrange
            var request = new DatabaseConnectionRequest
            {
                ApplicationId = Guid.NewGuid(),
                Name = "Test Connection",
                Type = dbType,
                Server = "localhost",
                Port = 443,
                ConnectionString = "https://api.example.com/v1",
                Username = "testuser",
                Password = "testpass123"
            };

            // Act
            var result = _validator.ValidateCreateRequest(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeTrue();
        }

        [Fact]
        public void ValidateCreateRequest_WithCustomTypeAndValidConnectionString_ReturnsValid()
        {
            // Arrange
            var request = new DatabaseConnectionRequest
            {
                ApplicationId = Guid.NewGuid(),
                Name = "Test Connection",
                Type = DatabaseType.Custom,
                Server = "localhost",
                Port = 8080,
                ConnectionString = "custom://localhost:8080/db",
                Username = "testuser",
                Password = "testpass123"
            };

            // Act
            var result = _validator.ValidateCreateRequest(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeTrue();
        }

        #endregion

        #region Multiple Errors Test

        [Fact]
        public void ValidateCreateRequest_WithMultipleErrors_ReturnsAllErrors()
        {
            // Arrange
            var request = new DatabaseConnectionRequest
            {
                ApplicationId = Guid.NewGuid(),
                Name = null!, // Error 1
                Type = DatabaseType.SqlServer,
                Server = string.Empty, // Error 2
                Port = 0, // Error 3
                Database = null, // Error 4
                Username = null!, // Error 5
                Password = string.Empty // Error 6
            };

            // Act
            var result = _validator.ValidateCreateRequest(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeFalse();
            result.Errors.Should().HaveCount(6);
            result.Errors.Should().Contain("Connection name is required");
            result.Errors.Should().Contain("Server is required");
            result.Errors.Should().Contain("Port must be between 1 and 65535");
            result.Errors.Should().Contain("Database name is required for relational databases");
            result.Errors.Should().Contain("Username is required");
            result.Errors.Should().Contain("Password is required");
            result.ErrorMessage.Should().Contain(";"); // Multiple errors joined
        }

        #endregion

        #region ValidateUpdateRequest Tests

        [Fact]
        public void ValidateUpdateRequest_WithValidRequest_ReturnsValid()
        {
            // Arrange
            var request = new DatabaseConnectionUpdateRequest
            {
                Id = Guid.NewGuid(),
                ApplicationId = Guid.NewGuid(),
                Name = "Updated Connection",
                Type = DatabaseType.PostgreSQL,
                Server = "localhost",
                Port = 5432,
                Database = "TestDB",
                Username = "testuser",
                Password = "testpass123"
            };

            // Act
            var result = _validator.ValidateUpdateRequest(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeTrue();
            result.ErrorMessage.Should().BeNull();
            result.Errors.Should().BeEmpty();
        }

        [Fact]
        public void ValidateUpdateRequest_WithEmptyId_ReturnsInvalid()
        {
            // Arrange
            var request = new DatabaseConnectionUpdateRequest
            {
                Id = Guid.Empty, // Invalid ID
                ApplicationId = Guid.NewGuid(),
                Name = "Updated Connection",
                Type = DatabaseType.PostgreSQL,
                Server = "localhost",
                Port = 5432,
                Username = "testuser",
                Password = "testpass123"
            };

            // Act
            var result = _validator.ValidateUpdateRequest(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeFalse();
            result.Errors.Should().Contain("Connection ID is required");
        }

        [Fact]
        public void ValidateUpdateRequest_WithInvalidName_ReturnsInvalid()
        {
            // Arrange
            var request = new DatabaseConnectionUpdateRequest
            {
                Id = Guid.NewGuid(),
                ApplicationId = Guid.NewGuid(),
                Name = string.Empty, // Invalid name
                Type = DatabaseType.PostgreSQL,
                Server = "localhost",
                Port = 5432,
                Username = "testuser",
                Password = "testpass123"
            };

            // Act
            var result = _validator.ValidateUpdateRequest(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeFalse();
            result.Errors.Should().Contain("Connection name is required");
        }

        [Fact]
        public void ValidateUpdateRequest_WithNameTooLong_ReturnsInvalid()
        {
            // Arrange
            var longName = new string('b', 101); // Exceeds MAX_CONNECTION_NAME_LENGTH (100)
            var request = new DatabaseConnectionUpdateRequest
            {
                Id = Guid.NewGuid(),
                ApplicationId = Guid.NewGuid(),
                Name = longName,
                Type = DatabaseType.PostgreSQL,
                Server = "localhost",
                Port = 5432,
                Username = "testuser",
                Password = "testpass123"
            };

            // Act
            var result = _validator.ValidateUpdateRequest(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeFalse();
            result.Errors.Should().Contain("Connection name cannot exceed 100 characters");
        }

        [Fact]
        public void ValidateUpdateRequest_WithInvalidPort_ReturnsInvalid()
        {
            // Arrange
            var request = new DatabaseConnectionUpdateRequest
            {
                Id = Guid.NewGuid(),
                ApplicationId = Guid.NewGuid(),
                Name = "Updated Connection",
                Type = DatabaseType.PostgreSQL,
                Server = "localhost",
                Port = -1, // Invalid port
                Username = "testuser",
                Password = "testpass123"
            };

            // Act
            var result = _validator.ValidateUpdateRequest(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeFalse();
            result.Errors.Should().Contain("Port must be between 1 and 65535");
        }

        [Fact]
        public void ValidateUpdateRequest_WithMultipleErrors_ReturnsAllErrors()
        {
            // Arrange
            var request = new DatabaseConnectionUpdateRequest
            {
                Id = Guid.Empty, // Error 1
                ApplicationId = Guid.NewGuid(),
                Name = string.Empty, // Error 2
                Type = DatabaseType.PostgreSQL,
                Server = null!, // Error 3
                Port = 70000, // Error 4
                Username = "testuser",
                Password = "testpass123"
            };

            // Act
            var result = _validator.ValidateUpdateRequest(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeFalse();
            result.Errors.Should().HaveCount(4);
            result.Errors.Should().Contain("Connection ID is required");
            result.Errors.Should().Contain("Connection name is required");
            result.Errors.Should().Contain("Server is required");
            result.Errors.Should().Contain("Port must be between 1 and 65535");
        }

        #endregion

        #region ValidateTestRequest Tests

        [Fact]
        public void ValidateTestRequest_WithValidConnectionId_ReturnsValid()
        {
            // Arrange
            var request = new DatabaseConnectionTestRequest
            {
                ConnectionId = Guid.NewGuid(),
                ConnectionDetails = null
            };

            // Act
            var result = _validator.ValidateTestRequest(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeTrue();
            result.ErrorMessage.Should().BeNull();
            result.Errors.Should().BeEmpty();
        }

        [Fact]
        public void ValidateTestRequest_WithValidConnectionDetails_ReturnsValid()
        {
            // Arrange
            var request = new DatabaseConnectionTestRequest
            {
                ConnectionId = null,
                ConnectionDetails = new DatabaseConnectionRequest
                {
                    ApplicationId = Guid.NewGuid(),
                    Name = "Test Connection",
                    Type = DatabaseType.SqlServer,
                    Server = "localhost",
                    Port = 1433,
                    Database = "TestDB",
                    Username = "testuser",
                    Password = "testpass123"
                }
            };

            // Act
            var result = _validator.ValidateTestRequest(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeTrue();
            result.ErrorMessage.Should().BeNull();
            result.Errors.Should().BeEmpty();
        }

        [Fact]
        public void ValidateTestRequest_WithBothConnectionIdAndDetails_ReturnsValid()
        {
            // Arrange
            var request = new DatabaseConnectionTestRequest
            {
                ConnectionId = Guid.NewGuid(),
                ConnectionDetails = new DatabaseConnectionRequest
                {
                    ApplicationId = Guid.NewGuid(),
                    Name = "Test Connection",
                    Type = DatabaseType.SqlServer,
                    Server = "localhost",
                    Port = 1433,
                    Database = "TestDB",
                    Username = "testuser",
                    Password = "testpass123"
                }
            };

            // Act
            var result = _validator.ValidateTestRequest(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeTrue();
        }

        [Fact]
        public void ValidateTestRequest_WithNeitherConnectionIdNorDetails_ReturnsInvalid()
        {
            // Arrange
            var request = new DatabaseConnectionTestRequest
            {
                ConnectionId = null,
                ConnectionDetails = null
            };

            // Act
            var result = _validator.ValidateTestRequest(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeFalse();
            result.Errors.Should().Contain("Either ConnectionId or ConnectionDetails must be provided");
        }

        [Fact]
        public void ValidateTestRequest_WithInvalidConnectionDetails_ReturnsInvalid()
        {
            // Arrange
            var request = new DatabaseConnectionTestRequest
            {
                ConnectionId = null,
                ConnectionDetails = new DatabaseConnectionRequest
                {
                    ApplicationId = Guid.NewGuid(),
                    Name = null!, // Invalid
                    Type = DatabaseType.SqlServer,
                    Server = null!, // Invalid
                    Port = 0, // Invalid
                    Database = "TestDB",
                    Username = null!, // Invalid
                    Password = null! // Invalid
                }
            };

            // Act
            var result = _validator.ValidateTestRequest(request);

            // Assert
            result.Should().NotBeNull();
            result.IsValid.Should().BeFalse();
            result.Errors.Should().HaveCountGreaterThan(1);
            result.Errors.Should().Contain("Connection name is required");
            result.Errors.Should().Contain("Server is required");
            result.Errors.Should().Contain("Port must be between 1 and 65535");
            result.Errors.Should().Contain("Username is required");
            result.Errors.Should().Contain("Password is required");
        }

        #endregion

        #region Constructor and Interface Tests

        [Fact]
        public void Constructor_CreatesValidInstance()
        {
            // Act
            var validator = new DatabaseConnectionValidator();

            // Assert
            validator.Should().NotBeNull();
            validator.Should().BeAssignableTo<IDatabaseConnectionValidator>();
        }

        [Fact]
        public void Interface_HasAllRequiredMethods()
        {
            // Arrange
            var validator = _validator as IDatabaseConnectionValidator;

            // Assert
            validator.Should().NotBeNull();
            
            // Verify interface methods are available
            var methodNames = typeof(IDatabaseConnectionValidator).GetMethods().Select(m => m.Name);
            methodNames.Should().Contain("ValidateCreateRequest");
            methodNames.Should().Contain("ValidateUpdateRequest");
            methodNames.Should().Contain("ValidateTestRequest");
        }

        #endregion

        #region ValidationResult Tests

        [Fact]
        public void ValidationResult_WithErrors_SetsPropertiesCorrectly()
        {
            // Arrange
            var result = new ValidationResult
            {
                IsValid = false,
                ErrorMessage = "Test error",
                Errors = new List<string> { "Error 1", "Error 2" }
            };

            // Assert
            result.IsValid.Should().BeFalse();
            result.ErrorMessage.Should().Be("Test error");
            result.Errors.Should().HaveCount(2);
            result.Errors.Should().Contain("Error 1");
            result.Errors.Should().Contain("Error 2");
        }

        [Fact]
        public void ValidationResult_WithNoErrors_SetsPropertiesCorrectly()
        {
            // Arrange
            var result = new ValidationResult
            {
                IsValid = true,
                ErrorMessage = null,
                Errors = new List<string>()
            };

            // Assert
            result.IsValid.Should().BeTrue();
            result.ErrorMessage.Should().BeNull();
            result.Errors.Should().BeEmpty();
        }

        [Fact]
        public void ValidationResult_DefaultConstructor_InitializesCorrectly()
        {
            // Act
            var result = new ValidationResult();

            // Assert
            result.IsValid.Should().BeFalse(); // Default value
            result.ErrorMessage.Should().BeNull();
            result.Errors.Should().NotBeNull();
            result.Errors.Should().BeEmpty();
        }

        #endregion
    }
}