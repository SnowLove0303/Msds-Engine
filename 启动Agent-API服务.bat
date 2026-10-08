@echo off
chcp 65001 >nul
title MSDS-Engine Agent REST API 服务
cd /d "%~dp0web"
echo ===================================================
echo   MSDS-Engine Agent REST API 服务正在启动...
echo   服务基地址: http://127.0.0.1:5174/api/msds
echo   健康检查:   http://127.0.0.1:5174/api/msds/health
echo ===================================================
npm run api
pause
