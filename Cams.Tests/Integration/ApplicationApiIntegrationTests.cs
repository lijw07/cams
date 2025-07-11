using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using cams.Backend.View;
using cams.Backend.Model;
using Microsoft.Extensions.DependencyInjection;
using cams.Backend.Data;

namespace Cams.Tests.Integration;

public class ApplicationApiIntegrationTests : IClassFixture<CustomWebApplicationFactory<Program>>
{
    private readonly CustomWebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private readonly JsonSerializerOptions _jsonOptions;

    public ApplicationApiIntegrationTests(CustomWebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = null // Use PascalCase as per the API
        };
    }

    private async Task<string> GetAuthTokenAsync()
    {
        var loginRequest = new LoginRequest
        {
            Username = "testadmin",
            Password = "TestAdmin123!"
        };

        var response = await _client.PostAsJsonAsync("/auth/authenticate", loginRequest, _jsonOptions);
        response.EnsureSuccessStatusCode();

        var loginResponse = await response.Content.ReadFromJsonAsync<LoginResponse>(_jsonOptions);
        return loginResponse!.Token;
    }

    [Fact]
    public async Task GetApplications_WithoutAuth_ReturnsUnauthorized()
    {
        // Act
        var response = await _client.GetAsync("/applications");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetApplications_WithAuth_ReturnsOk()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync("/applications");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task CreateApplication_WithValidData_ReturnsCreated()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var request = new ApplicationRequest
        {
            Name = "Integration Test App",
            Description = "Created via integration test",
            Version = "1.0.0",
            Environment = "Test",
            Tags = "integration,test",
            IsActive = true
        };

        // Act
        var response = await _client.PostAsJsonAsync("/applications", request, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        
        var createdApp = await response.Content.ReadFromJsonAsync<ApplicationResponse>(_jsonOptions);
        createdApp.Should().NotBeNull();
        createdApp!.Name.Should().Be("Integration Test App");
    }

    [Fact]
    public async Task GetApplication_WithValidId_ReturnsApplication()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // First create an application
        var createRequest = new ApplicationRequest
        {
            Name = "Test App for Get",
            IsActive = true
        };
        
        var createResponse = await _client.PostAsJsonAsync("/applications", createRequest, _jsonOptions);
        var createdApp = await createResponse.Content.ReadFromJsonAsync<ApplicationResponse>(_jsonOptions);

        // Act
        var response = await _client.GetAsync($"/applications/{createdApp!.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var retrievedApp = await response.Content.ReadFromJsonAsync<ApplicationResponse>(_jsonOptions);
        retrievedApp!.Id.Should().Be(createdApp.Id);
        retrievedApp.Name.Should().Be("Test App for Get");
    }

    [Fact]
    public async Task UpdateApplication_WithValidData_ReturnsOk()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // First create an application
        var createRequest = new ApplicationRequest
        {
            Name = "Original Name",
            IsActive = true
        };
        
        var createResponse = await _client.PostAsJsonAsync("/applications", createRequest, _jsonOptions);
        var createdApp = await createResponse.Content.ReadFromJsonAsync<ApplicationResponse>(_jsonOptions);

        var updateRequest = new ApplicationUpdateRequest
        {
            Id = createdApp!.Id,
            Name = "Updated Name",
            Description = "Updated via integration test",
            IsActive = false
        };

        // Act
        var response = await _client.PutAsJsonAsync($"/applications/{createdApp.Id}", updateRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var updatedApp = await response.Content.ReadFromJsonAsync<ApplicationResponse>(_jsonOptions);
        updatedApp!.Name.Should().Be("Updated Name");
        updatedApp.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task DeleteApplication_WithValidId_ReturnsNoContent()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // First create an application
        var createRequest = new ApplicationRequest
        {
            Name = "App to Delete",
            IsActive = true
        };
        
        var createResponse = await _client.PostAsJsonAsync("/applications", createRequest, _jsonOptions);
        var createdApp = await createResponse.Content.ReadFromJsonAsync<ApplicationResponse>(_jsonOptions);

        // Act
        var response = await _client.DeleteAsync($"/applications/{createdApp!.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Verify it's deleted
        var getResponse = await _client.GetAsync($"/applications/{createdApp.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetApplicationsPaginated_ReturnsPagedResults()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Create multiple applications
        for (int i = 0; i < 5; i++)
        {
            var request = new ApplicationRequest
            {
                Name = $"Paged App {i}",
                IsActive = true
            };
            await _client.PostAsJsonAsync("/applications", request, _jsonOptions);
        }

        // Act
        var response = await _client.GetAsync("/applications?page-number=1&page-size=2");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var pagedResult = await response.Content.ReadFromJsonAsync<PagedResult<ApplicationResponse>>(_jsonOptions);
        pagedResult.Should().NotBeNull();
        pagedResult!.PageSize.Should().Be(2);
        pagedResult.Items.Should().HaveCountLessOrEqualTo(2);
    }

    [Fact]
    public async Task CreateApplicationWithConnection_CreatesApplicationAndConnection()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var request = new ApplicationWithConnectionRequest
        {
            ApplicationName = "App with DB",
            ApplicationDescription = "Test app with database",
            IsApplicationActive = true,
            ConnectionName = "Test DB Connection",
            ConnectionDescription = "Test connection",
            DatabaseType = cams.Backend.Enums.DatabaseType.SqlServer,
            Server = "localhost",
            Port = 1433,
            Database = "TestDB",
            Username = "sa",
            Password = "TestPassword123!",
            IsConnectionActive = true,
            TestConnectionOnCreate = false
        };

        // Act
        var response = await _client.PostAsJsonAsync("/applications/with-connection", request, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        
        var result = await response.Content.ReadFromJsonAsync<ApplicationWithConnectionResponse>(_jsonOptions);
        result.Should().NotBeNull();
        result!.Application.Name.Should().Be("App with DB");
        result.DatabaseConnection.Name.Should().Be("Test DB Connection");
    }
}