# Деплой без локального запуска

Сразу в прод: пушим код в GitHub → Railway и Vercel собирают и деплоят сами. Локально ничего запускать не нужно.

---

## Что нужно один раз

1. **GitHub** — репозиторий с проектом GYM APP (backend, frontend, admin в одной папке).
2. **Railway** — аккаунт на [railway.app](https://railway.app).
3. **Vercel** — аккаунт на [vercel.com](https://vercel.com) (через GitHub).

---

## Шаг 1. Railway: бэкенд + PostgreSQL

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → выберите репозиторий.
2. **+ New** → **Database** → **PostgreSQL**. Railway создаст БД и переменную `DATABASE_URL`.
3. **+ New** → **GitHub Repo** → тот же репозиторий.
   - **Root Directory:** `backend`.
   - Railway подхватит `nixpacks.toml`: сборка `prisma generate` + `npm run build`, старт: `prisma migrate deploy && node dist/main.js`.
4. В сервисе бэкенда → **Variables**:
   - **Add Reference** → выберите `DATABASE_URL` из PostgreSQL.
   - Добавьте вручную:

| Переменная       | Значение |
|------------------|----------|
| `NODE_ENV`       | `production` |
| `TELEGRAM_BOT_TOKEN` | токен от @BotFather |
| `WEBAPP_URL`     | URL Mini App (см. шаг 3; пока можно заглушка) |
| `FRONTEND_URL`   | тот же URL Mini App |
| `JWT_SECRET`     | длинная случайная строка (для админки и приложения) |

5. **Settings** → **Networking** → **Generate Domain**. Скопируйте URL, например:  
   `https://gym-backend-production-xxx.up.railway.app`  
   **API:** `https://ваш-домен.up.railway.app/api`

---

## Шаг 2. Vercel: Mini App (frontend)

1. [vercel.com](https://vercel.com) → **Add New** → **Project** → **Import** ваш репозиторий.
2. Настройки:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. **Environment Variables:**
   - `VITE_API_URL` = `https://ваш-railway-домен.up.railway.app/api` (из шага 1).
4. **Deploy**. Скопируйте URL Mini App, например: `https://gym-app-xxx.vercel.app`.

---

## Шаг 3. Vercel: админка (admin)

1. **Add New** → **Project** → снова **Import** тот же репозиторий.
2. Настройки:
   - **Root Directory:** `admin`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. **Environment Variables:**
   - `VITE_API_URL` = `https://ваш-railway-домен.up.railway.app/api`
4. **Deploy**. URL админки сохраните (например для входа: `admin@centrisfit.com` / `admin123`).

---

## Шаг 4. Дописать URL в Railway

В Railway → сервис бэкенда → **Variables**:

- `FRONTEND_URL` = URL Mini App из шага 2 (например `https://gym-app-xxx.vercel.app`)
- `WEBAPP_URL` = тот же URL Mini App

Сохраните. Railway перезапустит сервис.

---

## Шаг 5. Telegram: кнопка меню

1. [@BotFather](https://t.me/BotFather) → ваш бот → **Bot Settings** → **Menu Button** → **Configure menu button**.
2. Укажите URL Mini App из шага 2.

---

## Где авторизация

- **Mini App (frontend):** при первом открытии показывается **страница входа по номеру телефона** (без OTP). Ввести номер → «Войти» → доступ к услугам, записям, профилю. В профиле — кнопка «Выйти».
- **Админка (admin):** откройте URL админки → **страница входа** (email + пароль). Логин: `admin@centrisfit.com` / `admin123`.

После деплоя проверьте: Mini App — сразу экран «Вход» с полем телефона; админка — экран входа с email/паролем.

---

## Дальше: только пуш в GitHub

- Пушите изменения в репозиторий.
- Railway пересоберёт и задеплоит бэкенд.
- Vercel пересоберёт и задеплоит frontend и admin (если у проектов включен auto-deploy).

Локально ничего запускать не нужно.

---

## Краткий чеклист

- [ ] Railway: PostgreSQL + сервис из папки `backend`, Root Directory: `backend`
- [ ] Railway: переменные `DATABASE_URL`, `NODE_ENV`, `TELEGRAM_BOT_TOKEN`, `WEBAPP_URL`, `FRONTEND_URL`, `JWT_SECRET`
- [ ] Railway: сгенерирован домен, URL скопирован
- [ ] Vercel: проект из папки `frontend`, `VITE_API_URL` = Railway API
- [ ] Vercel: проект из папки `admin`, `VITE_API_URL` = Railway API
- [ ] Railway: `FRONTEND_URL` и `WEBAPP_URL` = URL Mini App с Vercel
- [ ] BotFather: Menu Button = URL Mini App

Подробнее: [RAILWAY.md](./RAILWAY.md), [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md).
