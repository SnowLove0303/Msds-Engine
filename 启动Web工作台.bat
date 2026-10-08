@echo off
chcp 65001 >nul
title MSDS-Engine Web 工作台
cd /d "%~dp0web"
echo ===================================================
echo   MSDS-Engine Web 交互工作台正在启动...
echo   访问地址: http://127.0.0.1:5173
echo ===================================================
npm run dev -- --host 127.0.0.1
pause
