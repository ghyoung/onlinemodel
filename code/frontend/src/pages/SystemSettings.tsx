import React, { useState } from 'react';
import { Card, Button, Input, Switch, Select, Form, Row, Col, Divider, Typography, Space, message } from 'antd';
import { SaveOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

interface SystemSettingsProps {}

const SystemSettings: React.FC<SystemSettingsProps> = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const initialValues = {
    // 基本设置
    systemName: '湖仓建模工具',
    systemVersion: '1.0.0',
    language: 'zh-CN',
    timezone: 'Asia/Shanghai',
    
    // 安全设置
    enableSSL: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    
    // 性能设置
    maxConnections: 100,
    queryTimeout: 300,
    cacheEnabled: true,
    cacheSize: 1024,
    
    // 通知设置
    emailNotifications: false,
    smsNotifications: false,
    systemAlerts: true,
    
    // 备份设置
    autoBackup: true,
    backupFrequency: 'daily',
    backupRetention: 30,
  };

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      // TODO: 实现保存逻辑
      console.log('保存设置:', values);
      message.success('设置保存成功！');
    } catch (error) {
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.setFieldsValue(initialValues);
    message.info('设置已重置为默认值');
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>
          <SettingOutlined style={{ marginRight: '8px' }} />
          系统设置
        </Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            重置
          </Button>
          <Button 
            type="primary" 
            icon={<SaveOutlined />} 
            loading={loading}
            onClick={() => form.submit()}
          >
            保存设置
          </Button>
        </Space>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={handleSave}
      >
        <Row gutter={[24, 24]}>
          {/* 基本设置 */}
          <Col xs={24} lg={12}>
            <Card title="基本设置" size="small">
              <Form.Item label="系统名称" name="systemName">
                <Input placeholder="请输入系统名称" />
              </Form.Item>
              
              <Form.Item label="系统版本" name="systemVersion">
                <Input disabled />
              </Form.Item>
              
              <Form.Item label="语言" name="language">
                <Select placeholder="请选择语言">
                  <Option value="zh-CN">中文 (简体)</Option>
                  <Option value="en-US">English (US)</Option>
                </Select>
              </Form.Item>
              
              <Form.Item label="时区" name="timezone">
                <Select placeholder="请选择时区">
                  <Option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</Option>
                  <Option value="UTC">UTC</Option>
                  <Option value="America/New_York">America/New_York (UTC-5)</Option>
                </Select>
              </Form.Item>
            </Card>
          </Col>

          {/* 安全设置 */}
          <Col xs={24} lg={12}>
            <Card title="安全设置" size="small">
              <Form.Item label="启用SSL" name="enableSSL" valuePropName="checked">
                <Switch />
              </Form.Item>
              
              <Form.Item label="会话超时 (分钟)" name="sessionTimeout">
                <Input type="number" placeholder="请输入超时时间" />
              </Form.Item>
              
              <Form.Item label="最大登录尝试次数" name="maxLoginAttempts">
                <Input type="number" placeholder="请输入最大尝试次数" />
              </Form.Item>
              
              <Form.Item label="密码最小长度" name="passwordMinLength">
                <Input type="number" placeholder="请输入最小长度" />
              </Form.Item>
            </Card>
          </Col>

          {/* 性能设置 */}
          <Col xs={24} lg={12}>
            <Card title="性能设置" size="small">
              <Form.Item label="最大连接数" name="maxConnections">
                <Input type="number" placeholder="请输入最大连接数" />
              </Form.Item>
              
              <Form.Item label="查询超时 (秒)" name="queryTimeout">
                <Input type="number" placeholder="请输入查询超时时间" />
              </Form.Item>
              
              <Form.Item label="启用缓存" name="cacheEnabled" valuePropName="checked">
                <Switch />
              </Form.Item>
              
              <Form.Item label="缓存大小 (MB)" name="cacheSize">
                <Input type="number" placeholder="请输入缓存大小" />
              </Form.Item>
            </Card>
          </Col>

          {/* 通知设置 */}
          <Col xs={24} lg={12}>
            <Card title="通知设置" size="small">
              <Form.Item label="邮件通知" name="emailNotifications" valuePropName="checked">
                <Switch />
              </Form.Item>
              
              <Form.Item label="短信通知" name="smsNotifications" valuePropName="checked">
                <Switch />
              </Form.Item>
              
              <Form.Item label="系统告警" name="systemAlerts" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Card>
          </Col>

          {/* 备份设置 */}
          <Col xs={24}>
            <Card title="备份设置" size="small">
              <Form.Item label="自动备份" name="autoBackup" valuePropName="checked">
                <Switch />
              </Form.Item>
              
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label="备份频率" name="backupFrequency">
                    <Select placeholder="请选择备份频率">
                      <Option value="hourly">每小时</Option>
                      <Option value="daily">每天</Option>
                      <Option value="weekly">每周</Option>
                      <Option value="monthly">每月</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col xs={24} md={12}>
                  <Form.Item label="保留天数" name="backupRetention">
                    <Input type="number" placeholder="请输入保留天数" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default SystemSettings;
