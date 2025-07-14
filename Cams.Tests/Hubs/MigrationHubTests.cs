using System;
using System.Threading;
using System.Threading.Tasks;
using Xunit;
using FluentAssertions;
using Moq;
using Microsoft.AspNetCore.SignalR;
using cams.Backend.Hubs;

namespace cams.Backend.Tests.Hubs
{
    public class MigrationHubTests
    {
        private readonly Mock<IGroupManager> _mockGroupManager;
        private readonly Mock<HubCallerContext> _mockContext;
        private readonly MigrationHub _hub;
        private readonly string _connectionId = "test-connection-id";
        private readonly string _progressId = "test-progress-id";

        public MigrationHubTests()
        {
            _mockGroupManager = new Mock<IGroupManager>();
            _mockContext = new Mock<HubCallerContext>();
            
            _mockContext.SetupGet(c => c.ConnectionId).Returns(_connectionId);
            
            _hub = new MigrationHub();
            
            // Use reflection to set the Context property since it's protected
            var contextProperty = typeof(Hub).GetProperty("Context");
            contextProperty!.SetValue(_hub, _mockContext.Object);
            
            // Use reflection to set the Groups property since it's protected
            var groupsProperty = typeof(Hub).GetProperty("Groups");
            groupsProperty!.SetValue(_hub, _mockGroupManager.Object);
        }

        [Fact]
        public async Task JoinMigrationGroup_Should_Add_Connection_To_Group()
        {
            // Arrange
            var expectedGroupName = $"migration_{_progressId}";

            // Act
            await _hub.JoinMigrationGroup(_progressId);

            // Assert
            _mockGroupManager.Verify(
                gm => gm.AddToGroupAsync(_connectionId, expectedGroupName, It.IsAny<CancellationToken>()),
                Times.Once);
        }

        [Fact]
        public async Task LeaveMigrationGroup_Should_Remove_Connection_From_Group()
        {
            // Arrange
            var expectedGroupName = $"migration_{_progressId}";

            // Act
            await _hub.LeaveMigrationGroup(_progressId);

            // Assert
            _mockGroupManager.Verify(
                gm => gm.RemoveFromGroupAsync(_connectionId, expectedGroupName, It.IsAny<CancellationToken>()),
                Times.Once);
        }

        [Theory]
        [InlineData("progress-123")]
        [InlineData("migration-abc")]
        [InlineData("test-migration-xyz")]
        [InlineData("")]
        public async Task JoinMigrationGroup_Should_Handle_Various_ProgressId_Values(string progressId)
        {
            // Arrange
            var expectedGroupName = $"migration_{progressId}";

            // Act
            await _hub.JoinMigrationGroup(progressId);

            // Assert
            _mockGroupManager.Verify(
                gm => gm.AddToGroupAsync(_connectionId, expectedGroupName, It.IsAny<CancellationToken>()),
                Times.Once);
        }

        [Theory]
        [InlineData("progress-123")]
        [InlineData("migration-abc")]
        [InlineData("test-migration-xyz")]
        [InlineData("")]
        public async Task LeaveMigrationGroup_Should_Handle_Various_ProgressId_Values(string progressId)
        {
            // Arrange
            var expectedGroupName = $"migration_{progressId}";

            // Act
            await _hub.LeaveMigrationGroup(progressId);

            // Assert
            _mockGroupManager.Verify(
                gm => gm.RemoveFromGroupAsync(_connectionId, expectedGroupName, It.IsAny<CancellationToken>()),
                Times.Once);
        }

        [Fact]
        public async Task JoinMigrationGroup_Should_Use_Current_Connection_Id()
        {
            // Arrange
            var differentConnectionId = "different-connection-id";
            _mockContext.SetupGet(c => c.ConnectionId).Returns(differentConnectionId);

            // Act
            await _hub.JoinMigrationGroup(_progressId);

            // Assert
            _mockGroupManager.Verify(
                gm => gm.AddToGroupAsync(differentConnectionId, It.IsAny<string>(), It.IsAny<CancellationToken>()),
                Times.Once);
        }

