using System;
using Xunit;
using Moq;
using FluentAssertions;
using cams.Backend.Mappers;
using cams.Backend.Model;
using cams.Backend.View;
using cams.Backend.Enums;

namespace cams.Backend.Tests.Mappers
{
    public class ApplicationWithConnectionMapperTests
    {
        private readonly ApplicationWithConnectionMapper _mapper;
        private readonly Mock<IApplicationMapper> _applicationMapperMock;
        private readonly Mock<IDatabaseConnectionMapper> _connectionMapperMock;
        private readonly Guid _userId = Guid.NewGuid();

        public ApplicationWithConnectionMapperTests()
        {
            _applicationMapperMock = new Mock<IApplicationMapper>();
            _connectionMapperMock = new Mock<IDatabaseConnectionMapper>();
            _mapper = new ApplicationWithConnectionMapper(_applicationMapperMock.Object, _connectionMapperMock.Object);
        }

        [Fact]
        public void MapToEntities_Should_Map_All_Properties_Correctly()
        {
            // Arrange
            var request = new ApplicationWithConnectionRequest
            {
                ApplicationName = "Test App",
                ApplicationDescription = "Test App Description",
                Version = "1.0.0",
                Environment = "Production",
                Tags = "tag1,tag2",
                IsApplicationActive = true,
                ConnectionName = "Test Connection",
                ConnectionDescription = "Test Connection Description",
                DatabaseType = DatabaseType.SqlServer,
                Server = "localhost",
                Port = 1433,
                Database = "TestDB",
                Username = "testuser",
                Password = "testpass",
                ConnectionString = "Server=localhost;Database=TestDB;",
                ApiBaseUrl = "https://api.test.com",
                ApiKey = "test-api-key",
                AdditionalSettings = "setting1=value1;setting2=value2",
                IsConnectionActive = true
            };

            // Act
            var (application, connection) = _mapper.MapToEntities(request, _userId);

            // Assert
            // Application assertions
            application.Should().NotBeNull();
            application.UserId.Should().Be(_userId);
            application.Name.Should().Be(request.ApplicationName);
            application.Description.Should().Be(request.ApplicationDescription);
            application.Version.Should().Be(request.Version);
            application.Environment.Should().Be(request.Environment);
            application.Tags.Should().Be(request.Tags);
            application.IsActive.Should().Be(request.IsApplicationActive);
            application.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
            application.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
            application.Id.Should().NotBe(Guid.Empty);

            // Connection assertions
            connection.Should().NotBeNull();
            connection.UserId.Should().Be(_userId);
            connection.Name.Should().Be(request.ConnectionName);
            connection.Description.Should().Be(request.ConnectionDescription);
            connection.Type.Should().Be(request.DatabaseType);
            connection.Server.Should().Be(request.Server);
            connection.Port.Should().Be(request.Port);
            connection.Database.Should().Be(request.Database);
            connection.Username.Should().Be(request.Username);
            connection.PasswordHash.Should().Be(request.Password); // Note: In production this should be encrypted
            connection.ConnectionString.Should().Be(request.ConnectionString);
            connection.ApiBaseUrl.Should().Be(request.ApiBaseUrl);
            connection.ApiKey.Should().Be(request.ApiKey);
            connection.AdditionalSettings.Should().Be(request.AdditionalSettings);
            connection.IsActive.Should().Be(request.IsConnectionActive);
            connection.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
            connection.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
            connection.Id.Should().NotBe(Guid.Empty);
            connection.ApplicationId.Should().BeNull(); // Should be set after application is saved
        }

