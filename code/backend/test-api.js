import axios from 'axios';

// API测试脚本
const API_BASE_URL = 'http://localhost:3000/api';

// 测试认证
async function testAuth() {
  try {
    console.log('🔐 测试认证接口...');
    
    // 测试登录
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ 登录成功');
      const token = loginResponse.data.token;
      
      // 测试获取用户信息
      const meResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (meResponse.data.success) {
        console.log('✅ 获取用户信息成功:', meResponse.data.data.username);
        return token;
      }
    }
  } catch (error) {
    console.error('❌ 认证测试失败:', error.response?.data || error.message);
  }
  return null;
}

// 测试数据源统计接口
async function testDataSourceStats(token) {
  try {
    console.log('📊 测试数据源统计接口...');
    
    const response = await axios.get(`${API_BASE_URL}/data-sources/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.data.success) {
      console.log('✅ 统计接口测试成功:', response.data.data);
      return true;
    } else {
      console.error('❌ 统计接口返回失败:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ 统计接口测试失败:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    return false;
  }
}

// 测试数据源列表接口
async function testDataSourceList(token) {
  try {
    console.log('📋 测试数据源列表接口...');
    
    const response = await axios.get(`${API_BASE_URL}/data-sources`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.data.success) {
      console.log('✅ 列表接口测试成功，数据源数量:', response.data.data.length);
      return true;
    } else {
      console.error('❌ 列表接口返回失败:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ 列表接口测试失败:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    return false;
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始API测试...\n');
  
  // 测试认证
  const token = await testAuth();
  if (!token) {
    console.log('❌ 认证失败，无法继续测试');
    return;
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 测试数据源相关接口
  const statsResult = await testDataSourceStats(token);
  const listResult = await testDataSourceList(token);
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 测试结果汇总:');
  console.log(`认证: ${token ? '✅ 成功' : '❌ 失败'}`);
  console.log(`统计接口: ${statsResult ? '✅ 成功' : '❌ 失败'}`);
  console.log(`列表接口: ${listResult ? '✅ 成功' : '❌ 失败'}`);
  
  if (statsResult && listResult) {
    console.log('\n🎉 所有测试通过！');
  } else {
    console.log('\n⚠️ 部分测试失败，请检查后端服务');
  }
}

// 运行测试
runTests().catch(console.error);
