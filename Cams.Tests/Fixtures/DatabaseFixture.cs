using Microsoft.EntityFrameworkCore;
using cams.Backend.Data;

namespace Cams.Tests.Fixtures;

public class DatabaseFixture : IDisposable
{
    public ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new ApplicationDbContext(options);
        context.Database.EnsureCreated();
        return context;
    }

    public void Dispose()
    {
        // Cleanup if needed
    }
}