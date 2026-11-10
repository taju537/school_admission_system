using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Api.Models;

namespace SchoolAdmission.Api.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<SchoolClass> Classes => Set<SchoolClass>();
    public DbSet<Hold> Holds => Set<Hold>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // SchoolClass Configuration
        modelBuilder.Entity<SchoolClass>(entity =>
        {
            entity.ToTable("Classes");
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Id).HasMaxLength(64);
            entity.Property(c => c.Name).IsRequired().HasMaxLength(256);
            entity.Property(c => c.TotalSeats).IsRequired();
            entity.Property(c => c.ConfirmedSeats).IsRequired();
            entity.Property(c => c.CreatedAt).IsRequired();
        });

        // Hold Configuration
        modelBuilder.Entity<Hold>(entity =>
        {
            entity.ToTable("Holds");
            entity.HasKey(h => h.HoldId);
            entity.Property(h => h.HoldId).HasMaxLength(64);
            entity.Property(h => h.ClassId).IsRequired().HasMaxLength(64);
            entity.Property(h => h.StudentId).IsRequired().HasMaxLength(32);
            
            entity.Property(h => h.Status)
                .IsRequired()
                .HasConversion<string>()
                .HasMaxLength(32);

            entity.Property(h => h.CreatedAt).IsRequired();
            entity.Property(h => h.ExpiresAt).IsRequired();

            // Relationship
            entity.HasOne(h => h.Class)
                .WithMany(c => c.Holds)
                .HasForeignKey(h => h.ClassId)
                .OnDelete(DeleteBehavior.Cascade);

            // Indexes for fast lookup and high concurrency querying
            entity.HasIndex(h => h.StudentId);
            entity.HasIndex(h => h.ClassId);
            entity.HasIndex(h => new { h.ClassId, h.Status, h.ExpiresAt });
            entity.HasIndex(h => new { h.ClassId, h.StudentId, h.Status });
        });
    }
}

