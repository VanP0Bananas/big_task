import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Todo, Filter, Priority, Category, CategoryFilter, TaskStats } from './types';
import { tasksApi } from './api/tasksApi';
import { calcStatsLocal, generateId } from './utils/stats';
import StatsPanel from './components/StatsPanel';
import './App.css';

const STORAGE_KEY = 'task-manager-data';
const THEME_KEY = 'task-manager-theme';

function loadLocalTodos(): Todo[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [useApi, setUseApi] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  const [filter, setFilter] = useState<Filter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [search, setSearch] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem(THEME_KEY) as 'light' | 'dark') || 'light';
  });
  const [showStats, setShowStats] = useState(true);

  const [text, setText] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState<Category>('personal');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Локальный режим — сохраняем в localStorage
  useEffect(() => {
    if (!useApi) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
      setStats(calcStatsLocal(todos));
    }
  }, [todos, useApi]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [list, s] = await Promise.all([
        tasksApi.getAll(),
        tasksApi.getStats(),
      ]);
      setTodos(list);
      setStats(s);
      setUseApi(true);
      setApiStatus('online');
    } catch {
      // Fallback на localStorage
      const local = loadLocalTodos();
      setTodos(local);
      setStats(calcStatsLocal(local));
      setUseApi(false);
      setApiStatus('offline');
      setError('API недоступен — работаем локально (localStorage)');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filteredTodos = useMemo(() => {
    return todos
      .filter((todo) => {
        if (filter === 'active') return !todo.completed;
        if (filter === 'completed') return todo.completed;
        return true;
      })
      .filter((todo) =>
        categoryFilter === 'all' ? true : todo.category === categoryFilter
      )
      .filter((todo) =>
        todo.text.toLowerCase().includes(search.toLowerCase().trim())
      );
  }, [todos, filter, categoryFilter, search]);

  const priorityOrder: Record<Priority, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };

  const sortedTodos = [...filteredTodos].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    try {
      if (useApi) {
        await tasksApi.create({
          title: trimmed,
          priority,
          category,
        });
        await refresh();
      } else {
        const newTodo: Todo = {
          id: generateId(),
          text: trimmed,
          completed: false,
          priority,
          category,
          createdAt: Date.now(),
          completedAt: null,
        };
        setTodos((prev) => [newTodo, ...prev]);
      }
      setText('');
      setPriority('medium');
      setCategory('personal');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания');
    }
  };

  const toggleTodo = async (id: string) => {
    try {
      if (useApi) {
        await tasksApi.toggle(id);
        await refresh();
      } else {
        setTodos((prev) =>
          prev.map((todo) => {
            if (todo.id !== id) return todo;
            const next = !todo.completed;
            return {
              ...todo,
              completed: next,
              completedAt: next ? Date.now() : null,
            };
          })
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обновления');
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      if (useApi) {
        await tasksApi.remove(id);
        await refresh();
      } else {
        setTodos((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления');
    }
  };

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const trimmed = editText.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }

    const todo = todos.find((t) => t.id === editingId);
    if (!todo) return;

    try {
      if (useApi) {
        await tasksApi.update(editingId, {
          title: trimmed,
          priority: todo.priority,
          category: todo.category,
          isCompleted: todo.completed,
        });
        await refresh();
      } else {
        setTodos((prev) =>
          prev.map((t) =>
            t.id === editingId ? { ...t, text: trimmed } : t
          )
        );
      }
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    }
  };

  const clearCompleted = async () => {
    const completed = todos.filter((t) => t.completed);
    try {
      if (useApi) {
        await Promise.all(completed.map((t) => tasksApi.remove(t.id)));
        await refresh();
      } else {
        setTodos((prev) => prev.filter((t) => !t.completed));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка очистки');
    }
  };

  const displayStats = stats ?? calcStatsLocal(todos);

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Task Manager</h1>
          <p className="header-sub">
            Fullstack: React + ASP.NET Core + PostgreSQL
          </p>
        </div>
        <div className="header-actions">
          <span
            className={`api-badge ${apiStatus}`}
            title={
              apiStatus === 'online'
                ? 'Данные с сервера'
                : 'Локальный режим (localStorage)'
            }
          >
            {apiStatus === 'online' && 'API online'}
            {apiStatus === 'offline' && 'Локально'}
            {apiStatus === 'checking' && 'Подключение...'}
          </span>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => setShowStats((v) => !v)}
          >
            {showStats ? 'Скрыть аналитику' : 'Аналитика'}
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => refresh()}
          >
            Обновить
          </button>
          <button
            className="theme-btn"
            type="button"
            onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
            aria-label="Тема"
          >
            {theme === 'light' ? 'Темная' : 'Светлая'}
          </button>
        </div>
      </header>

      {error && (
        <div className="banner-error">
          {error}
          <button type="button" onClick={() => setError('')}>
            ✕
          </button>
        </div>
      )}

      {showStats && <StatsPanel stats={displayStats} />}

      <form className="add-form" onSubmit={addTodo}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Новая задача..."
          className="input"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className="select"
        >
          <option value="low">Низкий</option>
          <option value="medium">Средний</option>
          <option value="high">Высокий</option>
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          className="select"
        >
          <option value="work">Работа</option>
          <option value="personal">Личное</option>
          <option value="study">Учёба</option>
          <option value="other">Другое</option>
        </select>
        <button type="submit" className="btn btn-primary">
          Добавить
        </button>
      </form>

      <div className="controls">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск..."
          className="input search"
        />
        <select
          className="select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
        >
          <option value="all">Все категории</option>
          <option value="work">Работа</option>
          <option value="personal">Личное</option>
          <option value="study">Учёба</option>
          <option value="other">Другое</option>
        </select>
        <div className="filters">
          {(['all', 'active', 'completed'] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' && 'Все'}
              {f === 'active' && 'Активные'}
              {f === 'completed' && 'Выполненные'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="empty">Загрузка...</p>
      ) : (
        <ul className="todo-list">
          {sortedTodos.length === 0 && <li className="empty">Нет задач</li>}
          {sortedTodos.map((todo) => (
            <li
              key={todo.id}
              className={`todo-item ${todo.completed ? 'completed' : ''} priority-${todo.priority}`}
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
                className="checkbox"
              />

              {editingId === todo.id ? (
                <div className="edit-row">
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit();
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="input edit-input"
                    autoFocus
                  />
                  <button type="button" className="btn btn-sm" onClick={saveEdit}>
                    ✓
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => setEditingId(null)}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <>
                  <div
                    className="todo-content"
                    onDoubleClick={() => startEdit(todo)}
                  >
                    <span className="todo-text">{todo.text}</span>
                    <div className="todo-meta">
                      <span className={`badge priority-${todo.priority}`}>
                        {todo.priority === 'high' && 'Высокий'}
                        {todo.priority === 'medium' && 'Средний'}
                        {todo.priority === 'low' && 'Низкий'}
                      </span>
                      <span className="badge category">
                        {todo.category === 'work' && 'Работа'}
                        {todo.category === 'personal' && 'Личное'}
                        {todo.category === 'study' && 'Учёба'}
                        {todo.category === 'other' && 'Другое'}
                      </span>
                    </div>
                  </div>
                  <div className="todo-actions">
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => startEdit(todo)}
                    >
                      Изменить
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => deleteTodo(todo.id)}
                    >
                     Удалить
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <footer className="footer">
        <span>
          {displayStats.active} активных · {displayStats.completionRate}% выполнено
        </span>
        {todos.some((t) => t.completed) && (
          <button type="button" className="btn btn-ghost" onClick={clearCompleted}>
            Очистить выполненные
          </button>
        )}
      </footer>
    </div>
  );
}

export default App;
