@echo off
echo 🚀 湖仓建模工具开发环境启动脚本
echo.

REM 检查命令行参数
if "%1"=="check" (
    echo 🔍 执行配置检查...
    cd code
    node init-scripts/check-config-simple.js
    cd ..
    pause
    exit /b 0
)

if "%1"=="check-full" (
    echo 🔍 执行完整配置检查...
    cd code
    node init-scripts/check-config.js
    cd ..
    pause
    exit /b 0
)

if "%1"=="fix-db" (
    echo 🔧 执行数据库修复...
    cd code
    node init-scripts/fix-database.js
    cd ..
    pause
    exit /b 0
)

if "%1"=="test-api" (
    echo 🧪 测试API接口...
    cd code/backend
    node test-api.js
    cd ../..
    pause
    exit /b 0
)

if "%1"=="test-db" (
    echo 🗄️ 测试数据库连接...
    cd code/backend
    node test-db-connection.js
    cd ../..
    pause
    exit /b 0
)

if "%1"=="help" (
    echo 📖 启动脚本使用说明：
    echo.
    echo 基础启动：
    echo   start-dev.bat          - 启动开发环境
    echo.
    echo 功能脚本：
    echo   start-dev.bat check    - 执行配置检查
    echo   start-dev.bat check-full - 执行完整配置检查
    echo   start-dev.bat fix-db   - 执行数据库修复
    echo   start-dev.bat test-api - 测试API接口
    echo   start-dev.bat test-db  - 测试数据库连接
    echo   start-dev.bat help     - 显示此帮助信息
    echo.
    pause
    exit /b 0
)

REM 默认启动开发环境
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
echo 🔍 其他功能: start-dev.bat help
echo.
pause
