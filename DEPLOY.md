# Деплой за 5 минут (Railway + Vercel)

Без своего домена: API на Railway, Mini App и админка на Vercel.

---

## Деплой без локальной проверки

Если Railway и Vercel уже подключены к вашему GitHub-репозиторию:

1. **Запушьте изменения в GitHub** (ветка, с которой деплоятся проекты, обычно `main`).
2. **Railway** сам пересоберёт backend и задеплоит.
3. **Vercel** сам пересоберёт frontend и admin и задеплоит.

Локально ничего собирать не нужно — сборка идёт в облаке после пуша.

---

## 1. Backend (Railway)

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** (или **Empty Project**).
2. **+ New** → **Database** → **PostgreSQL**. Railway создаст `DATABASE_URL`.
3. **Add Service** → выберите репозиторий, **Root Directory:** `backend`.
4. В сервисе → **Variables** → **Add Reference** → выберите `DATABASE_URL` из PostgreSQL.
5. Добавьте переменные:

| Переменная | Значение |
|------------|----------|
| `NODE_ENV` | `production` |
| `TELEGRAM_BOT_TOKEN` | токен от @BotFather |
| `WEBAPP_URL` | `https://ВАШ-MINI-APP.vercel.app` (подставите после шага 2) |
| `FRONTEND_URL` | тот же URL Mini App |
| `JWT_SECRET` | длинная случайная строка |

6. **Settings** → **Networking** → **Generate Domain**. Скопируйте URL, например:  
   `https://gym-backend-xxx.up.railway.app`  
   **API:** `https://xxx.up.railway.app/api`

---

## 2. Mini App (Vercel)

1. [vercel.com](https://vercel.com) → **Add New** → **Project** → импорт репозитория.
2. **Root Directory:** `frontend`.
3. **Environment Variables:**  
   `VITE_API_URL` = `https://ВАШ-RAILWAY-ДОМЕН.up.railway.app/api`
4. **Deploy**. Скопируйте URL Mini App (например `https://gym-app-xxx.vercel.app`).

---

## 3. Админка (Vercel)

1. **Add New** → **Project** → тот же репозиторий.
2. **Root Directory:** `admin`.
3. **Environment Variables:**  
   `VITE_API_URL` = `https://ВАШ-RAILWAY-ДОМЕН.up.railway.app/api`
4. **Deploy**.

---

## 4. Довести настройки до конца

- В **Railway** в переменных сервиса backend обновите:  
  `WEBAPP_URL` и `FRONTEND_URL` = URL Mini App из шага 2.
- В [@BotFather](https://t.me/BotFather): бот → **Bot Settings** → **Menu Button** → **Configure menu button** → URL Mini App.

---

## 5. Проверка

- Mini App: открыть URL из Vercel или кнопку в боте.
- Админка: URL админки, логин `admin@centrisfit.com` / `admin123`.

---

## Локальная сборка (по желанию)

Если нужно проверить сборку у себя перед пушем: из корня проекта выполните `.\deploy-build.ps1` или соберите вручную `backend`, `frontend`, `admin`. Для деплоя без локальной проверки достаточно пуша в Git.
