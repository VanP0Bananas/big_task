using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManager.Api.Data;
using TaskManager.Api.DTOs;
using TaskManager.Api.Models;
using TaskManager.Api.Services;

namespace TaskManager.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TasksController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly TaskStatsService _stats;

    public TasksController(AppDbContext db, TaskStatsService stats)
    {
        _db = db;
        _stats = stats;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TaskResponseDto>>> GetAll(
        [FromQuery] string? status,
        [FromQuery] string? category,
        [FromQuery] string? search,
        CancellationToken ct)
    {
        var query = _db.Tasks.AsNoTracking().AsQueryable();

        if (status == "active") query = query.Where(t => !t.IsCompleted);
        else if (status == "completed") query = query.Where(t => t.IsCompleted);

        if (!string.IsNullOrWhiteSpace(category) && category != "all")
            query = query.Where(t => t.Category == category);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(t => t.Title.ToLower().Contains(s));
        }

        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => ToDto(t))
            .ToListAsync(ct);

        items = items
            .OrderBy(t => PriorityOrder(t.Priority))
            .ThenByDescending(t => t.CreatedAt)
            .ToList();

        return Ok(items);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TaskResponseDto>> GetById(Guid id, CancellationToken ct)
    {
        var task = await _db.Tasks.AsNoTracking().FirstOrDefaultAsync(t => t.Id == id, ct);
        if (task is null) return NotFound();
        return Ok(ToDto(task));
    }

    [HttpPost]
    public async Task<ActionResult<TaskResponseDto>> Create([FromBody] TaskCreateDto dto, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(dto.Title))
            return BadRequest("Title is required");

        var task = new TaskItem
        {
            Id = Guid.NewGuid(),
            Title = dto.Title.Trim(),
            Description = dto.Description?.Trim(),
            Priority = NormalizePriority(dto.Priority),
            Category = NormalizeCategory(dto.Category),
            IsCompleted = false,
            CreatedAt = DateTime.UtcNow
        };

        _db.Tasks.Add(task);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = task.Id }, ToDto(task));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TaskResponseDto>> Update(Guid id, [FromBody] TaskUpdateDto dto, CancellationToken ct)
    {
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (task is null) return NotFound();
        if (string.IsNullOrWhiteSpace(dto.Title)) return BadRequest("Title is required");

        var wasCompleted = task.IsCompleted;
        task.Title = dto.Title.Trim();
        task.Description = dto.Description?.Trim();
        task.Priority = NormalizePriority(dto.Priority);
        task.Category = NormalizeCategory(dto.Category);
        task.IsCompleted = dto.IsCompleted;

        if (!wasCompleted && dto.IsCompleted) task.CompletedAt = DateTime.UtcNow;
        else if (wasCompleted && !dto.IsCompleted) task.CompletedAt = null;

        await _db.SaveChangesAsync(ct);
        return Ok(ToDto(task));
    }

    [HttpPatch("{id:guid}/toggle")]
    public async Task<ActionResult<TaskResponseDto>> Toggle(Guid id, CancellationToken ct)
    {
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (task is null) return NotFound();

        task.IsCompleted = !task.IsCompleted;
        task.CompletedAt = task.IsCompleted ? DateTime.UtcNow : null;
        await _db.SaveChangesAsync(ct);
        return Ok(ToDto(task));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (task is null) return NotFound();
        _db.Tasks.Remove(task);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpGet("stats")]
    public async Task<ActionResult<TaskStatsDto>> Stats(CancellationToken ct)
    {
        return Ok(await _stats.GetStatsAsync(ct));
    }

    private static TaskResponseDto ToDto(TaskItem t) => new(
        t.Id, t.Title, t.Description, t.IsCompleted,
        t.Priority, t.Category, t.CreatedAt, t.CompletedAt);

    private static int PriorityOrder(string p) => p switch
    {
        "high" => 0, "medium" => 1, "low" => 2, _ => 3
    };

    private static string NormalizePriority(string? p) =>
        p is "low" or "medium" or "high" ? p : "medium";

    private static string NormalizeCategory(string? c) =>
        c is "work" or "personal" or "study" or "other" ? c : "personal";
}
