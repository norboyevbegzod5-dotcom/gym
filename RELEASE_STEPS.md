# Релиз пошагово

Пошаговая инструкция для вывода проекта в прод (Mini App + админка + API).

---

## Шаг 0. Что нужно до начала

- [ ] **Домен** (например `centrisfit.uz`) — A-запись указывает на IP сервера
- [ ] **Сервер** с Ubuntu/Debian, Node.js 20+, nginx, certbot (или PaaS: Railway/Render)
- [ ] **SSL** (Let's Encrypt: `certbot --nginx -d your-domain.com`)
- [ ] **Telegram Bot Token** — уже есть в `backend/.env`

---

## Шаг 1. Переменные окружения на сервере (backend)

На сервере в папке бэкенда создайте файл `.env`:

```env
NODE_ENV=production
PORT=3002

# База (SQLite для простоты или PostgreSQL)
DATABASE_URL="file:./prod.db"

# Бот
TELEGRAM_BOT_TOKEN="ваш_токен_из_BotFather"

# Публичные URL (подставьте ваш домен)
FRONTEND_URL="https://your-domain.com"
WEBAPP_URL="https://your-domain.com/app"

# Обязательно смените на случайную строку
JWT_SECRET="длинная_случайная_строка_для_JWT"
```

Замените `your-domain.com` на ваш домен и задайте свой `JWT_SECRET`.

---

## Шаг 2. Сборка бэкенда (локально)

В корне проекта:

```bash
cd backend
npm ci
npx prisma generate
npm run build
```

Проверьте: появилась папка `backend/dist` и в ней `main.js`.

---

## Шаг 3. Сборка Mini App (frontend)

1. В папке `frontend` создайте `.env.production` (или скопируйте из `.env.production.example`):

```env
VITE_API_URL=https://your-domain.com/api
# Если Mini App открывается по https://your-domain.com/app:
VITE_BASE_PATH=/app/
```

2. Соберите:

```bash
cd frontend
npm ci
npm run build
```

Проверьте: появилась папка `frontend/dist` с `index.html` и ресурсами.

---

## Шаг 4. Сборка админки (admin)

1. В папке `admin` создайте `.env.production`:

```env
VITE_API_URL=https://your-domain.com/api
```

2. Соберите:

```bash
cd admin
npm ci
npm run build
```

Проверьте: появилась папка `admin/dist`.

---

## Шаг 5. Загрузка на сервер

Создайте на сервере папки и загрузите артефакты:

| Локально | На сервер |
|----------|-----------|
| `backend/dist` | `/var/www/backend/dist` |
| `backend/prisma` (schema.prisma + при SQLite пустая prod.db или не копировать) | `/var/www/backend/prisma` |
| `backend/package.json` | `/var/www/backend/` |
| `backend/package-lock.json` | `/var/www/backend/` |
| `frontend/dist/*` | `/var/www/app/` |
| `admin/dist/*` | `/var/www/admin/` |

Файл `.env` для бэкенда создаёте уже на сервере в `/var/www/backend/.env` (Шаг 1).

---

## Шаг 6. Запуск бэкенда на сервере

На сервере:

```bash
cd /var/www/backend
npm install --production
npx prisma generate
npx prisma db push
npx prisma db seed
node dist/main.js
```

Для постоянной работы используйте PM2:

```bash
pm2 start dist/main.js --name gym-api
pm2 save
pm2 startup
```

---

## Шаг 7. Настройка Nginx

Пример конфига (подставьте ваш домен и пути к SSL):

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location /app {
        alias /var/www/app;
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

Включите конфиг и перезагрузите nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Шаг 8. Привязка Mini App к боту в Telegram

1. Откройте [@BotFather](https://t.me/BotFather).
2. Выберите вашего бота → **Bot Settings** → **Menu Button** → **Configure menu button**.
3. Укажите URL: `https://your-domain.com/app`.

После этого кнопка «Открыть приложение» в боте будет вести на Mini App.

---

## Шаг 9. Проверка

- [ ] **API:** открыть в браузере `https://your-domain.com/api` — должен ответить (например, 404 от Nest — это нормально для корня).
- [ ] **Mini App:** открыть `https://your-domain.com/app` — загружается интерфейс приложения.
- [ ] **Админка:** открыть `https://your-domain.com/admin` — страница входа. Логин: `admin@centrisfit.com`, пароль: `admin123` (после первого входа лучше сменить).
- [ ] **Бот:** в Telegram нажать кнопку меню — открывается Mini App.

---

## Шаг 10. После релиза

- Смените пароль админа в админке (если есть смена пароля) или в базе.
- Делайте бэкапы `backend/prisma/prod.db` (при SQLite).
- При следующих обновлениях: заново собирайте только изменённые части (backend/frontend/admin), загружайте на сервер и перезапускайте бэкенд (`pm2 restart gym-api`).

Подробности и альтернативы (PaaS, PostgreSQL) — в [DEPLOYMENT.md](./DEPLOYMENT.md).
