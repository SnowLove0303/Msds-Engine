# ==========================================
# MSDS Engine 极速热更新脚本 (Windows PowerShell)
# ==========================================
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🚀 MSDS Engine 极速热更新程序 (Windows)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$rootDir = Split-Path -Parent $PSScriptRoot
Set-Location $rootDir

Write-Host "📥 1. 正在拉取远程最新代码 (git pull)..." -ForegroundColor Yellow
git pull origin main

# 检查 Docker 是否在运行且活跃
$dockerActive = $false
try {
    $dockerPs = docker compose ps 2>$null
    if ($LASTEXITCODE -eq 0) {
        $dockerActive = $true
    }
} catch {}

if ($dockerActive) {
    Write-Host "🐳 2. 检测到活跃的 Docker Compose 环境，正在重新构建并重启容器..." -ForegroundColor Green
    docker compose build
    docker compose up -d
    Write-Host "✅ Docker 容器已更新并重启成功！访问端口: 5173" -ForegroundColor Green
} else {
    Write-Host "📦 2. 正在更新本地依赖与前端产物..." -ForegroundColor Yellow
    if (Test-Path "web") {
        Set-Location "web"
        npm install
        npm run build
        Set-Location $rootDir
        Write-Host "✅ 本地产物编译构建成功！" -ForegroundColor Green
    }
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🎉 系统更新完成！请在浏览器刷新页面即可体验新版。" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
