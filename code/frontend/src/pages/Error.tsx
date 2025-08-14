import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Typography, Space } from 'antd';
import { HomeOutlined, RollbackOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const ErrorPage: React.FC = () => {
  const navigate = useNavigate();

  const goHome = () => {
    navigate('/dashboard');
  };

  const goBack = () => {
    navigate(-1);
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f5f5'
    }}>
      <Card
        style={{
          width: 640,
          textAlign: 'center',
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
        }}
        styles={{ body: { padding: 28 } }}
      >
        <div style={{ fontSize: 56, fontWeight: 800, color: '#ff4d4f' }}>
          500
        </div>
        <Title level={3} style={{ marginTop: 8, marginBottom: 8 }}>
          抱歉，系统出现了一点小问题
        </Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          请稍后重试，或返回首页继续浏览。
        </Text>
        <div style={{ marginTop: 20 }}>
          <Space size={12}>
            <Button 
              icon={<RollbackOutlined />} 
              onClick={goBack}
              size="large"
            >
              返回上一页
            </Button>
            <Button 
              type="primary" 
              icon={<HomeOutlined />} 
              onClick={goHome}
              size="large"
            >
              回到首页
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default ErrorPage;
