@echo off
chcp 65001 >nul
echo 🚀 启动湖仓建模工具开发环境...

REM 检查Node.js版本
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js未安装，请先安装Node.js 18+
    pause
    exit /b 1
)

echo ✅ Node.js版本检查通过

REM 检查npm版本
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm未安装，请先安装npm
    pause
    exit /b 1
)

echo ✅ npm版本检查通过

REM 启动后端服务
echo 🔧 启动后端服务...
cd backend

REM 安装后端依赖
if not exist "node_modules" (
    echo 📦 安装后端依赖...
    npm install
)

REM 启动后端服务
echo 🚀 启动Node.js后端服务...
start "Node.js Backend" cmd /k "npm run dev"

REM 等待后端启动
echo ⏳ 等待后端服务启动...
timeout /t 5 /nobreak >nul

REM 启动前端服务
echo 🎨 启动前端服务...
cd ..\frontend

REM 安装前端依赖
if not exist "node_modules" (
    echo 📦 安装前端依赖...
    npm install
)

REM 启动前端服务
echo 🚀 启动React前端服务...
start "React Frontend" cmd /k "npm run dev"

echo.
echo 🎉 湖仓建模工具开发环境启动完成！
echo.
echo 📍 服务地址:
echo    - 后端API: http://localhost:3000
echo    - 前端页面: http://localhost:5173
echo    - 健康检查: http://localhost:3000/health
echo.
echo 🔑 默认登录账号:
echo    - 用户名: admin
echo    - 密码: admin123
echo.
echo 📝 开发说明:
echo    - 后端热重载: 修改代码后自动重启
echo    - 前端热重载: 修改代码后自动刷新
echo    - 数据库: SQLite文件数据库，自动创建
echo.
echo 🛑 停止服务: 关闭对应的命令行窗口
pause
