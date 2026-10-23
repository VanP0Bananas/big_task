import type { Priority, Category, Todo, TaskStats } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5080/api/tasks';

interface ApiTask {
  id: string;
  title: string;
  description?: string | null;
  isCompleted: boolean;
  priority: Priority;
  category: Category;
  createdAt: string;
  completedAt?: string | null;
}

interface ApiStats {
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

function mapTask(t: ApiTask): Todo {
  return {
    id: t.id,
    text: t.title,
    completed: t.isCompleted,
    priority: t.priority,
    category: t.category,
    createdAt: new Date(t.createdAt).getTime(),
    completedAt: t.completedAt ? new Date(t.completedAt).getTime() : null,
  };
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Ошибка ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const tasksApi = {
  async getAll(params?: {
    status?: string;
    category?: string;
    search?: string;
  }): Promise<Todo[]> {
    const q = new URLSearchParams();
    if (params?.status && params.status !== 'all') q.set('status', params.status);
    if (params?.category && params.category !== 'all') q.set('category', params.category);
    if (params?.search) q.set('search', params.search);
    const query = q.toString();
    const data = await request<ApiTask[]>(`${API_URL}${query ? `?${query}` : ''}`);
    return data.map(mapTask);
  },

  async getStats(): Promise<TaskStats> {
    return request<ApiStats>(`${API_URL}/stats`);
  },

  async create(data: {
    title: string;
    priority?: Priority;
    category?: Category;
  }): Promise<Todo> {
    const created = await request<ApiTask>(API_URL, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return mapTask(created);
  },

  async toggle(id: string): Promise<Todo> {
    const updated = await request<ApiTask>(`${API_URL}/${id}/toggle`, {
      method: 'PATCH',
    });
    return mapTask(updated);
  },

  async update(
    id: string,
    data: {
      title: string;
      priority: Priority;
      category: Category;
      isCompleted: boolean;
    }
  ): Promise<Todo> {
    const updated = await request<ApiTask>(`${API_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return mapTask(updated);
  },

  async remove(id: string): Promise<void> {
    await request<void>(`${API_URL}/${id}`, { method: 'DELETE' });
  },
};
