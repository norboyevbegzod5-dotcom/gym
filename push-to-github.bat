@echo off
chcp 65001 >nul
cd /d "%~dp0"

where git >nul 2>&1
if errorlevel 1 (
    echo Git не найден. Установите: https://git-scm.com/download/win
    pause
    exit /b 1
)

if not exist ".git" (
    echo Инициализация репозитория...
    git init
)

echo Добавление файлов...
git add .

echo Коммит...
git commit -m "Initial commit: Gym Mini App backend, frontend, admin" 2>nul

echo Ветка main...
git branch -M main 2>nul

if not exist ".git\refs\remotes\origin" (
    echo Добавление удалённого репозитория...
    git remote add origin https://github.com/norboyevbegzod5-dotcom/gym.git
)

echo Пуш на GitHub...
git push -u origin main

if errorlevel 1 (
    echo.
    echo Пуш не удался. Возможно, нужна авторизация в GitHub.
    echo Выполните вручную: git push -u origin main
) else (
    echo Готово. Репозиторий: https://github.com/norboyevbegzod5-dotcom/gym
)

pause
