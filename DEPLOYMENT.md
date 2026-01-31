# Релиз проекта: полный доступ для всех

Код остаётся в Cursor для редактирования. На релиз выносится только работающее приложение (бэкенд + Mini App + админка) на публичный хостинг с HTTPS.

---

## 1. Что нужно иметь

| Что | Зачем |
|-----|--------|
| **Домен** (например `centrisfit.uz`) | HTTPS и постоянный адрес для Mini App и API |
| **Сервер с Node.js** (VPS: Timeweb, Reg.ru, DigitalOcean, или PaaS: Railway, Render) | Запуск бэкенда и раздача статики |
| **Telegram Bot Token** | Уже есть в `.env` |
| **SSL** | Обязателен для Telegram Mini App (Let's Encrypt бесплатно) |

---

## 2. Архитектура релиза

```
[Пользователи Telegram]
        ↓
   Telegram Bot (кнопка «Открыть приложение»)
        ↓
   Mini App (HTTPS: https://your-domain.com/app)  ← фронтенд
        ↓
   API (HTTPS: https://your-domain.com/api)       ← бэкенд
        ↓
   База данных (SQLite или PostgreSQL на сервере)
```

**Админка:** `https://your-domain.com/admin` — доступ только по логину/паролю.

---

## 3. Подготовка к релизу (один раз)

### 3.1 Переменные окружения

**Backend** (на сервере в `.env`):

```env
NODE_ENV=production
PORT=3002

# База: на VPS можно оставить SQLite или перейти на PostgreSQL
DATABASE_URL="file:./prod.db"
# Или: DATABASE_URL="postgresql://user:password@localhost:5432/gym_app?schema=public"

# Бот (из BotFather)
TELEGRAM_BOT_TOKEN="ваш_токен"

# Публичные URL после деплоя
FRONTEND_URL="https://your-domain.com"
WEBAPP_URL="https://your-domain.com/app"
JWT_SECRET="длинный_случайный_секрет_для_JWT"
```

**Frontend (Mini App)** — при сборке задаёте URL API:

```env
# .env.production в папке frontend
VITE_API_URL=https://your-domain.com/api
```

**Admin** — при сборке:

```env
# .env.production в папке admin
VITE_API_URL=https://your-domain.com/api
```

### 3.2 Telegram: привязка Mini App к боту

1. Открыть [@BotFather](https://t.me/BotFather).
2. Выбрать бота → **Bot Settings** → **Menu Button** → **Configure menu button**.
3. Указать URL: `https://your-domain.com/app` (или путь, где у вас открывается Mini App).
4. Либо в коде кнопки в боте уже используется `WEBAPP_URL` из `.env` — тогда достаточно задать `WEBAPP_URL` на сервере.

---

## 4. Деплой на VPS (Ubuntu / Debian)

### 4.1 Сервер

- Установить Node.js 20+, nginx, certbot (SSL).
- Домен направить A-записью на IP сервера.
- Выдать SSL: `certbot --nginx -d your-domain.com`.

### 4.2 Сборка на своей машине (в Cursor)

В корне проекта:

```bash
# Backend
cd backend
npm ci
npx prisma generate
npm run build
# Папку backend/dist и backend/prisma (schema + prod.db при SQLite) копируете на сервер

# Mini App (если открывается по https://your-domain.com/app)
cd ../frontend
# В .env.production задать VITE_API_URL и при пути /app — VITE_BASE_PATH=/app/
npm ci
npm run build
# Содержимое frontend/dist копируете на сервер в /var/www/app

# Админка
cd ../admin
cp .env.production .env
npm ci
npm run build
# Папку admin/dist копируете на сервер (например в /var/www/admin)
```

### 4.3 На сервере

- Создать папки, например: `/var/www/app`, `/var/www/admin`, `/var/www/backend`.
- Загрузить:
  - `backend/dist` + `backend/prisma` + `backend/package.json` + `backend/package-lock.json` в `/var/www/backend`.
  - `frontend/dist` в `/var/www/app`.
  - `admin/dist` в `/var/www/admin`.
- В `/var/www/backend` создать `.env` с переменными из п. 3.1.
- Запуск бэкенда (PM2):

```bash
cd /var/www/backend
npm install --production
npx prisma db push   # при первой установке или миграции
npx prisma db seed   # при необходимости сидировать данные
node dist/main.js
# Или: pm2 start dist/main.js --name gym-api
```

- Nginx: проксировать `/api` на `http://127.0.0.1:3002`, раздавать статику для `/app` из `/var/www/app`, для `/admin` из `/var/www/admin`.

Пример конфига Nginx (заменить `your-domain.com`):

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    root /var/www/app;
    index index.html;
    location /app {
        try_files $uri $uri/ /app/index.html;
    }
    location /admin {
        alias /var/www/admin;
        try_files $uri $uri/ /admin/index.html;
    }
    location /api {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

После этого:
- Mini App доступен по `https://your-domain.com/app`.
- Админка — по `https://your-domain.com/admin`.
- API — по `https://your-domain.com/api`.

В Cursor вы по-прежнему правите код локально, при следующих релизах заново собираете и заливаете только изменённые части (backend/dist, frontend/dist, admin/dist).

---

## 5. Альтернатива: PaaS (Railway, Render и т.п.)

- **Backend:** создать сервис из репозитория/папки `backend`, указать команду `npm run start:prod` (или `node dist/main`), задать переменные окружения, при необходимости примонтировать том для SQLite или подключить PostgreSQL.
- **Frontend/Admin:** один сервис со статикой (build из `frontend` и `admin`) или два отдельных; в build задать `VITE_API_URL` равным URL бэкенда (например `https://gym-api.railway.app/api`).
- В BotFather / в коде бота указать `WEBAPP_URL` = URL, где открывается Mini App (HTTPS).

Код при этом можно продолжать хранить и редактировать только в Cursor; в Git при необходимости пушить только то, что нужно для сборки на PaaS (без секретов и без `.cursor`).

---

## 6. Чек-лист перед релизом

- [ ] В backend `.env` на сервере: `TELEGRAM_BOT_TOKEN`, `WEBAPP_URL`, `FRONTEND_URL`, `DATABASE_URL`, `JWT_SECRET`.
- [ ] Mini App открывается по HTTPS; в `frontend` при сборке задан `VITE_API_URL` на продакшен API.
- [ ] Админка при сборке с `VITE_API_URL` на продакшен API.
- [ ] В BotFather / меню бота указан URL Mini App (HTTPS).
- [ ] База на сервере создана (`prisma db push`), при необходимости выполнен `prisma db seed`.
- [ ] Админ-логин: `admin@centrisfit.com` / `admin123` (после первого входа пароль лучше сменить).

---

## 7. Код в Cursor

- Редактирование остаётся в Cursor: все исходники (backend, frontend, admin) у вас локально.
- В репозитории (если используете Git) в `.gitignore` добавлена папка `.cursor`, чтобы на релиз и в общий репозиторий не попадали только локальные настройки Cursor.
- На релиз вы выкладываете не исходники, а собранные артефакты (dist + статика) и переменные окружения на сервере/PaaS.

После выполнения этих шагов проект будет полностью доступен для всех (Mini App в Telegram, админка по ссылке), а код редактирования остаётся у вас в Cursor.
