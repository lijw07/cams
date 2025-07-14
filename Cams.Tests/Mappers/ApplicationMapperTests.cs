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
    public class ApplicationMapperTests
    {
        private readonly ApplicationMapper _mapper;
        private readonly Guid _userId = Guid.NewGuid();

        public ApplicationMapperTests()
        {
            _mapper = new ApplicationMapper();
        }

        [Fact]
        public void MapToEntity_Should_Map_All_Properties_Correctly()
        {
            // Arrange
            var request = new ApplicationRequest
            {
                Name = "Test Application",
                Description = "Test Description",
                Version = "1.0.0",
                Environment = "Production",
                Tags = "tag1,tag2,tag3",
                IsActive = true
            };

            // Act
            var result = _mapper.MapToEntity(request, _userId);

            // Assert
            result.Should().NotBeNull();
            result.UserId.Should().Be(_userId);
            result.Name.Should().Be(request.Name);
            result.Description.Should().Be(request.Description);
            result.Version.Should().Be(request.Version);
            result.Environment.Should().Be(request.Environment);
            result.Tags.Should().Be(request.Tags);
            result.IsActive.Should().Be(request.IsActive);
            result.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
            result.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
            result.Id.Should().NotBe(Guid.Empty); // New entity should have ID generated
        }

        [Fact]
        public void MapToEntity_Should_Handle_Null_Optional_Properties()
        {
            // Arrange
            var request = new ApplicationRequest
            {
                Name = "Test Application",
                Description = null,
                Version = null,
                Environment = null,
                Tags = null,
                IsActive = false
            };

            // Act
            var result = _mapper.MapToEntity(request, _userId);

            // Assert
            result.Should().NotBeNull();
            result.Name.Should().Be(request.Name);
            result.Description.Should().BeNull();
            result.Version.Should().BeNull();
            result.Environment.Should().BeNull();
            result.Tags.Should().BeNull();
            result.IsActive.Should().BeFalse();
        }

        [Fact]
        public void MapToResponse_Should_Map_All_Properties_Correctly()
        {
            // Arrange
            var entity = new Application
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Name = "Test Application",
                Description = "Test Description",
                Version = "1.0.0",
                Environment = "Production",
                Tags = "tag1,tag2",
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                UpdatedAt = DateTime.UtcNow,
                LastAccessedAt = DateTime.UtcNow.AddHours(-2),
                DatabaseConnections = new List<DatabaseConnection>
                {
                    new DatabaseConnection
                    {
                        Id = Guid.NewGuid(),
                        Name = "Connection 1",
                        Type = DatabaseType.SqlServer,
                        IsActive = true,
                        Status = ConnectionStatus.Connected,
                        LastTestedAt = DateTime.UtcNow.AddMinutes(-30)
                    },
                    new DatabaseConnection
                    {
                        Id = Guid.NewGuid(),
                        Name = "Connection 2",
                        Type = DatabaseType.PostgreSQL,
                        IsActive = false,
                        Status = ConnectionStatus.Failed,
                        LastTestedAt = null
                    }
                }
            };

            // Act
            var result = _mapper.MapToResponse(entity);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().Be(entity.Id);
            result.Name.Should().Be(entity.Name);
            result.Description.Should().Be(entity.Description);
            result.Version.Should().Be(entity.Version);
            result.Environment.Should().Be(entity.Environment);
            result.Tags.Should().Be(entity.Tags);
            result.IsActive.Should().Be(entity.IsActive);
            result.CreatedAt.Should().Be(entity.CreatedAt);
            result.UpdatedAt.Should().Be(entity.UpdatedAt);
            result.LastAccessedAt.Should().Be(entity.LastAccessedAt);
            result.DatabaseConnectionCount.Should().Be(2);
            
            result.DatabaseConnections.Should().NotBeNull();
            result.DatabaseConnections.Should().HaveCount(2);
            
            var firstConnection = result.DatabaseConnections.First();
            firstConnection.Id.Should().Be(entity.DatabaseConnections.First().Id);
            firstConnection.Name.Should().Be("Connection 1");
            firstConnection.TypeName.Should().Be("SqlServer");
            firstConnection.IsActive.Should().BeTrue();
            firstConnection.StatusName.Should().Be("Connected");
            firstConnection.LastTestedAt.Should().NotBeNull();
            
            var secondConnection = result.DatabaseConnections.Last();
            secondConnection.TypeName.Should().Be("PostgreSQL");
            secondConnection.IsActive.Should().BeFalse();
            secondConnection.StatusName.Should().Be("Failed");
            secondConnection.LastTestedAt.Should().BeNull();
        }

        [Fact]
        public void MapToResponse_Should_Handle_Null_DatabaseConnections()
        {
            // Arrange
            var entity = new Application
            {
                Id = Guid.NewGuid(),
                Name = "Test Application",
                DatabaseConnections = null
            };

            // Act
            var result = _mapper.MapToResponse(entity);

            // Assert
            result.Should().NotBeNull();
            result.DatabaseConnectionCount.Should().Be(0);
            result.DatabaseConnections.Should().BeNull();
        }

        [Fact]
        public void MapToResponse_Should_Handle_Empty_DatabaseConnections()
        {
            // Arrange
            var entity = new Application
            {
                Id = Guid.NewGuid(),
                Name = "Test Application",
                DatabaseConnections = new List<DatabaseConnection>()
            };

            // Act
            var result = _mapper.MapToResponse(entity);

            // Assert
            result.Should().NotBeNull();
            result.DatabaseConnectionCount.Should().Be(0);
            result.DatabaseConnections.Should().NotBeNull();
            result.DatabaseConnections.Should().BeEmpty();
        }

        [Fact]
        public void MapToSummaryResponse_Should_Map_All_Properties_Correctly()
        {
            // Arrange
            var entity = new Application
            {
                Id = Guid.NewGuid(),
                Name = "Test Application",
                Description = "Test Description",
                Version = "1.0.0",
                Environment = "Production",
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                UpdatedAt = DateTime.UtcNow,
                LastAccessedAt = DateTime.UtcNow.AddHours(-2),
                DatabaseConnections = new List<DatabaseConnection>
                {
                    new DatabaseConnection { IsActive = true },
                    new DatabaseConnection { IsActive = true },
                    new DatabaseConnection { IsActive = false }
                }
            };

            // Act
            var result = _mapper.MapToSummaryResponse(entity);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().Be(entity.Id);
            result.Name.Should().Be(entity.Name);
            result.Description.Should().Be(entity.Description);
            result.Version.Should().Be(entity.Version);
            result.Environment.Should().Be(entity.Environment);
            result.IsActive.Should().Be(entity.IsActive);
            result.CreatedAt.Should().Be(entity.CreatedAt);
            result.UpdatedAt.Should().Be(entity.UpdatedAt);
            result.LastAccessedAt.Should().Be(entity.LastAccessedAt);
            result.DatabaseConnectionCount.Should().Be(3);
            result.ActiveConnectionCount.Should().Be(2);
        }

        [Fact]
        public void MapToSummaryResponse_Should_Handle_Null_DatabaseConnections()
        {
            // Arrange
            var entity = new Application
            {
                Id = Guid.NewGuid(),
                Name = "Test Application",
                DatabaseConnections = null
            };

            // Act
            var result = _mapper.MapToSummaryResponse(entity);

            // Assert
            result.Should().NotBeNull();
            result.DatabaseConnectionCount.Should().Be(0);
            result.ActiveConnectionCount.Should().Be(0);
        }

        [Fact]
        public void MapUpdateToEntity_Should_Update_All_Properties()
        {
            // Arrange
            var entity = new Application
            {
                Id = Guid.NewGuid(),
                Name = "Old Name",
                Description = "Old Description",
                Version = "0.1.0",
                Environment = "Development",
                Tags = "old",
                IsActive = false,
                UpdatedAt = DateTime.UtcNow.AddDays(-1)
            };

            var request = new ApplicationUpdateRequest
            {
                Id = entity.Id,
                Name = "New Name",
                Description = "New Description",
                Version = "1.0.0",
                Environment = "Production",
                Tags = "new,updated",
                IsActive = true
            };

            // Act
            _mapper.MapUpdateToEntity(request, entity);

            // Assert
            entity.Id.Should().Be(request.Id); // ID should not change
            entity.Name.Should().Be(request.Name);
            entity.Description.Should().Be(request.Description);
            entity.Version.Should().Be(request.Version);
            entity.Environment.Should().Be(request.Environment);
            entity.Tags.Should().Be(request.Tags);
            entity.IsActive.Should().Be(request.IsActive);
            entity.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        }

        [Fact]
        public void MapUpdateToEntity_Should_Handle_Null_Values()
        {
            // Arrange
            var entity = new Application
            {
                Id = Guid.NewGuid(),
                Name = "Test Name",
                Description = "Test Description",
                Version = "1.0.0",
                Environment = "Production",
                Tags = "tags",
                IsActive = true
            };

            var request = new ApplicationUpdateRequest
            {
                Id = entity.Id,
                Name = "New Name",
                Description = null,
                Version = null,
                Environment = null,
                Tags = null,
                IsActive = false
            };

            // Act
            _mapper.MapUpdateToEntity(request, entity);

            // Assert
            entity.Name.Should().Be("New Name");
            entity.Description.Should().BeNull();
            entity.Version.Should().BeNull();
            entity.Environment.Should().BeNull();
            entity.Tags.Should().BeNull();
            entity.IsActive.Should().BeFalse();
        }

        [Fact]
        public void MapToResponseList_Should_Map_All_Entities()
        {
            // Arrange
            var entities = new List<Application>
            {
                new Application { Id = Guid.NewGuid(), Name = "App 1" },
                new Application { Id = Guid.NewGuid(), Name = "App 2" },
                new Application { Id = Guid.NewGuid(), Name = "App 3" }
            };

            // Act
            var results = _mapper.MapToResponseList(entities).ToList();

            // Assert
            results.Should().NotBeNull();
            results.Should().HaveCount(3);
            results[0].Name.Should().Be("App 1");
            results[1].Name.Should().Be("App 2");
            results[2].Name.Should().Be("App 3");
        }

        [Fact]
        public void MapToResponseList_Should_Handle_Empty_List()
        {
            // Arrange
            var entities = new List<Application>();

            // Act
            var results = _mapper.MapToResponseList(entities).ToList();

            // Assert
            results.Should().NotBeNull();
            results.Should().BeEmpty();
        }

        [Fact]
        public void MapToSummaryResponseList_Should_Map_All_Entities()
        {
            // Arrange
            var entities = new List<Application>
            {
                new Application 
                { 
                    Id = Guid.NewGuid(), 
                    Name = "App 1",
                    DatabaseConnections = new List<DatabaseConnection>
                    {
                        new DatabaseConnection { IsActive = true },
                        new DatabaseConnection { IsActive = false }
                    }
                },
                new Application 
                { 
                    Id = Guid.NewGuid(), 
                    Name = "App 2",
                    DatabaseConnections = new List<DatabaseConnection>
                    {
                        new DatabaseConnection { IsActive = true }
                    }
                }
            };

            // Act
            var results = _mapper.MapToSummaryResponseList(entities).ToList();

            // Assert
            results.Should().NotBeNull();
            results.Should().HaveCount(2);
            results[0].Name.Should().Be("App 1");
            results[0].DatabaseConnectionCount.Should().Be(2);
            results[0].ActiveConnectionCount.Should().Be(1);
            results[1].Name.Should().Be("App 2");
            results[1].DatabaseConnectionCount.Should().Be(1);
            results[1].ActiveConnectionCount.Should().Be(1);
        }

        [Fact]
        public void MapToSummaryResponseList_Should_Handle_Empty_List()
        {
            // Arrange
            var entities = new List<Application>();

            // Act
            var results = _mapper.MapToSummaryResponseList(entities).ToList();

            // Assert
            results.Should().NotBeNull();
            results.Should().BeEmpty();
        }

        [Fact]
        public void MapToEntity_Should_Set_CreatedAt_And_UpdatedAt_To_Same_Value()
        {
            // Arrange
            var request = new ApplicationRequest
            {
                Name = "Test Application",
                IsActive = true
            };

            // Act
            var result = _mapper.MapToEntity(request, _userId);

            // Assert
            result.CreatedAt.Should().Be(result.UpdatedAt);
        }
    }
}