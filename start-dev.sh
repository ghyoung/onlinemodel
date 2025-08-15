#!/bin/bash

echo "🚀 湖仓建模工具开发环境启动脚本"
echo

# 检查命令行参数
if [ "$1" = "check" ]; then
    echo "🔍 执行配置检查..."
    cd code
    node init-scripts/check-config-simple.js
    cd ..
    exit 0
fi

if [ "$1" = "check-full" ]; then
    echo "🔍 执行完整配置检查..."
    cd code
    node init-scripts/check-config.js
    cd ..
    exit 0
fi

if [ "$1" = "fix-db" ]; then
    echo "🔧 执行数据库修复..."
    cd code
    node init-scripts/fix-database.js
    cd ..
    exit 0
fi

if [ "$1" = "test-api" ]; then
    echo "🧪 测试API接口..."
    cd code/backend
    node test-api.js
    cd ../..
    exit 0
fi

if [ "$1" = "test-db" ]; then
    echo "🗄️ 测试数据库连接..."
    cd code/backend
    node test-db-connection.js
    cd ../..
    exit 0
fi

if [ "$1" = "validate" ]; then
    echo "🔍 执行系统一致性校验..."
    cd code
    node init-scripts/validate-system.js
    cd ..
    exit 0
fi

if [ "$1" = "quick-validate" ]; then
    echo "🔍 执行快速系统校验..."
    cd code
    node init-scripts/quick-validate.js
    cd ..
    exit 0
fi

if [ "$1" = "help" ]; then
    echo "📖 启动脚本使用说明："
    echo
    echo "基础启动："
    echo "  ./start-dev.sh          - 启动开发环境"
    echo
    echo "功能脚本："
    echo "  ./start-dev.sh check    - 执行配置检查"
    echo "  ./start-dev.sh check-full - 执行完整配置检查"
    echo "  ./start-dev.sh fix-db   - 执行数据库修复"
    echo "  ./start-dev.sh test-api - 测试API接口"
    echo "  ./start-dev.sh test-db  - 测试数据库连接"
    echo "  ./start-dev.sh validate - 执行系统一致性校验"
    echo "  ./start-dev.sh quick-validate - 执行快速系统校验"
    echo "  ./start-dev.sh help     - 显示此帮助信息"
    echo
    exit 0
fi

# 默认启动开发环境
echo "📍 当前目录: $(pwd)"
echo

# 自动执行快速校验
echo "🔍 自动执行快速系统校验..."
cd code
node init-scripts/quick-validate.js
cd ..
echo

echo "🔧 启动后端服务 (端口 3000)..."
cd code/backend
npm run dev &
BACKEND_PID=$!
cd ../..

echo "⏳ 等待后端启动..."
sleep 5

echo "🌐 启动前端服务 (端口 3002)..."
cd code/frontend
npm run dev &
FRONTEND_PID=$!
cd ../..

echo
echo "✅ 开发环境启动完成！"
echo
echo "📱 前端地址: http://localhost:3002"
echo "🔌 后端地址: http://localhost:3000"
echo
echo "💡 提示: 前端会自动代理 /api 请求到后端"
echo
echo "🔍 其他功能: ./start-dev.sh help"
echo
echo "按 Ctrl+C 停止服务"
echo

# 等待用户中断
trap "echo '正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT
wait
