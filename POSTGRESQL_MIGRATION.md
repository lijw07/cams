# CAMS PostgreSQL Migration Guide

## Why PostgreSQL Over MongoDB?

### ✅ PostgreSQL Wins for CAMS
- **5-minute migration** vs complete rewrite for MongoDB
- **Entity Framework compatibility** - no code changes needed
- **Relational data model** - perfect for users/roles/applications
- **Railway native support** - $5/month managed service
- **JSON support** - flexible data when needed
- **Strong consistency** - critical for audit logs

### ❌ MongoDB Would Require
- Complete ORM rewrite (weeks of work)
- Schema redesign for document structure  
- Complex aggregation queries
- Loss of referential integrity
- Migration of relational patterns

## Migration Steps: SQL Server → PostgreSQL

### 1. Update NuGet Packages

```xml
<!-- In Backend.csproj, replace SQL Server with PostgreSQL -->
<PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="8.0.0" />
<!-- Replace with: -->
<PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="8.0.0" />
```

### 2. Update Connection String Configuration

```csharp
// In Program.cs
// OLD (SQL Server):
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));

// NEW (PostgreSQL):
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));
```

### 3. Update SQL-Specific Code

#### ApplicationDbContext.cs Changes

```csharp
// OLD (SQL Server specific):
entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");

// NEW (PostgreSQL compatible):
entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW()");
entity.Property(e => e.UpdatedAt).HasDefaultValueSql("NOW()");
```

#### Case Sensitivity Updates

```csharp
// PostgreSQL is case-sensitive, update queries:
// OLD:
var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

// NEW (case-insensitive):
var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
```

### 4. Create Migration Script

```bash
# Remove old migrations
rm -rf Backend/Migrations/*

# Create new PostgreSQL migration
cd Backend
dotnet ef migrations add InitialCreate
dotnet ef database update
```

### 5. Update Connection String Format

```bash
# SQL Server format:
Server=localhost;Database=CamsDatabase;Trusted_Connection=true;

# PostgreSQL format:
Host=localhost;Database=camsdb;Username=postgres;Password=yourpassword;
```

### 6. Railway Deployment Configuration

```bash
# Railway automatically provides DATABASE_URL in this format:
# postgresql://user:pass@host:port/database

# In appsettings.json:
{
  "ConnectionStrings": {
    "DefaultConnection": "${DATABASE_URL}"
  }
}
```

## Data Type Mapping

### Automatic Conversions
```csharp
// These map automatically:
string → text
int → integer  
Guid → uuid
DateTime → timestamp
bool → boolean
decimal → numeric
```

### Special Cases
```csharp
// SQL Server NVARCHAR(MAX) → PostgreSQL TEXT
[StringLength(2000)] → Works the same

// SQL Server uniqueidentifier → PostgreSQL uuid
Guid Id { get; set; } → Works the same

// SQL Server DATETIME2 → PostgreSQL timestamp
DateTime CreatedAt { get; set; } → Works the same
```

## Performance Optimizations

### 1. Indexes (same as SQL Server)
```csharp
entity.HasIndex(e => e.Email).IsUnique();
entity.HasIndex(e => new { e.UserId, e.RoleId }).IsUnique();
```

### 2. PostgreSQL-Specific Features
```csharp
// Full-text search capability
entity.HasIndex(e => e.Description)
      .HasMethod("GIN")
      .IsTsVectorExpressionIndex("english");

// JSON columns for flexible data
entity.Property(e => e.Metadata)
      .HasColumnType("jsonb");
```

### 3. Connection Pooling
```csharp
// In Program.cs
builder.Services.AddDbContextPool<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure(3);
        npgsqlOptions.CommandTimeout(30);
    }));
```

## Testing the Migration

### 1. Local Testing
```bash
# Install PostgreSQL locally
brew install postgresql  # macOS
sudo apt install postgresql  # Ubuntu

# Create test database
createdb camsdb_test

# Update connection string for testing
# Run migrations
dotnet ef database update

# Test the application
dotnet run
```

### 2. Data Verification
```sql
-- Check table creation
\dt

-- Verify data integrity
SELECT COUNT(*) FROM "Users";
SELECT COUNT(*) FROM "Applications"; 
SELECT COUNT(*) FROM "AuditLogs";

-- Check relationships
SELECT u."Email", COUNT(a."Id") as ApplicationCount
FROM "Users" u
LEFT JOIN "Applications" a ON u."Id" = a."UserId"
GROUP BY u."Id", u."Email";
```

## Migration Checklist

### Pre-Migration
- [ ] Backup SQL Server database
- [ ] Update NuGet packages
- [ ] Test locally with PostgreSQL
- [ ] Update connection strings
- [ ] Create new migrations

### During Migration  
- [ ] Deploy to Railway with PostgreSQL
- [ ] Run database migrations
- [ ] Verify data integrity
- [ ] Test all CRUD operations
- [ ] Check logging functionality

### Post-Migration
- [ ] Monitor application performance
- [ ] Verify audit logs are working
- [ ] Test user authentication
- [ ] Validate database connections
- [ ] Performance testing

## Rollback Plan

If issues arise:

1. **Keep SQL Server backup**
2. **Railway environments** - easy to rollback
3. **Git branches** - separate migration branch
4. **Database restore** - Railway provides backups

## Cost Comparison

### SQL Server (Current)
- Local development: Free
- Azure SQL: $5-50/month
- AWS RDS SQL Server: $25-100/month

### PostgreSQL (Railway)
- Development: Free tier
- Production: $5/month
- Automatic backups included
- Managed updates and security

## Why Not MongoDB?

### Code Rewrite Required
```csharp
// Current EF Core (works with PostgreSQL):
var userApps = await _context.Users
    .Include(u => u.Applications)
    .ThenInclude(a => a.DatabaseConnections)
    .Where(u => u.IsActive)
    .ToListAsync();

// MongoDB equivalent (complete rewrite needed):
var pipeline = new BsonDocument[]
{
    new BsonDocument("$match", new BsonDocument("isActive", true)),
    new BsonDocument("$lookup", new BsonDocument
    {
        { "from", "applications" },
        { "localField", "_id" },
        { "foreignField", "userId" },
        { "as", "applications" }
    }),
    new BsonDocument("$lookup", new BsonDocument
    {
        { "from", "databaseConnections" },
        { "localField", "applications._id" },
        { "foreignField", "applicationId" },
        { "as", "applications.connections" }
    })
};
```

### Schema Complexity
- User ↔ Role many-to-many relationships
- Application ↔ DatabaseConnection one-to-many
- Audit logging requires strict schemas
- Foreign key constraints for data integrity

## Conclusion

**PostgreSQL is the optimal choice** for CAMS:
- **Minimal migration effort** (hours vs weeks)
- **Keeps relational benefits** 
- **Railway native support**
- **Cost effective** ($5/month)
- **Future flexibility** with JSON support

MongoDB would require a complete application rewrite with no significant benefits for this use case.