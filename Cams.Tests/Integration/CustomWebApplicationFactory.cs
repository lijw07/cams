using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using cams.Backend.Data;
using System.Linq;

namespace Cams.Tests.Integration;

public class CustomWebApplicationFactory<TStartup> : WebApplicationFactory<TStartup> where TStartup : class
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Configure to use test environment and disable service validation
        builder.UseEnvironment("Test");
        builder.ConfigureServices(services =>
        {
            // Remove existing DbContext and DbContextFactory registrations
            var descriptorsToRemove = services.Where(d => 
                d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>) ||
                d.ServiceType == typeof(ApplicationDbContext) ||
                d.ServiceType == typeof(IDbContextFactory<ApplicationDbContext>)).ToList();
            
            foreach (var descriptor in descriptorsToRemove)
            {
                services.Remove(descriptor);
            }

            // Add in-memory database for testing with consistent configuration
            services.AddDbContext<ApplicationDbContext>(options =>
            {
                options.UseInMemoryDatabase("TestDatabase");
            }, ServiceLifetime.Scoped, ServiceLifetime.Singleton);

            // Also register the factory for services that need it
            services.AddDbContextFactory<ApplicationDbContext>(options =>
            {
                options.UseInMemoryDatabase("TestDatabase");
            }, ServiceLifetime.Singleton);

            // Build the service provider with all validations disabled for test environment
            var serviceProvider = services.BuildServiceProvider(new ServiceProviderOptions
            {
                ValidateScopes = false,
                ValidateOnBuild = false
            });

            // Create a scope to obtain a reference to the database context
            using var scope = serviceProvider.CreateScope();
            var scopedServices = scope.ServiceProvider;
            var context = scopedServices.GetRequiredService<ApplicationDbContext>();
            var logger = scopedServices.GetRequiredService<ILogger<CustomWebApplicationFactory<TStartup>>>();

            // Ensure the database is created
            context.Database.EnsureCreated();

            try
            {
                // Seed the database with test data
                SeedTestData(context);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "An error occurred seeding the database with test data.");
            }
        });
        
        // Override the host builder to disable service validation
        builder.UseDefaultServiceProvider(options =>
        {
            options.ValidateScopes = false;
            options.ValidateOnBuild = false;
        });
    }

    private void SeedTestData(ApplicationDbContext context)
    {
        // Add test data here if needed
        if (!context.Users.Any())
        {
            context.Users.Add(new cams.Backend.Model.User
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Username = "testadmin",
                Email = "admin@test.com",
                PasswordHash = HashPassword("TestAdmin123!"),
                FirstName = "Test",
                LastName = "Admin",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
            
            context.SaveChanges();
        }
    }

    private string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password);
    }
}