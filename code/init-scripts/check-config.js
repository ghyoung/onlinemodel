import fs from 'fs';
import path from 'path';

console.log('🔍 检查湖仓建模工具配置...\n');

// 获取当前脚本所在目录
const scriptDir = path.dirname(new URL(import.meta.url).pathname);
// 在Windows上，URL.pathname会包含盘符，需要处理
const currentDir = process.platform === 'win32' ? scriptDir.substring(1) : scriptDir;

console.log('📍 脚本运行目录:', currentDir);

// 检查前端配置
console.log('📱 前端配置检查:');
try {
  const viteConfig = fs.readFileSync(path.join(currentDir, '..', 'frontend', 'vite.config.ts'), 'utf8');
  const envConfig = fs.readFileSync(path.join(currentDir, '..', 'frontend', 'src', 'config', 'env.ts'), 'utf8');
  const apiConfig = fs.readFileSync(path.join(currentDir, '..', 'frontend', 'src', 'config', 'api.ts'), 'utf8');
  
  // 检查Vite端口
  const portMatch = viteConfig.match(/port:\s*(\d+)/);
  if (portMatch) {
    console.log(`  ✅ Vite端口: ${portMatch[1]}`);
  } else {
    console.log('  ❌ 未找到Vite端口配置');
  }
  
  // 检查代理配置
  const proxyMatch = viteConfig.match(/target:\s*['"`]([^'"`]+)['"`]/);
  if (proxyMatch) {
    console.log(`  ✅ 代理目标: ${proxyMatch[1]}`);
  } else {
    console.log('  ❌ 未找到代理配置');
  }
  
  // 检查API基础URL
  const apiUrlMatch = envConfig.match(/API_BASE_URL.*?['"`]([^'"`]+)['"`]/);
  if (apiUrlMatch) {
    console.log(`  ✅ API基础URL: ${apiUrlMatch[1]}`);
  } else {
    console.log('  ❌ 未找到API基础URL配置');
  }
  
  // 检查API配置
  const apiBaseMatch = apiConfig.match(/API_BASE_URL\s*=\s*['"`]([^'"`]+)['"`]/);
  if (apiBaseMatch) {
    console.log(`  ✅ API配置: ${apiBaseMatch[1]}`);
  } else {
    console.log('  ❌ 未找到API配置');
  }
  
} catch (error) {
  console.log(`  ❌ 读取前端配置失败: ${error.message}`);
}

console.log('\n🔧 后端配置检查:');
try {
  const backendConfig = fs.readFileSync(path.join(currentDir, '..', 'backend', 'env.config.js'), 'utf8');
  
  // 检查后端端口
  const portMatch = backendConfig.match(/PORT:\s*(\d+)/);
  if (portMatch) {
    console.log(`  ✅ 后端端口: ${portMatch[1]}`);
  } else {
    console.log('  ❌ 未找到后端端口配置');
  }
  
  // 检查前端URL
  const frontendUrlMatch = backendConfig.match(/FRONTEND_URL:\s*['"`]([^'"`]+)['"`]/);
  if (frontendUrlMatch) {
    console.log(`  ✅ 前端URL: ${frontendUrlMatch[1]}`);
  } else {
    console.log('  ❌ 未找到前端URL配置');
  }
  
} catch (error) {
  console.log(`  ❌ 读取后端配置失败: ${error.message}`);
}

console.log('\n📋 配置一致性检查:');
try {
  const viteConfig = fs.readFileSync(path.join(currentDir, '..', 'frontend', 'vite.config.ts'), 'utf8');
  const backendConfig = fs.readFileSync(path.join(currentDir, '..', 'backend', 'env.config.js'), 'utf8');
  
  // 检查端口一致性
  const vitePortMatch = viteConfig.match(/port:\s*(\d+)/);
  const backendPortMatch = backendConfig.match(/PORT:\s*(\d+)/);
  const proxyMatch = viteConfig.match(/target:\s*['"`]([^'"`]+)['"`]/);
  
  if (vitePortMatch && backendPortMatch && proxyMatch) {
    const vitePort = vitePortMatch[1];
    const backendPort = backendPortMatch[1];
    const proxyTarget = proxyMatch[1];
    
    console.log(`  前端端口: ${vitePort}`);
    console.log(`  后端端口: ${backendPort}`);
    console.log(`  代理目标: ${proxyTarget}`);
    
    if (proxyTarget.includes(`localhost:${backendPort}`)) {
      console.log('  ✅ 代理配置正确');
    } else {
      console.log('  ❌ 代理配置错误：前端代理目标与后端端口不匹配');
    }
  } else {
    console.log('  ❌ 无法完成端口一致性检查');
  }
  
} catch (error) {
  console.log(`  ❌ 配置一致性检查失败: ${error.message}`);
}

console.log('\n📁 目录结构检查:');
const requiredDirs = ['frontend', 'backend', 'frontend/src', 'frontend/src/components', 'frontend/src/pages', 'backend/src', 'backend/src/routes', 'backend/src/controllers'];
requiredDirs.forEach(dir => {
  const fullPath = path.join(currentDir, '..', dir);
  if (fs.existsSync(fullPath)) {
    console.log(`  ✅ ${dir}/`);
  } else {
    console.log(`  ❌ ${dir}/ (目录不存在)`);
  }
});

console.log('\n🔍 配置文件检查:');
const requiredFiles = [
  'frontend/package.json',
  'frontend/vite.config.ts',
  'frontend/tsconfig.json',
  'backend/package.json',
  'backend/env.config.js'
];

requiredFiles.forEach(file => {
  const fullPath = path.join(currentDir, '..', file);
  if (fs.existsSync(fullPath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} (文件不存在)`);
  }
});

console.log('\n✨ 配置检查完成！');
console.log('�� 如有问题，请参考故障排除指南');
