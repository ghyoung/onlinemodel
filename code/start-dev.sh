#!/bin/bash

# 湖仓建模工具开发环境启动脚本
# Node.js + React + PostgreSQL 轻量版本

echo "🚀 启动湖仓建模工具开发环境..."

# 检查Node.js版本
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js版本过低，需要Node.js 18+，当前版本: $NODE_VERSION"
    exit 1
fi

echo "✅ Node.js版本检查通过: $(node --version)"

# 检查npm版本
if ! command -v npm &> /dev/null; then
    echo "❌ npm未安装，请先安装npm"
    exit 1
fi

echo "✅ npm版本检查通过: $(npm --version)"

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker未运行，请先启动Docker"
    exit 1
fi

echo "✅ Docker检查通过"

# 启动PostgreSQL数据库
echo "🗄️ 启动PostgreSQL数据库..."
docker-compose up -d postgres

# 等待数据库启动
echo "⏳ 等待PostgreSQL数据库启动..."
sleep 10

# 检查数据库状态
if docker-compose ps postgres | grep -q "Up"; then
    echo "✅ PostgreSQL数据库启动成功"
else
    echo "❌ PostgreSQL数据库启动失败"
    docker-compose logs postgres
    exit 1
fi

# 启动后端服务
echo "🔧 启动后端服务..."
cd backend

# 安装后端依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装后端依赖..."
    npm install
fi

# 启动后端服务
echo "🚀 启动Node.js后端服务..."
npm run dev &
BACKEND_PID=$!

# 等待后端启动
echo "⏳ 等待后端服务启动..."
sleep 8

# 检查后端状态
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ 后端服务启动成功"
else
    echo "❌ 后端服务启动失败"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# 启动前端服务
echo "🎨 启动前端服务..."
cd ../frontend

# 安装前端依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm install
fi

# 启动前端服务
echo "🚀 启动React前端服务..."
npm run dev &
FRONTEND_PID=$!

# 等待前端启动
echo "⏳ 等待前端服务启动..."
sleep 10

# 检查前端状态
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ 前端服务启动成功"
else
    echo "❌ 前端服务启动失败"
    kill $FRONTEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🎉 湖仓建模工具开发环境启动完成！"
echo ""
echo "📍 服务地址:"
echo "   - 后端API: http://localhost:3000"
echo "   - 前端页面: http://localhost:5173"
echo "   - 健康检查: http://localhost:3000/health"
echo "   - PostgreSQL: localhost:5432"
echo ""
echo "🔑 默认登录账号:"
echo "   - 用户名: admin"
echo "   - 密码: admin123"
echo ""
echo "📝 开发说明:"
echo "   - 后端热重载: 修改代码后自动重启"
echo "   - 前端热重载: 修改代码后自动刷新"
echo "   - 数据库: PostgreSQL 15，Docker管理"
echo ""
echo "🛑 停止服务: 按 Ctrl+C"

# 等待用户中断
wait