        [Fact]
        public void MapToEntities_Should_Handle_Null_Optional_Properties()
        {
            // Arrange
            var request = new ApplicationWithConnectionRequest
            {
                ApplicationName = "Test App",
                ApplicationDescription = null,
                Version = null,
                Environment = null,
                Tags = null,
                IsApplicationActive = false,
                ConnectionName = "Test Connection",
                ConnectionDescription = null,
                DatabaseType = DatabaseType.PostgreSQL,
                Server = "localhost",
                Port = null,
                Database = "TestDB",
                Username = "testuser",
                Password = "testpass",
                ConnectionString = null,
                ApiBaseUrl = null,
                ApiKey = null,
                AdditionalSettings = null,
                IsConnectionActive = false
            };

            // Act
            var (application, connection) = _mapper.MapToEntities(request, _userId);

            // Assert
            application.Description.Should().BeNull();
            application.Version.Should().BeNull();
            application.Environment.Should().BeNull();
            application.Tags.Should().BeNull();
            application.IsActive.Should().BeFalse();

            connection.Description.Should().BeNull();
            connection.Port.Should().BeNull();
            connection.ConnectionString.Should().BeNull();
            connection.ApiBaseUrl.Should().BeNull();
            connection.ApiKey.Should().BeNull();
            connection.AdditionalSettings.Should().BeNull();
            connection.IsActive.Should().BeFalse();
        }

        [Fact]
        public void MapToResponse_Should_Map_All_Properties_Correctly()
        {
            // Arrange
            var application = new Application
            {
                Id = Guid.NewGuid(),
                Name = "Test App",
                IsActive = true
            };

            var connection = new DatabaseConnection
            {
                Id = Guid.NewGuid(),
                Name = "Test Connection",
                Type = DatabaseType.SqlServer,
                IsActive = true
            };

            var appResponse = new ApplicationResponse
            {
                Id = application.Id,
                Name = application.Name,
                IsActive = application.IsActive
            };

            var connResponse = new DatabaseConnectionResponse
            {
                Id = connection.Id,
                Name = connection.Name,
                Type = connection.Type,
                IsActive = connection.IsActive
            };

            _applicationMapperMock.Setup(x => x.MapToResponse(application))
                .Returns(appResponse);
            _connectionMapperMock.Setup(x => x.MapToResponse(connection))
                .Returns(connResponse);

            var testResult = true;
            var testMessage = "Connection successful";
            var testDuration = TimeSpan.FromMilliseconds(150);

            // Act
            var result = _mapper.MapToResponse(application, connection, testResult, testMessage, testDuration);

            // Assert
            result.Should().NotBeNull();
            result.Application.Should().Be(appResponse);
            result.DatabaseConnection.Should().Be(connResponse);
            result.ConnectionTestResult.Should().Be(testResult);
            result.ConnectionTestMessage.Should().Be(testMessage);
            result.ConnectionTestDuration.Should().Be(testDuration);

            _applicationMapperMock.Verify(x => x.MapToResponse(application), Times.Once);
            _connectionMapperMock.Verify(x => x.MapToResponse(connection), Times.Once);
        }

        [Fact]
        public void MapToResponse_Should_Handle_Default_Test_Values()
        {
            // Arrange
            var application = new Application { Id = Guid.NewGuid() };
            var connection = new DatabaseConnection { Id = Guid.NewGuid() };
            var appResponse = new ApplicationResponse();
            var connResponse = new DatabaseConnectionResponse();

            _applicationMapperMock.Setup(x => x.MapToResponse(application)).Returns(appResponse);
            _connectionMapperMock.Setup(x => x.MapToResponse(connection)).Returns(connResponse);

            // Act
            var result = _mapper.MapToResponse(application, connection);

            // Assert
            result.ConnectionTestResult.Should().BeFalse();
            result.ConnectionTestMessage.Should().BeNull();
            result.ConnectionTestDuration.Should().BeNull();
        }

