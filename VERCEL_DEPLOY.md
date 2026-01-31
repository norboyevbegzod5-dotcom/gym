# Деплой на Vercel (без покупки домена)

Mini App и админка на бесплатных URL Vercel. API — на Railway.

---

## Что получится

| Часть | URL (пример) |
|-------|--------------|
| **API** | `https://gym-production-xxx.up.railway.app` |
| **Mini App** | `https://gym-app.vercel.app` |
| **Админка** | `https://gym-admin.vercel.app` |

---

## Шаг 1. Убедитесь, что API на Railway работает

1. Откройте Railway → сервис **gym**.
2. **Settings** → **Networking** → **Generate Domain** (если ещё нет).
3. Скопируйте URL, например: `https://gym-production-abc123.up.railway.app`
4. API доступен по: `https://ваш-домен.up.railway.app/api`

---

## Шаг 2. Деплой Mini App (frontend)

1. Зайдите на [vercel.com](https://vercel.com) и войдите (через GitHub).
2. **Add New** → **Project**.
3. **Import** репозиторий `norboyevbegzod5-dotcom/gym`.
4. Настройки:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build` (по умолчанию)
   - **Output Directory:** `dist` (по умолчанию)
5. **Environment Variables** — добавьте:
   - `VITE_API_URL` = `https://ваш-домен.up.railway.app/api`  
     (подставьте свой Railway URL)
6. **Deploy**.

После деплоя появится URL, например `https://gym-xxx.vercel.app`. Скопируйте его.

---

## Шаг 3. Деплой админки (admin)

1. **Add New** → **Project**.
2. Снова **Import** репозиторий `norboyevbegzod5-dotcom/gym`.
3. Настройки:
   - **Root Directory:** `admin`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. **Environment Variables**:
   - `VITE_API_URL` = `https://ваш-домен.up.railway.app/api`
5. **Deploy**.

Скопируйте URL админки, например `https://gym-admin-xxx.vercel.app`.

---

## Шаг 4. Обновите переменные в Railway

В Railway → сервис **gym** → **Variables**:

| Переменная | Значение |
|------------|----------|
| `FRONTEND_URL` | URL Mini App (например `https://gym-app-xxx.vercel.app`) |
| `WEBAPP_URL` | Тот же URL Mini App (для кнопки в боте) |

Сохраните. Railway перезапустит сервис.

---

## Шаг 5. Привязка Mini App к боту в Telegram

1. Откройте [@BotFather](https://t.me/BotFather).
2. Выберите бота → **Bot Settings** → **Menu Button** → **Configure menu button**.
3. Укажите URL Mini App: `https://ваш-mini-app.vercel.app`  
   (тот же URL, что в `FRONTEND_URL`).

---

## Шаг 6. Проверка

- **Mini App:** откройте URL в браузере или нажмите кнопку в боте.
- **Админка:** откройте URL админки, войдите: `admin@centrisfit.com` / `admin123`.

---

## Краткий чеклист

- [ ] Railway: API работает, домен сгенерирован
- [ ] Vercel: Mini App задеплоен, `VITE_API_URL` = Railway API
- [ ] Vercel: Админка задеплоена, `VITE_API_URL` = Railway API
- [ ] Railway: `FRONTEND_URL` и `WEBAPP_URL` = URL Mini App
- [ ] BotFather: Menu Button = URL Mini App
