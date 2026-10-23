using Microsoft.EntityFrameworkCore;
using TaskManager.Api.Models;

namespace TaskManager.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<TaskItem> Tasks => Set<TaskItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TaskItem>(entity =>
        {
            entity.ToTable("tasks");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).IsRequired().HasMaxLength(500);
            entity.Property(x => x.Description).HasMaxLength(2000);
            entity.Property(x => x.Priority).IsRequired().HasMaxLength(20);
            entity.Property(x => x.Category).IsRequired().HasMaxLength(20);
            entity.HasIndex(x => x.IsCompleted);
            entity.HasIndex(x => x.Priority);
            entity.HasIndex(x => x.Category);
        });
    }
}
