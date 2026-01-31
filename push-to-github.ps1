# Пуш проекта на GitHub (https://github.com/norboyevbegzod5-dotcom/gym.git)
# Запуск: правый клик по файлу → "Выполнить с помощью PowerShell"
# или в терминале в папке GYM APP: .\push-to-github.ps1

$ErrorActionPreference = "Stop"
$repoRoot = $PSScriptRoot

Set-Location $repoRoot

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Git не найден. Установите: https://git-scm.com/download/win" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path ".git")) {
    Write-Host "Инициализация репозитория..." -ForegroundColor Cyan
    git init
}

Write-Host "Добавление файлов..." -ForegroundColor Cyan
git add .

Write-Host "Коммит..." -ForegroundColor Cyan
git commit -m "Initial commit: Gym Mini App backend, frontend, admin" 2>$null
if ($LASTEXITCODE -ne 0) {
    # Возможно, нечего коммитить или уже закоммичено
    $status = git status --short
    if ([string]::IsNullOrWhiteSpace($status)) {
        Write-Host "Все изменения уже закоммичены." -ForegroundColor Yellow
    } else {
        Write-Host "Ошибка коммита. Проверьте: git status" -ForegroundColor Red
        exit 1
    }
}

$remote = git remote get-url origin 2>$null
if (-not $remote) {
    Write-Host "Добавление удалённого репозитория..." -ForegroundColor Cyan
    git remote add origin https://github.com/norboyevbegzod5-dotcom/gym.git
}

git branch -M main 2>$null

Write-Host "Пуш на GitHub..." -ForegroundColor Cyan
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "Готово. Репозиторий: https://github.com/norboyevbegzod5-dotcom/gym" -ForegroundColor Green
} else {
    Write-Host "Пуш не удался. Возможно, нужна авторизация в GitHub (логин/токен)." -ForegroundColor Yellow
    Write-Host "Выполните вручную: git push -u origin main" -ForegroundColor Yellow
}
