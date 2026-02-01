# Запуш в GitHub — выполните в терминале из корня проекта:
# .\push-now.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

git add -A
git status
git commit -m "feat: membership purchase, calendar, deploy docs"
git push
