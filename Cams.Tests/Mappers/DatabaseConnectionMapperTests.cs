using System;
using System.Collections.Generic;
using System.Linq;
using Xunit;
using cams.Backend.Mappers;
using cams.Backend.Model;
using cams.Backend.View;
using cams.Backend.Enums;
using FluentAssertions;

namespace cams.Backend.Tests.Mappers
{
    public class DatabaseConnectionMapperTests
    {
        private readonly DatabaseConnectionMapper _mapper;
        private readonly Guid _userId = Guid.NewGuid();
        private readonly Guid _applicationId = Guid.NewGuid();

        public DatabaseConnectionMapperTests()
        {
            _mapper = new DatabaseConnectionMapper();
        }

        [Fact]
        public void MapToEntity_Should_Map_All_Properties_Correctly()
        {
            // Arrange
            var request = new DatabaseConnectionRequest
            {
                Name = "Test Connection",
                Description = "Test Description",
                Type = DatabaseType.SqlServer,
                Server = "localhost",
                Port = 1433,
                Database = "TestDatabase",
                Username = "testuser",
                Password = "testpassword",
                ConnectionString = "Server=localhost;Database=TestDatabase;User Id=testuser;Password=testpassword;",
                ApiBaseUrl = "https://api.test.com",
                ApiKey = "test-api-key",
                AdditionalSettings = "setting1=value1;setting2=value2",
                ApplicationId = _applicationId,
                IsActive = true
            };

            // Act
            var result = _mapper.MapToEntity(request, _userId);

            // Assert
            result.Should().NotBeNull();
            result.Name.Should().Be(request.Name);
            result.Description.Should().Be(request.Description);
            result.Type.Should().Be(request.Type);
            result.Server.Should().Be(request.Server);
            result.Port.Should().Be(request.Port);
            result.Database.Should().Be(request.Database);
            result.Username.Should().Be(request.Username);
            result.PasswordHash.Should().Be(request.Password); // Note: Should be encrypted in production
            result.ConnectionString.Should().Be(request.ConnectionString);
            result.ApiBaseUrl.Should().Be(request.ApiBaseUrl);
            result.ApiKey.Should().Be(request.ApiKey);
            result.AdditionalSettings.Should().Be(request.AdditionalSettings);
            result.ApplicationId.Should().Be(request.ApplicationId);
            result.UserId.Should().Be(_userId);
            result.IsActive.Should().Be(request.IsActive);
            result.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
            result.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
            result.Id.Should().NotBe(Guid.Empty);
        }

        [Fact]
        public void MapToEntity_Should_Handle_Null_Optional_Properties()
        {
            // Arrange
            var request = new DatabaseConnectionRequest
            {
                Name = "Test Connection",
                Description = null,
                Type = DatabaseType.PostgreSQL,
                Server = "localhost",
                Port = null,
                Database = "TestDB",
                Username = "user",
                Password = "pass",
                ConnectionString = null,
                ApiBaseUrl = null,
                ApiKey = null,
                AdditionalSettings = null,
                ApplicationId = null,
                IsActive = false
            };

            // Act
            var result = _mapper.MapToEntity(request, _userId);

            // Assert
            result.Should().NotBeNull();
            result.Name.Should().Be(request.Name);
            result.Description.Should().BeNull();
            result.Type.Should().Be(DatabaseType.PostgreSQL);
            result.Port.Should().BeNull();
            result.ConnectionString.Should().BeNull();
            result.ApiBaseUrl.Should().BeNull();
            result.ApiKey.Should().BeNull();
            result.AdditionalSettings.Should().BeNull();
            result.ApplicationId.Should().BeNull();
            result.IsActive.Should().BeFalse();
        }

