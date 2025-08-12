import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Button, 
  Space, 
  Input, 
  Select, 
  Slider, 
  Table, 
  Tag, 
  Tooltip, 
  message,
  Row,
  Col,
  Statistic,
  Drawer,
  Divider
} from 'antd'
import { 
  SearchOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
  ReloadOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  ShareAltOutlined
} from '@ant-design/icons'

const { Search } = Input
const { Option } = Select

interface LineageNode {
  id: string
  name: string
  type: 'table' | 'field'
  layer: string
  domain: string
  status: string
  x: number
  y: number
}

interface LineageEdge {
  source: string
  target: string
  type: string
  description: string
}

const Lineage: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [selectedLayer, setSelectedLayer] = useState<string>('')
  const [selectedDomain, setSelectedDomain] = useState<string>('')
  const [lineageDepth, setLineageDepth] = useState(3)
  const [selectedNode, setSelectedNode] = useState<LineageNode | null>(null)
  const [nodeDetailVisible, setNodeDetailVisible] = useState(false)
  const [settingsVisible, setSettingsVisible] = useState(false)

  // 模拟血缘数据
  const [nodes, setNodes] = useState<LineageNode[]>([])
  const [edges, setEdges] = useState<LineageEdge[]>([])

  useEffect(() => {
    // 模拟血缘图数据
    setNodes([
      { id: '1', name: 'user_info_ods', type: 'table', layer: 'ODS', domain: '用户域', status: 'active', x: 100, y: 100 },
      { id: '2', name: 'user_profile_dwd', type: 'table', layer: 'DWD', domain: '用户域', status: 'active', x: 300, y: 100 },
      { id: '3', name: 'user_dim', type: 'table', layer: 'DIM', domain: '用户域', status: 'active', x: 500, y: 100 },
      { id: '4', name: 'user_summary_dws', type: 'table', layer: 'DWS', domain: '用户域', status: 'active', x: 700, y: 100 },
      { id: '5', name: 'user_metrics_ads', type: 'table', layer: 'ADS', domain: '用户域', status: 'active', x: 900, y: 100 }
    ])

    setEdges([
      { source: '1', target: '2', type: 'ETL', description: '数据清洗转换' },
      { source: '2', target: '3', type: 'JOIN', description: '关联维度信息' },
      { source: '2', target: '4', type: 'AGGREGATE', description: '数据汇总' },
      { source: '4', target: '5', type: 'CALCULATE', description: '指标计算' }
    ])
  }, [])

  // 分层选项
  const layerOptions = [
    { value: 'ODS', label: 'ODS - 原始数据层' },
    { value: 'DWD', label: 'DWD - 明细数据层' },
    { value: 'DIM', label: 'DIM - 维度数据层' },
    { value: 'DWS', label: 'DWS - 汇总数据层' },
    { value: 'ADS', label: 'ADS - 应用数据层' }
  ]

  // 主题域选项
  const domainOptions = [
    { value: '用户域', label: '用户域' },
    { value: '订单域', label: '订单域' },
    { value: '商品域', label: '商品域' },
    { value: '营销域', label: '营销域' },
    { value: '财务域', label: '财务域' }
  ]

  const getLayerTag = (layer: string) => {
    const layerMap: Record<string, { color: string; label: string }> = {
      'ODS': { color: 'red', label: 'ODS' },
      'DWD': { color: 'blue', label: 'DWD' },
      'DIM': { color: 'green', label: 'DIM' },
      'DWS': { color: 'orange', label: 'DWS' },
      'ADS': { color: 'purple', label: 'ADS' }
    }
    
    const config = layerMap[layer] || { color: 'default', label: layer }
    return <Tag color={config.color}>{config.label}</Tag>
  }

  const getDomainTag = (domain: string) => {
    return <Tag color="blue">{domain}</Tag>
  }

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'active':
        return <Tag color="success">活跃</Tag>
      case 'inactive':
        return <Tag color="default">停用</Tag>
      case 'error':
        return <Tag color="error">错误</Tag>
      default:
        return <Tag color="default">未知</Tag>
    }
  }

  const handleSearch = (value: string) => {
    setSearchText(value)
    // TODO: 实现血缘图搜索
  }

  const handleNodeClick = (node: LineageNode) => {
    setSelectedNode(node)
    setNodeDetailVisible(true)
  }

  const handleRefresh = () => {
    setLoading(true)
    // TODO: 刷新血缘图数据
    setTimeout(() => {
      setLoading(false)
      message.success('血缘图已刷新')
    }, 1000)
  }

  const handleExport = () => {
    // TODO: 导出血缘图
    message.success('血缘图导出成功')
  }

  // 血缘图统计信息
  const lineageStats = {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    upstreamTables: nodes.filter(n => n.layer === 'ODS').length,
    downstreamTables: nodes.filter(n => n.layer === 'ADS').length
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 16
      }}>
        <h1>血缘关系</h1>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
          >
            刷新
          </Button>
          <Button
            icon={<SettingOutlined />}
            onClick={() => setSettingsVisible(true)}
          >
            设置
          </Button>
          <Button
            icon={<ShareAltOutlined />}
            onClick={handleExport}
          >
            导出
          </Button>
        </Space>
      </div>

      {/* 统计信息 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总节点数"
              value={lineageStats.totalNodes}
              valueStyle={{ color: '#1890FF' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总关系数"
              value={lineageStats.totalEdges}
              valueStyle={{ color: '#52C41A' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="上游表数"
              value={lineageStats.upstreamTables}
              valueStyle={{ color: '#FAAD14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="下游表数"
              value={lineageStats.downstreamTables}
              valueStyle={{ color: '#722ED1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和筛选 */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap style={{ width: '100%' }}>
          <Search
            placeholder="搜索表名、字段名..."
            style={{ width: 300 }}
            onSearch={handleSearch}
            enterButton={<SearchOutlined />}
          />
          <Select
            placeholder="选择分层"
            style={{ width: 150 }}
            allowClear
            value={selectedLayer}
            onChange={setSelectedLayer}
          >
            {layerOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="选择主题域"
            style={{ width: 150 }}
            allowClear
            value={selectedDomain}
            onChange={setSelectedDomain}
          >
            {domainOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>血缘深度:</span>
            <Slider
              min={1}
              max={10}
              value={lineageDepth}
              onChange={setLineageDepth}
              style={{ width: 120 }}
            />
            <span>{lineageDepth}</span>
          </div>
        </Space>
      </Card>

      {/* 血缘图工具栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ZoomInOutlined />}>放大</Button>
          <Button icon={<ZoomOutOutlined />}>缩小</Button>
          <Button icon={<FullscreenOutlined />}>全屏</Button>
          <Button>重置视图</Button>
          <Button>自动布局</Button>
        </Space>
      </Card>

      {/* 血缘图主区域 */}
      <Card style={{ height: 'calc(100vh - 400px)', position: 'relative' }}>
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          color: '#8c8c8c',
          textAlign: 'center'
        }}>
          <InfoCircleOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <div>血缘图可视化区域</div>
          <div style={{ fontSize: '12px', marginTop: 8 }}>
            这里将集成专业的图形库（如G6、D3.js）来展示血缘关系图
          </div>
        </div>
        
        {/* 模拟血缘图节点 */}
        {nodes.map(node => (
          <div
            key={node.id}
            style={{
              position: 'absolute',
              left: node.x,
              top: node.y,
              width: 120,
              height: 60,
              border: '2px solid #1890FF',
              borderRadius: '8px',
              backgroundColor: '#fff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
              fontSize: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
            onClick={() => handleNodeClick(node)}
          >
            <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{node.name}</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {getLayerTag(node.layer)}
              {getDomainTag(node.domain)}
            </div>
          </div>
        ))}
      </Card>

      {/* 节点详情抽屉 */}
      <Drawer
        title="节点详情"
        placement="right"
        width={500}
        open={nodeDetailVisible}
        onClose={() => setNodeDetailVisible(false)}
      >
        {selectedNode && (
          <div>
            <h3>{selectedNode.name}</h3>
            <p><strong>类型:</strong> {selectedNode.type === 'table' ? '表' : '字段'}</p>
            <p><strong>分层:</strong> {getLayerTag(selectedNode.layer)}</p>
            <p><strong>主题域:</strong> {getDomainTag(selectedNode.domain)}</p>
            <p><strong>状态:</strong> {getStatusTag(selectedNode.status)}</p>
            
            <Divider />
            
            <h4>血缘关系</h4>
            <p>上游表: 2个</p>
            <p>下游表: 3个</p>
            <p>影响字段: 15个</p>
            
            <Divider />
            
            <h4>最近更新</h4>
            <p>最后修改: 2024-01-15 14:30:00</p>
            <p>修改人: 张三</p>
            <p>修改内容: 新增字段 user_level</p>
          </div>
        )}
      </Drawer>

      {/* 设置抽屉 */}
      <Drawer
        title="血缘图设置"
        placement="right"
        width={400}
        open={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      >
        <div>
          <h4>显示设置</h4>
          <p>节点大小: 默认</p>
          <p>连线样式: 实线</p>
          <p>标签显示: 开启</p>
          
          <Divider />
          
          <h4>性能设置</h4>
          <p>最大节点数: 1000</p>
          <p>最大连线数: 5000</p>
          <p>动画效果: 开启</p>
          
          <Divider />
          
          <h4>布局设置</h4>
          <p>布局算法: 力导向图</p>
          <p>节点间距: 100px</p>
          <p>层级间距: 150px</p>
        </div>
      </Drawer>
    </div>
  )
}

export default Lineage

