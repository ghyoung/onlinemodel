@echo off
echo 🚀 启动湖仓建模工具开发环境...
echo.

echo 📍 当前目录: %CD%
echo.

echo 🔧 启动后端服务 (端口 3000)...
start "Backend Server" cmd /k "cd code/backend && npm run dev"

echo ⏳ 等待后端启动...
timeout /t 5 /nobreak > nul

echo 🌐 启动前端服务 (端口 3002)...
start "Frontend Server" cmd /k "cd code/frontend && npm run dev"

echo.
echo ✅ 开发环境启动完成！
echo.
echo 📱 前端地址: http://localhost:3002
echo 🔌 后端地址: http://localhost:3000
echo.
echo 💡 提示: 前端会自动代理 /api 请求到后端
echo.
pause