        [Fact]
        public void MapToResponse_Should_Map_All_Properties_Correctly()
        {
            // Arrange
            var entity = new DatabaseConnection
            {
                Id = Guid.NewGuid(),
                Name = "Test Connection",
                Description = "Test Description",
                Type = DatabaseType.SqlServer,
                Server = "localhost",
                Port = 1433,
                Database = "TestDatabase",
                Username = "testuser",
                PasswordHash = "hashed-password",
                ConnectionString = "Server=localhost;Database=TestDatabase;User Id=testuser;Password=secret123;",
                ApiBaseUrl = "https://api.test.com",
                ApiKey = "test-api-key",
                AdditionalSettings = "setting1=value1",
                ApplicationId = _applicationId,
                UserId = _userId,
                IsActive = true,
                Status = ConnectionStatus.Connected,
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                UpdatedAt = DateTime.UtcNow,
                LastTestedAt = DateTime.UtcNow.AddHours(-2),
                LastTestResult = "Connection successful"
            };

            // Act
            var result = _mapper.MapToResponse(entity);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().Be(entity.Id);
            result.Name.Should().Be(entity.Name);
            result.Description.Should().Be(entity.Description);
            result.Type.Should().Be(entity.Type);
            result.TypeName.Should().Be("SqlServer");
            result.Server.Should().Be(entity.Server);
            result.Port.Should().Be(entity.Port);
            result.Database.Should().Be(entity.Database);
            result.Username.Should().Be(entity.Username);
            result.ConnectionString.Should().Be("Server=localhost;Database=TestDatabase;User Id=testuser;Password=***;");
            result.ApiBaseUrl.Should().Be(entity.ApiBaseUrl);
            result.ApplicationId.Should().Be(entity.ApplicationId);
            result.IsActive.Should().Be(entity.IsActive);
            result.Status.Should().Be(entity.Status);
            result.StatusName.Should().Be("Connected");
            result.CreatedAt.Should().Be(entity.CreatedAt);
            result.UpdatedAt.Should().Be(entity.UpdatedAt);
            result.LastTestedAt.Should().Be(entity.LastTestedAt);
            result.LastTestResult.Should().Be(entity.LastTestResult);
        }

        [Fact]
        public void MapToResponse_Should_Not_Include_Password_In_Response()
        {
            // Arrange
            var entity = new DatabaseConnection
            {
                Id = Guid.NewGuid(),
                Name = "Test Connection",
                PasswordHash = "secret-password-hash",
                ConnectionString = "Server=localhost;Password=secret123;Database=test;"
            };

            // Act
            var result = _mapper.MapToResponse(entity);

            // Assert
            result.Should().NotBeNull();
            // Password should not be included in response at all
            // ConnectionString should have password masked
            result.ConnectionString.Should().Be("Server=localhost;Password=***;Database=test;");
        }

        [Theory]
        [InlineData("Server=localhost;Password=secret123;Database=test;", "Server=localhost;Password=***;Database=test;")]
        [InlineData("Server=localhost;password=secret123;Database=test;", "Server=localhost;password=***;Database=test;")]
        [InlineData("Server=localhost;PASSWORD=secret123;Database=test;", "Server=localhost;PASSWORD=***;Database=test;")]
        [InlineData("Server=localhost;Password = secret123;Database=test;", "Server=localhost;Password = ***;Database=test;")]
        [InlineData("Server=localhost;pwd=secret123;Database=test;", "Server=localhost;pwd=secret123;Database=test;")] // Should not mask 'pwd'
        [InlineData("Server=localhost;Database=test;", "Server=localhost;Database=test;")] // No password to mask
        [InlineData("", "")]
        [InlineData("   ", "   ")]
        public void MapToResponse_Should_Mask_Password_In_ConnectionString(string input, string expected)
        {
            // Arrange
            var entity = new DatabaseConnection
            {
                Id = Guid.NewGuid(),
                Name = "Test Connection",
                ConnectionString = input
            };

            // Act
            var result = _mapper.MapToResponse(entity);

            // Assert
            result.ConnectionString.Should().Be(expected);
        }

        [Fact]
        public void MapToResponse_Should_Handle_Null_Properties()
        {
            // Arrange
            var entity = new DatabaseConnection
            {
                Id = Guid.NewGuid(),
                Name = "Test Connection",
                Description = null,
                Port = null,
                ConnectionString = null,
                ApiBaseUrl = null,
                AdditionalSettings = null,
                ApplicationId = null,
                LastTestedAt = null,
                LastTestResult = null
            };

            // Act
            var result = _mapper.MapToResponse(entity);

            // Assert
            result.Should().NotBeNull();
            result.Description.Should().BeNull();
            result.Port.Should().BeNull();
            result.ConnectionString.Should().BeNull();
            result.ApiBaseUrl.Should().BeNull();
            result.ApplicationId.Should().BeNull();
            result.LastTestedAt.Should().BeNull();
            result.LastTestResult.Should().BeNull();
        }

