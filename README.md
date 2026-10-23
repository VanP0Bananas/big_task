# Task Manager — Fullstack

Единый учебный проект для портфолио.

**Бизнес-цель:** помочь небольшим командам и фрилансерам не терять задачи, видеть приоритеты и долю выполненной работы.

## Стек

| Часть | Технологии |
|-------|------------|
| Frontend | React, TypeScript, Vite |
| Backend | C#, ASP.NET Core 8 |
| БД | PostgreSQL |
| API | REST + Swagger |

## Возможности

- CRUD задач
- Приоритеты (high / medium / low)
- Категории (работа, личное, учёба, другое)
- Поиск и фильтры
- Тёмная / светлая тема
- Аналитика: % выполнения, среднее время закрытия, активность за 7 дней
- Работа через API (C# + PostgreSQL)
- Fallback на localStorage, если API недоступен

## Структура

```
task-manager/
├── frontend/          # React + TypeScript
├── backend/           # ASP.NET Core Web API
└── README.md
```

## Быстрый старт

### 1. PostgreSQL

Создай базу:

```sql
CREATE DATABASE taskmanager;
```

Строка подключения: `backend/appsettings.json`

### 2. Backend

```bash
cd backend
dotnet restore
dotnet run
```

Swagger: http://localhost:5080/swagger

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Приложение: http://localhost:5173

## Текст для резюме

> **Task Manager** — fullstack-приложение для учёта задач.  
> Frontend: React, TypeScript. Backend: ASP.NET Core, PostgreSQL.  
> Реализованы CRUD, приоритеты, категории, фильтры, тема, REST API и аналитика  
> (% выполнения, среднее время закрытия, активность за 7 дней).  
> Цель: повысить прозрачность работы и долю закрытых задач.

## Дальше

- JWT-авторизация
- Привязка задач к пользователю
- Деплой (Vercel + Railway/Render)
