# Деплой бэкенда на Railway

Пошаговая инструкция: развернуть API (NestJS + Prisma + SQLite) на Railway.

---

## Шаг 1. Новый проект

1. Зайдите на [railway.app](https://railway.app) и войдите в аккаунт.
2. **New Project** → выберите **Deploy from GitHub repo** (если репозиторий уже подключён) или **Empty Project** (деплой через CLI позже).

---

## Шаг 2. Добавить сервис (бэкенд)

- Если **Deploy from GitHub**:
  - Выберите репозиторий с проектом GYM APP.
  - **Root Directory** укажите: `backend`.
  - Railway сам определит Node.js и начнёт сборку.
- Если **Empty Project**:
  - Нажмите **Add Service** → **GitHub Repo** и выберите репозиторий, Root Directory: `backend`.

---

## Шаг 3. Volume для SQLite (чтобы база не пропадала)

1. Откройте созданный сервис (бэкенд).
2. Вкладка **Variables** или **Settings** → **Volumes**.
3. **Add Volume** → Mount Path: `/data`.
4. В **Variables** добавьте переменную:
   - `DATABASE_URL` = `file:/data/prod.db`

Так база будет храниться на диске, а не в контейнере.

---

## Шаг 4. Остальные переменные окружения

В том же разделе **Variables** добавьте (подставьте свои значения):

| Переменная | Значение | Обязательно |
|------------|----------|-------------|
| `NODE_ENV` | `production` | да |
| `TELEGRAM_BOT_TOKEN` | Токен от @BotFather | да |
| `WEBAPP_URL` | URL Mini App (например `https://your-app.vercel.app/app`) | да |
| `FRONTEND_URL` | Тот же домен фронта (например `https://your-app.vercel.app`) | да |
| `JWT_SECRET` | Длинная случайная строка для админки | да |
| `ADMIN_CHAT_ID` | (по желанию) ID чата для уведомлений | нет |

`PORT` Railway подставит сам, указывать не нужно.

---

## Шаг 5. Сборка и запуск

1. **Build Command** можно оставить пустым: по умолчанию Railway выполнит `npm install` и `npm run build`. В проекте скрипт `build` уже включает `prisma generate`.

2. **Start Command** (в **Settings** → **Deploy**):
   ```bash
   npx prisma db push && node dist/main.js
   ```
   Так при каждом запуске схема БД подтягивается, а потом стартует API.

3. **Root Directory** (если ещё не указали): `backend`.

Сохраните настройки. Railway пересоберёт и задеплоит проект.

---

## Шаг 6. Публичный URL

1. В сервисе откройте **Settings** → **Networking** (или **Generate Domain**).
2. Нажмите **Generate Domain** — появится ссылка вида `xxx.up.railway.app`.
3. Скопируйте её (например: `https://gym-backend-production.up.railway.app`).

API будет доступен по адресу: **`https://xxx.up.railway.app/api`** (префикс `/api` задан в NestJS).

---

## Шаг 7. CORS и фронт

В переменных окружения уже указаны `FRONTEND_URL` и `WEBAPP_URL` — бэкенд разрешит запросы с этого домена. Если фронт и админка на Vercel, укажите их домены (например `https://your-project.vercel.app`).

---

## Шаг 8. Проверка

- В браузере: `https://ваш-домен.up.railway.app/api` — ответ (например 404 для корня или JSON от какого-то эндпоинта).
- Mini App и админка: в их `.env.production` задайте:
  ```env
  VITE_API_URL=https://ваш-домен.up.railway.app/api
  ```

---

## Краткий чеклист

- [ ] Проект создан, сервис из папки `backend` добавлен.
- [ ] Volume с путём `/data`, переменная `DATABASE_URL=file:/data/prod.db`.
- [ ] Заданы `TELEGRAM_BOT_TOKEN`, `WEBAPP_URL`, `FRONTEND_URL`, `JWT_SECRET`.
- [ ] Build: `npm ci && npx prisma generate && npm run build`.
- [ ] Start: `npx prisma db push && node dist/main.js`.
- [ ] Сгенерирован домен, URL скопирован в фронт и в BotFather (Menu Button).

В `backend/package.json` скрипт `build` уже вызывает `prisma generate`, поэтому отдельно настраивать Build Command не нужно.
