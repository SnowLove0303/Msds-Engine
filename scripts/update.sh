#!/usr/bin/env bash
# ==========================================
# MSDS Engine 极速热更新脚本 (Linux / macOS / Docker Host)
# ==========================================
set -e

echo "=========================================="
echo "🚀 MSDS Engine 极速热更新程序"
echo "=========================================="

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "📥 1. 正在拉取远程最新代码 (git pull)..."
git pull origin main

# 检查 Docker 是否在运行且活跃
if [ -f "docker-compose.yml" ] && command -v docker &> /dev/null && docker compose ps &> /dev/null; then
  echo "🐳 2. 检测到 Docker 运行环境，正在执行容器极速热更新..."
  docker compose build
  docker compose up -d
  echo "✅ Docker 容器更新完成并已在后台运行！"
  echo "🌐 访问地址: http://127.0.0.1:5173"
else
  echo "📦 2. 本地 Node.js 环境更新中..."
  if [ -d "web" ]; then
    cd web
    npm install
    npm run build
    echo "✅ 本地 Web 编译构建完成！"
    cd ..
  fi
fi

echo "=========================================="
echo "🎉 系统更新完成！请在浏览器刷新页面即可体验新版。"
echo "=========================================="
