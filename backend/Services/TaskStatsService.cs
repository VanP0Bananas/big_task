using Microsoft.EntityFrameworkCore;
using TaskManager.Api.Data;
using TaskManager.Api.DTOs;

namespace TaskManager.Api.Services;

public class TaskStatsService
{
    private readonly AppDbContext _db;

    public TaskStatsService(AppDbContext db) => _db = db;

    public async Task<TaskStatsDto> GetStatsAsync(CancellationToken ct = default)
    {
        var tasks = await _db.Tasks.AsNoTracking().ToListAsync(ct);

        var total = tasks.Count;
        var completed = tasks.Count(t => t.IsCompleted);
        var active = total - completed;
        var completionRate = total == 0 ? 0 : (int)Math.Round(completed * 100.0 / total);

        var byPriority = tasks.GroupBy(t => t.Priority).ToDictionary(g => g.Key, g => g.Count());
        var byCategory = tasks.GroupBy(t => t.Category).ToDictionary(g => g.Key, g => g.Count());

        foreach (var key in new[] { "high", "medium", "low" })
            if (!byPriority.ContainsKey(key)) byPriority[key] = 0;
        foreach (var key in new[] { "work", "personal", "study", "other" })
            if (!byCategory.ContainsKey(key)) byCategory[key] = 0;

        double? avgCloseDays = null;
        var closed = tasks.Where(t => t.IsCompleted && t.CompletedAt.HasValue).ToList();
        if (closed.Count > 0)
        {
            var sumDays = closed.Sum(t => (t.CompletedAt!.Value - t.CreatedAt).TotalDays);
            avgCloseDays = Math.Round(sumDays / closed.Count, 1);
        }

        var weekAgo = DateTime.UtcNow.AddDays(-7);
        var last7Created = tasks.Count(t => t.CreatedAt >= weekAgo);
        var last7Completed = tasks.Count(t => t.CompletedAt.HasValue && t.CompletedAt.Value >= weekAgo);

        return new TaskStatsDto(
            total, active, completed, completionRate,
            byPriority, byCategory, avgCloseDays,
            last7Created, last7Completed
        );
    }
}
