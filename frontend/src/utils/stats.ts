import type { Todo, TaskStats, Priority, Category } from '../types';

const DAY_MS = 1000 * 60 * 60 * 24;

/** Локальный расчёт метрик (fallback без API) */
export function calcStatsLocal(todos: Todo[]): TaskStats {
  const total = todos.length;
  const completedTodos = todos.filter((t) => t.completed);
  const active = total - completedTodos.length;
  const completed = completedTodos.length;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

  const byPriority: Record<string, number> = { high: 0, medium: 0, low: 0 };
  const byCategory: Record<string, number> = {
    work: 0,
    personal: 0,
    study: 0,
    other: 0,
  };

  todos.forEach((t) => {
    byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
    byCategory[t.category] = (byCategory[t.category] || 0) + 1;
  });

  const closedWithTime = completedTodos.filter((t) => t.completedAt && t.createdAt);
  let avgCloseDays: number | null = null;
  if (closedWithTime.length > 0) {
    const sum = closedWithTime.reduce(
      (s, t) => s + (t.completedAt! - t.createdAt) / DAY_MS,
      0
    );
    avgCloseDays = Math.round((sum / closedWithTime.length) * 10) / 10;
  }

  const weekAgo = Date.now() - 7 * DAY_MS;
  const last7DaysCreated = todos.filter((t) => t.createdAt >= weekAgo).length;
  const last7DaysCompleted = completedTodos.filter(
    (t) => t.completedAt && t.completedAt >= weekAgo
  ).length;

  return {
    total,
    active,
    completed,
    completionRate,
    byPriority,
    byCategory,
    avgCloseDays,
    last7DaysCreated,
    last7DaysCompleted,
  };
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
