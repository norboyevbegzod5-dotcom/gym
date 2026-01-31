# Деплой бэкенда на Railway

Пошаговая инструкция: развернуть API (NestJS + Prisma + PostgreSQL) на Railway.

**Без покупки домена:** API на Railway, Mini App и админка на Vercel, см. [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md).

---

## Шаг 1. Новый проект

1. Зайдите на [railway.app](https://railway.app) и войдите в аккаунт.
2. **New Project** → выберите **Deploy from GitHub repo** (если репозиторий уже подключён) или **Empty Project** (деплой через CLI позже).

---

## Шаг 2. Добавить PostgreSQL

1. Откройте проект → **+ New** → **Database** → **PostgreSQL**.
2. Railway создаст базу и переменную `DATABASE_URL`.

---

## Шаг 3. Добавить сервис (бэкенд)

- Если **Deploy from GitHub**:
  - Выберите репозиторий с проектом GYM APP.
  - **Root Directory** укажите: `backend`.
  - Railway сам определит Node.js и начнёт сборку.
- Если **Empty Project**:
  - Нажмите **Add Service** → **GitHub Repo** и выберите репозиторий, Root Directory: `backend`.

**Связать с PostgreSQL:** в сервисе gym → **Variables** → **Add Reference** → выберите `DATABASE_URL` из PostgreSQL.

---

## Шаг 4. Остальные переменные окружения

В том же разделе **Variables** добавьте (подставьте свои значения):

| Переменная | Значение | Обязательно |
|------------|----------|-------------|
| `NODE_ENV` | `production` | да |
| `TELEGRAM_BOT_TOKEN` | Токен от @BotFather | да |
| `WEBAPP_URL` | URL Mini App (например `https://gym-app.vercel.app`) | да |
| `FRONTEND_URL` | Тот же URL Mini App (например `https://gym-app.vercel.app`) | да |
| `JWT_SECRET` | Длинная случайная строка для админки | да |
| `ADMIN_CHAT_ID` | (по желанию) ID чата для уведомлений | нет |

`PORT` Railway подставит сам, указывать не нужно.

---

## Шаг 5. Сборка и запуск

1. **Build Command** можно оставить пустым: по умолчанию Railway выполнит `npm install` и `npm run build`. В проекте скрипт `build` уже включает `prisma generate`.

2. **Start Command** (в **Settings** → **Deploy**): можно не указывать — в проекте уже задано в `nixpacks.toml`:
   ```bash
   npx prisma migrate deploy && node dist/main.js
   ```
   При каждом запуске применяются миграции, затем стартует API.

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

- [ ] PostgreSQL добавлен, `DATABASE_URL` подключён к сервису gym.
- [ ] Проект создан, сервис из папки `backend` добавлен.
- [ ] Заданы `TELEGRAM_BOT_TOKEN`, `WEBAPP_URL`, `FRONTEND_URL`, `JWT_SECRET`.
- [ ] Start Command (или nixpacks): `npx prisma migrate deploy && node dist/main.js`.
- [ ] Сгенерирован домен, URL скопирован в Vercel (Frontend + Admin) и в BotFather (Menu Button).

**Деплой без домена:** [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md).

В `backend/package.json` скрипт `build` уже вызывает `prisma generate`, поэтому отдельно настраивать Build Command не нужно.
