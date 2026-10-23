import type { TaskStats } from '../types';

const priorityLabel: Record<string, string> = {
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
};

const categoryLabel: Record<string, string> = {
  work: 'Работа',
  personal: 'Личное',
  study: 'Учёба',
  other: 'Другое',
};

function StatsPanel({ stats }: { stats: TaskStats }) {
  return (
    <section className="stats-panel">
      <h2 className="stats-title">Аналитика</h2>
      <p className="stats-goal">
        Цель: повысить прозрачность задач и долю выполненных
      </p>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{stats.completionRate}%</span>
          <span className="stat-label">Выполнено</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.active}</span>
          <span className="stat-label">Активных</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.completed}</span>
          <span className="stat-label">Закрыто</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">
            {stats.avgCloseDays !== null && stats.avgCloseDays !== undefined
              ? `${stats.avgCloseDays} дн.`
              : '—'}
          </span>
          <span className="stat-label">Среднее время закрытия</span>
        </div>
      </div>

      <div className="stats-row">
        <div className="stats-block">
          <h3>По приоритетам</h3>
          <ul>
            {['high', 'medium', 'low'].map((key) => (
              <li key={key}>
                <span>{priorityLabel[key]}</span>
                <strong>{stats.byPriority[key] ?? 0}</strong>
              </li>
            ))}
          </ul>
        </div>
        <div className="stats-block">
          <h3>По категориям</h3>
          <ul>
            {['work', 'personal', 'study', 'other'].map((key) => (
              <li key={key}>
                <span>{categoryLabel[key]}</span>
                <strong>{stats.byCategory[key] ?? 0}</strong>
              </li>
            ))}
          </ul>
        </div>
        <div className="stats-block">
          <h3>За 7 дней</h3>
          <ul>
            <li>
              <span>Создано</span>
              <strong>{stats.last7DaysCreated}</strong>
            </li>
            <li>
              <span>Выполнено</span>
              <strong>{stats.last7DaysCompleted}</strong>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export default StatsPanel;