        [Fact]
        public void MapUpdateToEntity_Should_Update_All_Properties()
        {
            // Arrange
            var entity = new DatabaseConnection
            {
                Id = Guid.NewGuid(),
                Name = "Old Name",
                Description = "Old Description",
                Type = DatabaseType.MySQL,
                Server = "oldserver",
                Port = 3306,
                Database = "OldDB",
                Username = "olduser",
                PasswordHash = "old-hash",
                ConnectionString = "old connection string",
                ApiBaseUrl = "https://old.api.com",
                ApiKey = "old-key",
                AdditionalSettings = "old=settings",
                ApplicationId = Guid.NewGuid(),
                IsActive = false,
                UpdatedAt = DateTime.UtcNow.AddDays(-1)
            };

            var request = new DatabaseConnectionUpdateRequest
            {
                Id = entity.Id,
                Name = "New Name",
                Description = "New Description",
                Type = DatabaseType.SqlServer,
                Server = "newserver",
                Port = 1433,
                Database = "NewDB",
                Username = "newuser",
                Password = "newpassword",
                ConnectionString = "new connection string",
                ApiBaseUrl = "https://new.api.com",
                ApiKey = "new-key",
                AdditionalSettings = "new=settings",
                ApplicationId = _applicationId,
                IsActive = true
            };

            // Act
            _mapper.MapUpdateToEntity(request, entity);

            // Assert
            entity.Id.Should().Be(request.Id); // ID should not change
            entity.Name.Should().Be(request.Name);
            entity.Description.Should().Be(request.Description);
            entity.Type.Should().Be(request.Type);
            entity.Server.Should().Be(request.Server);
            entity.Port.Should().Be(request.Port);
            entity.Database.Should().Be(request.Database);
            entity.Username.Should().Be(request.Username);
            entity.PasswordHash.Should().Be(request.Password);
            entity.ConnectionString.Should().Be(request.ConnectionString);
            entity.ApiBaseUrl.Should().Be(request.ApiBaseUrl);
            entity.ApiKey.Should().Be(request.ApiKey);
            entity.AdditionalSettings.Should().Be(request.AdditionalSettings);
            entity.ApplicationId.Should().Be(request.ApplicationId);
            entity.IsActive.Should().Be(request.IsActive);
            entity.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        }

        [Fact]
        public void MapUpdateToEntity_Should_Not_Update_Password_When_Empty()
        {
            // Arrange
            var entity = new DatabaseConnection
            {
                Id = Guid.NewGuid(),
                PasswordHash = "existing-password-hash"
            };

            var request = new DatabaseConnectionUpdateRequest
            {
                Id = entity.Id,
                Name = "Test Connection",
                Type = DatabaseType.SqlServer,
                Server = "server",
                Database = "db",
                Username = "user",
                Password = "", // Empty password
                IsActive = true
            };

            // Act
            _mapper.MapUpdateToEntity(request, entity);

            // Assert
            entity.PasswordHash.Should().Be("existing-password-hash");
        }

        [Fact]
        public void MapUpdateToEntity_Should_Not_Update_Password_When_Null()
        {
            // Arrange
            var entity = new DatabaseConnection
            {
                Id = Guid.NewGuid(),
                PasswordHash = "existing-password-hash"
            };

            var request = new DatabaseConnectionUpdateRequest
            {
                Id = entity.Id,
                Name = "Test Connection",
                Type = DatabaseType.SqlServer,
                Server = "server",
                Database = "db",
                Username = "user",
                Password = null, // Null password
                IsActive = true
            };

            // Act
            _mapper.MapUpdateToEntity(request, entity);

            // Assert
            entity.PasswordHash.Should().Be("existing-password-hash");
        }

        [Fact]
        public void MapUpdateToEntity_Should_Not_Update_Password_When_Whitespace()
        {
            // Arrange
            var entity = new DatabaseConnection
            {
                Id = Guid.NewGuid(),
                PasswordHash = "existing-password-hash"
            };

            var request = new DatabaseConnectionUpdateRequest
            {
                Id = entity.Id,
                Name = "Test Connection",
                Type = DatabaseType.SqlServer,
                Server = "server",
                Database = "db",
                Username = "user",
                Password = "   ", // Whitespace password
                IsActive = true
            };

            // Act
            _mapper.MapUpdateToEntity(request, entity);

            // Assert
            entity.PasswordHash.Should().Be("existing-password-hash");
        }

        [Fact]
        public void MapUpdateToEntity_Should_Handle_Null_Optional_Properties()
        {
            // Arrange
            var entity = new DatabaseConnection
            {
                Id = Guid.NewGuid(),
                Description = "Old Description",
                Port = 1433,
                ConnectionString = "old string",
                ApiBaseUrl = "https://api.com",
                ApiKey = "key",
                AdditionalSettings = "settings",
                ApplicationId = Guid.NewGuid()
            };

            var request = new DatabaseConnectionUpdateRequest
            {
                Id = entity.Id,
                Name = "Connection",
                Description = null,
                Type = DatabaseType.SqlServer,
                Server = "server",
                Port = null,
                Database = "db",
                Username = "user",
                Password = "pass",
                ConnectionString = null,
                ApiBaseUrl = null,
                ApiKey = null,
                AdditionalSettings = null,
                ApplicationId = null,
                IsActive = true
            };

            // Act
            _mapper.MapUpdateToEntity(request, entity);

            // Assert
            entity.Description.Should().BeNull();
            entity.Port.Should().BeNull();
            entity.ConnectionString.Should().BeNull();
            entity.ApiBaseUrl.Should().BeNull();
            entity.ApiKey.Should().BeNull();
            entity.AdditionalSettings.Should().BeNull();
            entity.ApplicationId.Should().BeNull();
        }