        [Fact]
        public void MapUpdateToEntities_Should_Update_All_Properties()
        {
            // Arrange
            var existingApp = new Application
            {
                Id = Guid.NewGuid(),
                Name = "Old App Name",
                Description = "Old Description",
                Version = "0.1.0",
                Environment = "Development",
                Tags = "old",
                IsActive = false,
                UpdatedAt = DateTime.UtcNow.AddDays(-1)
            };

            var existingConnection = new DatabaseConnection
            {
                Id = Guid.NewGuid(),
                Name = "Old Connection",
                Description = "Old Connection Description",
                Type = DatabaseType.MySQL,
                Server = "oldserver",
                Port = 3306,
                Database = "OldDB",
                Username = "olduser",
                PasswordHash = "oldhash",
                ConnectionString = "old connection string",
                ApiBaseUrl = "https://old.api.com",
                ApiKey = "old-key",
                AdditionalSettings = "old=settings",
                IsActive = false,
                UpdatedAt = DateTime.UtcNow.AddDays(-1)
            };

            var request = new ApplicationWithConnectionUpdateRequest
            {
                ApplicationName = "New App Name",
                ApplicationDescription = "New Description",
                Version = "1.0.0",
                Environment = "Production",
                Tags = "new,updated",
                IsApplicationActive = true,
                ConnectionName = "New Connection",
                ConnectionDescription = "New Connection Description",
                DatabaseType = DatabaseType.SqlServer,
                Server = "newserver",
                Port = 1433,
                Database = "NewDB",
                Username = "newuser",
                Password = "newpass",
                ConnectionString = "new connection string",
                ApiBaseUrl = "https://new.api.com",
                ApiKey = "new-key",
                AdditionalSettings = "new=settings",
                IsConnectionActive = true
            };

            // Act
            var (updatedApp, updatedConnection) = _mapper.MapUpdateToEntities(request, existingApp, existingConnection);

            // Assert
            // Application assertions
            updatedApp.Should().BeSameAs(existingApp);
            updatedApp.Id.Should().Be(existingApp.Id); // ID should not change
            updatedApp.Name.Should().Be(request.ApplicationName);
            updatedApp.Description.Should().Be(request.ApplicationDescription);
            updatedApp.Version.Should().Be(request.Version);
            updatedApp.Environment.Should().Be(request.Environment);
            updatedApp.Tags.Should().Be(request.Tags);
            updatedApp.IsActive.Should().Be(request.IsApplicationActive);
            updatedApp.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));

