# Пуш проекта на GitHub

Репозиторий: **https://github.com/norboyevbegzod5-dotcom/gym.git** (сейчас пустой).

После пуша можно подключить его к Railway: **New Project → Deploy from GitHub repo** → выбрать `norboyevbegzod5-dotcom/gym`, Root Directory: `backend`.

---

## Быстрый способ: скрипт

1. Установите Git: [git-scm.com/download/win](https://git-scm.com/download/win) (если ещё нет).
2. Дважды кликните по **`push-to-github.bat`** в папке GYM APP (или в терминале: `.\push-to-github.bat`).
3. При первом пуше GitHub может запросить логин и пароль (или Personal Access Token).

Тот же порядок действий выполняет **`push-to-github.ps1`** (PowerShell).

---

## Вручную

### Шаг 1. Установить Git (если ещё нет)

Скачайте и установите: [git-scm.com](https://git-scm.com/download/win).  
После установки перезапустите терминал (или Cursor).

---

## Шаг 2. В корне проекта (папка GYM APP)

Откройте терминал в корне проекта и выполните по порядку.

**Инициализация и первый коммит:**

```bash
git init
git add .
git commit -m "Initial commit: Gym Mini App backend, frontend, admin"
```

**Подключение вашего репозитория и пуш:**

```bash
git remote add origin https://github.com/norboyevbegzod5-dotcom/gym.git
git branch -M main
git push -u origin main
```

При первом `git push` может потребоваться авторизация в GitHub (логин/пароль или токен, либо вход через браузер).

---

## Что не попадёт в репозиторий (уже в .gitignore)

- `node_modules/`
- `dist/`, `build/`
- `.env`, `.env.local` (секреты остаются только у вас)
- `*.db` (базы SQLite)
- `.cursor/`

Файлы-примеры (`.env.example`, `.env.production.example`) в репозиторий попадут — в них нет секретов.

---

## Дальше

После успешного пуша в Railway: **New Project** → **Deploy from GitHub repo** → репозиторий **gym**, Root Directory: **backend**. Дальше по [RAILWAY.md](./RAILWAY.md).
