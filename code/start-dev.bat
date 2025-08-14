@echo off
echo ========================================
echo 湖仓建模工具 - 开发环境启动脚本
echo ========================================
echo.

echo 正在检查端口配置...
echo 前端端口: 3002
echo 后端端口: 3000
echo.

echo 启动后端服务...
cd backend
start "Backend Server" cmd /k "npm run dev"
cd ..

echo 等待后端服务启动...
timeout /t 3 /nobreak >nul

echo 启动前端服务...
cd frontend
start "Frontend Server" cmd /k "npm run dev"
cd ..

echo.
echo ========================================
echo 服务启动完成！
echo ========================================
echo 前端地址: http://localhost:3002
echo 后端地址: http://localhost:3000
echo API地址:  http://localhost:3000/api
echo ========================================
echo.
pause
