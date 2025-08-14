import fs from 'fs';
import path from 'path';

console.log('🔍 湖仓建模工具配置检查\n');

// 检查前端配置
console.log('📱 前端配置:');
try {
  const viteConfig = fs.readFileSync('./frontend/vite.config.ts', 'utf8');
  const envConfig = fs.readFileSync('./frontend/src/config/env.ts', 'utf8');
  const apiConfig = fs.readFileSync('./frontend/src/config/api.ts', 'utf8');
  
  // Vite端口
  const portMatch = viteConfig.match(/port:\s*(\d+)/);
  console.log(`  端口: ${portMatch ? portMatch[1] : '未找到'}`);
  
  // 代理目标
  const proxyMatch = viteConfig.match(/target:\s*['"`]([^'"`]+)['"`]/);
  console.log(`  代理目标: ${proxyMatch ? proxyMatch[1] : '未找到'}`);
  
  // API基础URL
  const apiUrlMatch = envConfig.match(/API_BASE_URL.*?['"`]([^'"`]+)['"`]/);
  console.log(`  API基础URL: ${apiUrlMatch ? apiUrlMatch[1] : '未找到'}`);
  
} catch (error) {
  console.log(`  ❌ 读取失败: ${error.message}`);
}

// 检查后端配置
console.log('\n🔧 后端配置:');
try {
  const backendConfig = fs.readFileSync('./backend/env.config.js', 'utf8');
  
  // 后端端口
  const portMatch = backendConfig.match(/PORT:\s*(\d+)/);
  console.log(`  端口: ${portMatch ? portMatch[1] : '未找到'}`);
  
  // 前端URL
  const frontendUrlMatch = backendConfig.match(/FRONTEND_URL:\s*['"`]([^'"`]+)['"`]/);
  console.log(`  前端URL: ${frontendUrlMatch ? frontendUrlMatch[1] : '未找到'}`);
  
} catch (error) {
  console.log(`  ❌ 读取失败: ${error.message}`);
}

// 配置验证
console.log('\n✅ 配置验证:');
try {
  const viteConfig = fs.readFileSync('./frontend/vite.config.ts', 'utf8');
  const backendConfig = fs.readFileSync('./backend/env.config.js', 'utf8');
  
  const vitePort = viteConfig.match(/port:\s*(\d+)/)?.[1];
  const backendPort = backendConfig.match(/PORT:\s*(\d+)/)?.[1];
  const proxyTarget = viteConfig.match(/target:\s*['"`]([^'"`]+)['"`]/)?.[1];
  
  if (vitePort === '3002') {
    console.log('  ✅ 前端端口配置正确 (3002)');
  } else {
    console.log(`  ❌ 前端端口配置错误: ${vitePort} (应为3002)`);
  }
  
  if (backendPort === '3000') {
    console.log('  ✅ 后端端口配置正确 (3000)');
  } else {
    console.log(`  ❌ 后端端口配置错误: ${backendPort} (应为3000)`);
  }
  
  if (proxyTarget === 'http://localhost:3000') {
    console.log('  ✅ 代理配置正确');
  } else {
    console.log(`  ❌ 代理配置错误: ${proxyTarget} (应为http://localhost:3000)`);
  }
  
} catch (error) {
  console.log(`  ❌ 验证失败: ${error.message}`);
}

console.log('\n🎯 建议配置:');
console.log('  前端: 3002端口, 代理到 http://localhost:3000');
console.log('  后端: 3000端口, CORS允许 http://localhost:3002');
console.log('  API: 使用相对路径 /api');
