namespace TaskManager.Api.DTOs;

public record TaskCreateDto(
    string Title,
    string? Description,
    string Priority = "medium",
    string Category = "personal"
);

public record TaskUpdateDto(
    string Title,
    string? Description,
    string Priority,
    string Category,
    bool IsCompleted
);

public record TaskResponseDto(
    Guid Id,
    string Title,
    string? Description,
    bool IsCompleted,
    string Priority,
    string Category,
    DateTime CreatedAt,
    DateTime? CompletedAt
);

public record TaskStatsDto(
    int Total,
    int Active,
    int Completed,
    int CompletionRate,
    Dictionary<string, int> ByPriority,
    Dictionary<string, int> ByCategory,
    double? AvgCloseDays,
    int Last7DaysCreated,
    int Last7DaysCompleted
);