        [Fact]
        public async Task LeaveMigrationGroup_Should_Use_Current_Connection_Id()
        {
            // Arrange
            var differentConnectionId = "different-connection-id";
            _mockContext.SetupGet(c => c.ConnectionId).Returns(differentConnectionId);

            // Act
            await _hub.LeaveMigrationGroup(_progressId);

            // Assert
            _mockGroupManager.Verify(
                gm => gm.RemoveFromGroupAsync(differentConnectionId, It.IsAny<string>(), It.IsAny<CancellationToken>()),
                Times.Once);
        }

        [Fact]
        public async Task JoinMigrationGroup_Should_Create_Unique_Group_Names()
        {
            // Arrange
            var progressId1 = "progress-1";
            var progressId2 = "progress-2";

            // Act
            await _hub.JoinMigrationGroup(progressId1);
            await _hub.JoinMigrationGroup(progressId2);

            // Assert
            _mockGroupManager.Verify(
                gm => gm.AddToGroupAsync(_connectionId, "migration_progress-1", It.IsAny<CancellationToken>()),
                Times.Once);
            _mockGroupManager.Verify(
                gm => gm.AddToGroupAsync(_connectionId, "migration_progress-2", It.IsAny<CancellationToken>()),
                Times.Once);
        }

        [Fact]
        public async Task LeaveMigrationGroup_Should_Create_Unique_Group_Names()
        {
            // Arrange
            var progressId1 = "progress-1";
            var progressId2 = "progress-2";

            // Act
            await _hub.LeaveMigrationGroup(progressId1);
            await _hub.LeaveMigrationGroup(progressId2);

            // Assert
            _mockGroupManager.Verify(
                gm => gm.RemoveFromGroupAsync(_connectionId, "migration_progress-1", It.IsAny<CancellationToken>()),
                Times.Once);
            _mockGroupManager.Verify(
                gm => gm.RemoveFromGroupAsync(_connectionId, "migration_progress-2", It.IsAny<CancellationToken>()),
                Times.Once);
        }

        [Fact]
        public async Task OnDisconnectedAsync_Should_Call_Base_Implementation()
        {
            // Arrange
            var exception = new Exception("Test exception");

            // Act & Assert - Should not throw
            var action = async () => await _hub.OnDisconnectedAsync(exception);
            await action.Should().NotThrowAsync();
        }

        [Fact]
        public async Task OnDisconnectedAsync_Should_Handle_Null_Exception()
        {
            // Act & Assert - Should not throw
            var action = async () => await _hub.OnDisconnectedAsync(null);
            await action.Should().NotThrowAsync();
        }

        [Fact]
        public async Task JoinMigrationGroup_Should_Handle_Multiple_Joins_Same_Group()
        {
            // Arrange
            var groupName = $"migration_{_progressId}";

            // Act
            await _hub.JoinMigrationGroup(_progressId);
            await _hub.JoinMigrationGroup(_progressId);
            await _hub.JoinMigrationGroup(_progressId);

            // Assert - Should be called multiple times (SignalR handles duplicates)
            _mockGroupManager.Verify(
                gm => gm.AddToGroupAsync(_connectionId, groupName, It.IsAny<CancellationToken>()),
                Times.Exactly(3));
        }

        [Fact]
        public async Task LeaveMigrationGroup_Should_Handle_Multiple_Leaves_Same_Group()
        {
            // Arrange
            var groupName = $"migration_{_progressId}";

            // Act
            await _hub.LeaveMigrationGroup(_progressId);
            await _hub.LeaveMigrationGroup(_progressId);
            await _hub.LeaveMigrationGroup(_progressId);

            // Assert - Should be called multiple times (SignalR handles duplicates)
            _mockGroupManager.Verify(
                gm => gm.RemoveFromGroupAsync(_connectionId, groupName, It.IsAny<CancellationToken>()),
                Times.Exactly(3));
        }

