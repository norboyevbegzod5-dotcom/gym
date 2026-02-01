# Локальная сборка перед деплоем (backend + frontend + admin)
# Запуск из корня проекта: .\deploy-build.ps1

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

Write-Host "=== Backend ===" -ForegroundColor Cyan
Set-Location "$root\backend"
npm ci
npx prisma generate
npm run build
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "`n=== Frontend (Mini App) ===" -ForegroundColor Cyan
Set-Location "$root\frontend"
npm ci
npm run build
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "`n=== Admin ===" -ForegroundColor Cyan
Set-Location "$root\admin"
npm ci
npm run build
if ($LASTEXITCODE -ne 0) { exit 1 }

Set-Location $root
Write-Host "`n=== Сборка завершена ===" -ForegroundColor Green
Write-Host "backend/dist, frontend/dist, admin/dist готовы к загрузке или пуш в Git для Railway/Vercel."