        [Fact]
        public void MapToResponseList_Should_Map_All_Entities()
        {
            // Arrange
            var entities = new List<DatabaseConnection>
            {
                new DatabaseConnection 
                { 
                    Id = Guid.NewGuid(), 
                    Name = "Connection 1", 
                    Type = DatabaseType.SqlServer,
                    ConnectionString = "Server=localhost;Password=secret;Database=db1;"
                },
                new DatabaseConnection 
                { 
                    Id = Guid.NewGuid(), 
                    Name = "Connection 2", 
                    Type = DatabaseType.PostgreSQL,
                    ConnectionString = "Host=localhost;Password=secret;Database=db2;"
                },
                new DatabaseConnection 
                { 
                    Id = Guid.NewGuid(), 
                    Name = "Connection 3", 
                    Type = DatabaseType.MySQL
                }
            };

            // Act
            var results = _mapper.MapToResponseList(entities).ToList();

            // Assert
            results.Should().NotBeNull();
            results.Should().HaveCount(3);
            results[0].Name.Should().Be("Connection 1");
            results[0].TypeName.Should().Be("SqlServer");
            results[0].ConnectionString.Should().Be("Server=localhost;Password=***;Database=db1;");
            results[1].Name.Should().Be("Connection 2");
            results[1].TypeName.Should().Be("PostgreSQL");
            results[1].ConnectionString.Should().Be("Host=localhost;Password=***;Database=db2;");
            results[2].Name.Should().Be("Connection 3");
            results[2].TypeName.Should().Be("MySQL");
        }

        [Fact]
        public void MapToResponse_Should_Handle_Null_ConnectionString()
        {
            // Arrange
            var entity = new DatabaseConnection
            {
                Id = Guid.NewGuid(),
                Name = "Test Connection",
                ConnectionString = null
            };

            // Act
            var result = _mapper.MapToResponse(entity);

            // Assert
            result.ConnectionString.Should().BeNull();
        }

        [Fact]
        public void MapToResponseList_Should_Handle_Empty_List()
        {
            // Arrange
            var entities = new List<DatabaseConnection>();

            // Act
            var results = _mapper.MapToResponseList(entities).ToList();

            // Assert
            results.Should().NotBeNull();
            results.Should().BeEmpty();
        }

        [Fact]
        public void MapToEntity_Should_Set_CreatedAt_And_UpdatedAt_To_Same_Value()
        {
            // Arrange
            var request = new DatabaseConnectionRequest
            {
                Name = "Test Connection",
                Type = DatabaseType.SqlServer,
                Server = "localhost",
                Database = "TestDB",
                Username = "user",
                Password = "pass",
                IsActive = true
            };

            // Act
            var result = _mapper.MapToEntity(request, _userId);

            // Assert
            result.CreatedAt.Should().Be(result.UpdatedAt);
        }

        [Theory]
        [InlineData(DatabaseType.SqlServer)]
        [InlineData(DatabaseType.PostgreSQL)]
        [InlineData(DatabaseType.MySQL)]
        [InlineData(DatabaseType.Oracle)]
        [InlineData(DatabaseType.SQLite)]
        [InlineData(DatabaseType.RestApi)]
        public void MapToEntity_Should_Handle_All_Database_Types(DatabaseType databaseType)
        {
            // Arrange
            var request = new DatabaseConnectionRequest
            {
                Name = "Test Connection",
                Type = databaseType,
                Server = "localhost",
                Database = "TestDB",
                Username = "user",
                Password = "pass",
                IsActive = true
            };

            // Act
            var result = _mapper.MapToEntity(request, _userId);

            // Assert
            result.Type.Should().Be(databaseType);
        }

        [Theory]
        [InlineData(ConnectionStatus.Untested)]
        [InlineData(ConnectionStatus.Connected)]
        [InlineData(ConnectionStatus.Failed)]
        [InlineData(ConnectionStatus.Testing)]
        public void MapToResponse_Should_Handle_All_Connection_Statuses(ConnectionStatus status)
        {
            // Arrange
            var entity = new DatabaseConnection
            {
                Id = Guid.NewGuid(),
                Name = "Test Connection",
                Status = status
            };

            // Act
            var result = _mapper.MapToResponse(entity);

            // Assert
            result.Status.Should().Be(status);
            result.StatusName.Should().Be(status.ToString());
        }
    }
}