export type Priority = 'low' | 'medium' | 'high';
export type Category = 'work' | 'personal' | 'study' | 'other';
export type Filter = 'all' | 'active' | 'completed';
export type CategoryFilter = 'all' | Category;

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
  category: Category;
  createdAt: number;
  completedAt?: number | null;
}

export interface TaskStats {
  total: number;
  active: number;
  completed: number;
  completionRate: number;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
  avgCloseDays: number | null;
  last7DaysCreated: number;
  last7DaysCompleted: number;
}