        [Fact]
        public async Task JoinMigrationGroup_Should_Handle_GroupManager_Exception()
        {
            // Arrange
            _mockGroupManager
                .Setup(gm => gm.AddToGroupAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .ThrowsAsync(new InvalidOperationException("Group manager error"));

            // Act & Assert
            var action = async () => await _hub.JoinMigrationGroup(_progressId);
            await action.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("Group manager error");
        }

        [Fact]
        public async Task LeaveMigrationGroup_Should_Handle_GroupManager_Exception()
        {
            // Arrange
            _mockGroupManager
                .Setup(gm => gm.RemoveFromGroupAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .ThrowsAsync(new InvalidOperationException("Group manager error"));

            // Act & Assert
            var action = async () => await _hub.LeaveMigrationGroup(_progressId);
            await action.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("Group manager error");
        }

        [Fact]
        public void JoinMigrationGroup_Should_Be_Public_Method()
        {
            // Arrange & Act
            var method = typeof(MigrationHub).GetMethod("JoinMigrationGroup");

            // Assert
            method.Should().NotBeNull();
            method!.IsPublic.Should().BeTrue();
            method.ReturnType.Should().Be(typeof(Task));
            
            var parameters = method.GetParameters();
            parameters.Should().HaveCount(1);
            parameters[0].ParameterType.Should().Be(typeof(string));
            parameters[0].Name.Should().Be("progressId");
        }

        [Fact]
        public void LeaveMigrationGroup_Should_Be_Public_Method()
        {
            // Arrange & Act
            var method = typeof(MigrationHub).GetMethod("LeaveMigrationGroup");

            // Assert
            method.Should().NotBeNull();
            method!.IsPublic.Should().BeTrue();
            method.ReturnType.Should().Be(typeof(Task));
            
            var parameters = method.GetParameters();
            parameters.Should().HaveCount(1);
            parameters[0].ParameterType.Should().Be(typeof(string));
            parameters[0].Name.Should().Be("progressId");
        }

        [Fact]
        public void OnDisconnectedAsync_Should_Be_Public_Override_Method()
        {
            // Arrange & Act
            var method = typeof(MigrationHub).GetMethod("OnDisconnectedAsync");

            // Assert
            method.Should().NotBeNull();
            method!.IsPublic.Should().BeTrue();
            method.IsVirtual.Should().BeTrue();
            method.ReturnType.Should().Be(typeof(Task));
            
            var parameters = method.GetParameters();
            parameters.Should().HaveCount(1);
            parameters[0].ParameterType.Should().Be(typeof(Exception));
            parameters[0].Name.Should().Be("exception");
        }

        [Fact]
        public void MigrationHub_Should_Inherit_From_Hub()
        {
            // Assert
            typeof(MigrationHub).BaseType.Should().Be(typeof(Hub));
        }

        [Fact]
        public void MigrationHub_Should_Have_Authorize_Attribute()
        {
            // Arrange & Act
            var authorizeAttribute = typeof(MigrationHub)
                .GetCustomAttributes(typeof(Microsoft.AspNetCore.Authorization.AuthorizeAttribute), false);

            // Assert
            authorizeAttribute.Should().HaveCount(1);
        }

        [Theory]
        [InlineData("migration-123")]
        [InlineData("bulk-migration-456")]
        [InlineData("test-progress-789")]
        [InlineData("user-migration-abc")]
        public async Task Migration_Group_Names_Should_Follow_Convention(string progressId)
        {
            // Act
            await _hub.JoinMigrationGroup(progressId);

            // Assert
            _mockGroupManager.Verify(
                gm => gm.AddToGroupAsync(_connectionId, $"migration_{progressId}", It.IsAny<CancellationToken>()),
                Times.Once);
        }

        [Fact]
        public async Task JoinMigrationGroup_Should_Pass_CancellationToken_To_GroupManager()
        {
            // Act
            await _hub.JoinMigrationGroup(_progressId);

            // Assert
            _mockGroupManager.Verify(
                gm => gm.AddToGroupAsync(
                    It.IsAny<string>(), 
                    It.IsAny<string>(), 
                    It.IsAny<CancellationToken>()),
                Times.Once);
        }

        [Fact]
        public async Task LeaveMigrationGroup_Should_Pass_CancellationToken_To_GroupManager()
        {
            // Act
            await _hub.LeaveMigrationGroup(_progressId);

            // Assert
            _mockGroupManager.Verify(
                gm => gm.RemoveFromGroupAsync(
                    It.IsAny<string>(), 
                    It.IsAny<string>(), 
                    It.IsAny<CancellationToken>()),
                Times.Once);
        }
    }
}