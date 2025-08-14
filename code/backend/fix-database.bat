@echo off
echo 🔧 开始修复数据库结构...
echo.

cd /d "%~dp0"

echo 📍 当前目录: %CD%
echo.

echo 🚀 运行数据库修复脚本...
npm run fix-db

echo.
echo ✅ 数据库修复完成！
echo.
pause
