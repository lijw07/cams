using cams.Backend.Model;
using Microsoft.EntityFrameworkCore;

namespace cams.Backend.Data
{
    public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
    {
        public DbSet<Application> Applications { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<DatabaseConnection> DatabaseConnections { get; set; }
        public DbSet<PerformanceLog> PerformanceLogs { get; set; }
        public DbSet<SecurityLog> SecurityLogs { get; set; }
        public DbSet<SystemLog> SystemLogs { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<UserRole> UserRoles { get; set; }
        public DbSet<ConnectionTestSchedule> ConnectionTestSchedules { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User entity configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
                entity.HasIndex(e => e.Email).IsUnique();
                entity.Property(e => e.Username).IsRequired().HasMaxLength(100);
                entity.HasIndex(e => e.Username).IsUnique();
                entity.Property(e => e.PasswordHash).IsRequired();
                entity.Property(e => e.FirstName).HasMaxLength(100);
                entity.Property(e => e.LastName).HasMaxLength(100);
                entity.Property(e => e.PhoneNumber).HasMaxLength(20);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
            });

            // Role entity configuration
            modelBuilder.Entity<Role>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(50);
                entity.HasIndex(e => e.Name).IsUnique();
                entity.Property(e => e.Description).HasMaxLength(255);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
            });

            // UserRole entity configuration
            modelBuilder.Entity<UserRole>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.UserId, e.RoleId }).IsUnique();
                entity.Property(e => e.AssignedAt).HasDefaultValueSql("GETUTCDATE()");
                
                // Configure relationships
                entity.HasOne(e => e.User)
                    .WithMany(u => u.UserRoles)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
                
                entity.HasOne(e => e.Role)
                    .WithMany(r => r.UserRoles)
                    .HasForeignKey(e => e.RoleId)
                    .OnDelete(DeleteBehavior.Cascade);
                
                entity.HasOne(e => e.AssignedByUser)
                    .WithMany()
                    .HasForeignKey(e => e.AssignedBy)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Application entity configuration
            modelBuilder.Entity<Application>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.Version).HasMaxLength(50);
                entity.Property(e => e.Environment).HasMaxLength(200);
                entity.Property(e => e.Tags).HasMaxLength(500);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
                
                // Configure relationship with User
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // DatabaseConnection entity configuration
            modelBuilder.Entity<DatabaseConnection>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.Server).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Database).HasMaxLength(100);
                entity.Property(e => e.Username).HasMaxLength(100);
                entity.Property(e => e.PasswordHash).HasMaxLength(255);
                entity.Property(e => e.ConnectionString).HasMaxLength(2000);
                entity.Property(e => e.ApiBaseUrl).HasMaxLength(500);
                entity.Property(e => e.ApiKey).HasMaxLength(255);
                entity.Property(e => e.AdditionalSettings).HasMaxLength(1000);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
                
                // Configure relationships - avoid multiple cascade paths
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict); // Prevent cascade from User
                
                entity.HasOne(e => e.Application)
                    .WithMany(a => a.DatabaseConnections)
                    .HasForeignKey(e => e.ApplicationId)
                    .OnDelete(DeleteBehavior.Cascade); // Allow cascade from Application
            });

            // AuditLog entity configuration
            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Action).IsRequired().HasMaxLength(50);
                entity.Property(e => e.EntityType).IsRequired().HasMaxLength(100);
                entity.Property(e => e.EntityName).HasMaxLength(100);
                entity.Property(e => e.OldValues).HasMaxLength(2000);
                entity.Property(e => e.NewValues).HasMaxLength(2000);
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.IpAddress).IsRequired().HasMaxLength(45);
                entity.Property(e => e.UserAgent).HasMaxLength(500);
                entity.Property(e => e.Timestamp).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.Severity).HasMaxLength(20).HasDefaultValue("Information");
                
                // Configure relationship with User
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // SystemLog entity configuration
            modelBuilder.Entity<SystemLog>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.EventType).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Level).IsRequired().HasMaxLength(20);
                entity.Property(e => e.Source).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Message).IsRequired().HasMaxLength(500);
                entity.Property(e => e.Details).HasMaxLength(2000);
                entity.Property(e => e.StackTrace).HasMaxLength(2000);
                entity.Property(e => e.CorrelationId).HasMaxLength(100);
                entity.Property(e => e.IpAddress).HasMaxLength(45);
                entity.Property(e => e.RequestPath).HasMaxLength(100);
                entity.Property(e => e.HttpMethod).HasMaxLength(10);
                entity.Property(e => e.Timestamp).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.MachineName).HasMaxLength(100);
                entity.Property(e => e.ProcessId).HasMaxLength(100);
                entity.Property(e => e.ThreadId).HasMaxLength(100);
                entity.Property(e => e.Metadata).HasMaxLength(1000);
                entity.Property(e => e.ResolutionNotes).HasMaxLength(500);
                
                // Configure relationship with User
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // SecurityLog entity configuration
            modelBuilder.Entity<SecurityLog>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Username).HasMaxLength(100);
                entity.Property(e => e.EventType).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.IpAddress).IsRequired().HasMaxLength(45);
                entity.Property(e => e.UserAgent).HasMaxLength(500);
                entity.Property(e => e.SessionId).HasMaxLength(100);
                entity.Property(e => e.Resource).HasMaxLength(100);
                entity.Property(e => e.Metadata).HasMaxLength(1000);
                entity.Property(e => e.Timestamp).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.Severity).HasMaxLength(20).HasDefaultValue("Information");
                entity.Property(e => e.FailureReason).HasMaxLength(500);
                
                // Configure relationship with User
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // PerformanceLog entity configuration
            modelBuilder.Entity<PerformanceLog>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Operation).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Controller).HasMaxLength(100);
                entity.Property(e => e.Action).HasMaxLength(100);
                entity.Property(e => e.RequestPath).HasMaxLength(200);
                entity.Property(e => e.HttpMethod).HasMaxLength(10);
                entity.Property(e => e.IpAddress).HasMaxLength(45);
                entity.Property(e => e.UserAgent).HasMaxLength(500);
                entity.Property(e => e.CorrelationId).HasMaxLength(100);
                entity.Property(e => e.PerformanceLevel).HasMaxLength(50).HasDefaultValue("Normal");
                entity.Property(e => e.Metadata).HasMaxLength(1000);
                entity.Property(e => e.AlertTrigger).HasMaxLength(500);
                entity.Property(e => e.Timestamp).HasDefaultValueSql("GETUTCDATE()");
                
                // Configure relationship with User
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // ConnectionTestSchedule entity configuration
            modelBuilder.Entity<ConnectionTestSchedule>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.CronExpression).IsRequired().HasMaxLength(100);
                entity.Property(e => e.LastRunStatus).HasMaxLength(20);
                entity.Property(e => e.LastRunMessage).HasMaxLength(1000);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
                
                // Configure relationship with Application
                entity.HasOne(e => e.Application)
                    .WithMany()
                    .HasForeignKey(e => e.ApplicationId)
                    .OnDelete(DeleteBehavior.Cascade);
                
                // Ensure one schedule per application
                entity.HasIndex(e => e.ApplicationId).IsUnique();
            });
        }
    }
}