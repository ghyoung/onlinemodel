@echo off
echo 启动湖仓建模工具...
echo.

echo 检查目录...
if not exist "backend" (
    echo 错误：backend目录不存在
    pause
    exit /b 1
)

if not exist "frontend" (
    echo 错误：frontend目录不存在
    pause
    exit /b 1
)

echo 目录检查通过
echo.

echo 启动后端服务...
cd backend
start "Backend" cmd /k "npm run dev"
cd ..

echo 等待后端启动...
ping -n 9 127.0.0.1 >nul

echo 启动前端服务...
cd frontend
start "Frontend" cmd /k "npm run dev"
cd ..

echo.
echo 启动完成！
echo 请查看新打开的命令行窗口
echo.
echo 服务地址:
echo - 后端: http://localhost:3000
echo - 前端: http://localhost:5173
echo.
pause