            // Connection assertions
            updatedConnection.Should().BeSameAs(existingConnection);
            updatedConnection.Id.Should().Be(existingConnection.Id); // ID should not change
            updatedConnection.Name.Should().Be(request.ConnectionName);
            updatedConnection.Description.Should().Be(request.ConnectionDescription);
            updatedConnection.Type.Should().Be(request.DatabaseType);
            updatedConnection.Server.Should().Be(request.Server);
            updatedConnection.Port.Should().Be(request.Port);
            updatedConnection.Database.Should().Be(request.Database);
            updatedConnection.Username.Should().Be(request.Username);
            updatedConnection.PasswordHash.Should().Be(request.Password);
            updatedConnection.ConnectionString.Should().Be(request.ConnectionString);
            updatedConnection.ApiBaseUrl.Should().Be(request.ApiBaseUrl);
            updatedConnection.ApiKey.Should().Be(request.ApiKey);
            updatedConnection.AdditionalSettings.Should().Be(request.AdditionalSettings);
            updatedConnection.IsActive.Should().Be(request.IsConnectionActive);
            updatedConnection.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        }

        [Fact]
        public void MapUpdateToEntities_Should_Not_Update_Password_When_Empty()
        {
            // Arrange
            var existingConnection = new DatabaseConnection
            {
                Id = Guid.NewGuid(),
                PasswordHash = "existing-password-hash"
            };

            var existingApp = new Application { Id = Guid.NewGuid() };

            var request = new ApplicationWithConnectionUpdateRequest
            {
                ApplicationName = "App",
                ConnectionName = "Connection",
                DatabaseType = DatabaseType.SqlServer,
                Server = "server",
                Database = "db",
                Username = "user",
                Password = "", // Empty password
                IsApplicationActive = true,
                IsConnectionActive = true
            };

            // Act
            var (_, updatedConnection) = _mapper.MapUpdateToEntities(request, existingApp, existingConnection);

            // Assert
            updatedConnection.PasswordHash.Should().Be("existing-password-hash");
        }

        [Fact]
        public void MapUpdateToEntities_Should_Not_Update_Password_When_Null()
        {
            // Arrange
            var existingConnection = new DatabaseConnection
            {
                Id = Guid.NewGuid(),
                PasswordHash = "existing-password-hash"
            };

            var existingApp = new Application { Id = Guid.NewGuid() };

            var request = new ApplicationWithConnectionUpdateRequest
            {
                ApplicationName = "App",
                ConnectionName = "Connection",
                DatabaseType = DatabaseType.SqlServer,
                Server = "server",
                Database = "db",
                Username = "user",
                Password = null, // Null password
                IsApplicationActive = true,
                IsConnectionActive = true
            };

            // Act
            var (_, updatedConnection) = _mapper.MapUpdateToEntities(request, existingApp, existingConnection);

            // Assert
            updatedConnection.PasswordHash.Should().Be("existing-password-hash");
        }

        [Fact]
        public void MapUpdateToEntities_Should_Not_Update_Password_When_Whitespace()
        {
            // Arrange
            var existingConnection = new DatabaseConnection
            {
                Id = Guid.NewGuid(),
                PasswordHash = "existing-password-hash"
            };

            var existingApp = new Application { Id = Guid.NewGuid() };

            var request = new ApplicationWithConnectionUpdateRequest
            {
                ApplicationName = "App",
                ConnectionName = "Connection",
                DatabaseType = DatabaseType.SqlServer,
                Server = "server",
                Database = "db",
                Username = "user",
                Password = "   ", // Whitespace password
                IsApplicationActive = true,
                IsConnectionActive = true
            };

            // Act
            var (_, updatedConnection) = _mapper.MapUpdateToEntities(request, existingApp, existingConnection);

            // Assert
            updatedConnection.PasswordHash.Should().Be("existing-password-hash");
        }

        [Fact]
        public void MapUpdateToEntities_Should_Handle_Null_Optional_Properties()
        {
            // Arrange
            var existingApp = new Application
            {
                Id = Guid.NewGuid(),
                Description = "Old Description",
                Version = "1.0.0",
                Environment = "Production",
                Tags = "tags"
            };

            var existingConnection = new DatabaseConnection
            {
                Id = Guid.NewGuid(),
                Description = "Old Description",
                Port = 1433,
                ConnectionString = "old string",
                ApiBaseUrl = "https://api.com",
                ApiKey = "key",
                AdditionalSettings = "settings"
            };

            var request = new ApplicationWithConnectionUpdateRequest
            {
                ApplicationName = "App",
                ApplicationDescription = null,
                Version = null,
                Environment = null,
                Tags = null,
                IsApplicationActive = true,
                ConnectionName = "Connection",
                ConnectionDescription = null,
                DatabaseType = DatabaseType.SqlServer,
                Server = "server",
                Port = null,
                Database = "db",
                Username = "user",
                Password = "pass",
                ConnectionString = null,
                ApiBaseUrl = null,
                ApiKey = null,
                AdditionalSettings = null,
                IsConnectionActive = true
            };

            // Act
            var (updatedApp, updatedConnection) = _mapper.MapUpdateToEntities(request, existingApp, existingConnection);

            // Assert
            updatedApp.Description.Should().BeNull();
            updatedApp.Version.Should().BeNull();
            updatedApp.Environment.Should().BeNull();
            updatedApp.Tags.Should().BeNull();

            updatedConnection.Description.Should().BeNull();
            updatedConnection.Port.Should().BeNull();
            updatedConnection.ConnectionString.Should().BeNull();
            updatedConnection.ApiBaseUrl.Should().BeNull();
            updatedConnection.ApiKey.Should().BeNull();
            updatedConnection.AdditionalSettings.Should().BeNull();
        }

        [Fact]
        public void Constructor_Should_Set_Dependencies()
        {
            // Arrange & Act
            var mapper = new ApplicationWithConnectionMapper(_applicationMapperMock.Object, _connectionMapperMock.Object);

            // Assert
            mapper.Should().NotBeNull();
            // Dependencies are private, but we can verify they work by calling methods
            var app = new Application();
            var conn = new DatabaseConnection();
            mapper.MapToResponse(app, conn);

            _applicationMapperMock.Verify(x => x.MapToResponse(app), Times.Once);
            _connectionMapperMock.Verify(x => x.MapToResponse(conn), Times.Once);
        }
    }
}