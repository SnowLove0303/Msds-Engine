@echo off
chcp 65001 >nul
echo 正在构建并启动 Msds-Engine 容器...
cd /d "F:\docker\projects\Msds-Engine"
docker compose up -d --build
echo.
echo 容器状态：
docker compose ps
echo.
echo 服务已就绪！请访问：http://127.0.0.1:5173
pause
