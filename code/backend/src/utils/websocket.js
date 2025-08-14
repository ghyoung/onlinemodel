import { WebSocketServer } from 'ws';

let wss;

// 设置WebSocket服务器
export function setupWebSocket(server) {
  wss = new WebSocketServer({ server });
  
  wss.on('connection', (ws, req) => {
    console.log('🔌 新的WebSocket连接建立');
    
    // 发送欢迎消息
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'WebSocket连接已建立',
      timestamp: new Date().toISOString()
    }));
    
    // 处理消息
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        console.log('📨 收到WebSocket消息:', message);
        
        // 处理不同类型的消息
        switch (message.type) {
          case 'ping':
            ws.send(JSON.stringify({
              type: 'pong',
              timestamp: new Date().toISOString()
            }));
            break;
            
          case 'subscribe':
            // 订阅特定频道
            ws.channel = message.channel;
            ws.send(JSON.stringify({
              type: 'subscribed',
              channel: message.channel,
              message: '订阅成功',
              timestamp: new Date().toISOString()
            }));
            break;
            
          default:
            ws.send(JSON.stringify({
              type: 'error',
              message: '未知的消息类型',
              timestamp: new Date().toISOString()
            }));
        }
      } catch (error) {
        console.error('WebSocket消息处理错误:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: '消息格式错误',
          timestamp: new Date().toISOString()
        }));
      }
    });
    
    // 处理连接关闭
    ws.on('close', () => {
      console.log('🔌 WebSocket连接关闭');
    });
    
    // 处理错误
    ws.on('error', (error) => {
      console.error('WebSocket错误:', error);
    });
  });
  
  console.log('✅ WebSocket服务器设置完成');
}

// 广播消息到所有连接的客户端
export function broadcast(message) {
  if (!wss) {
    console.warn('WebSocket服务器未初始化');
    return;
  }
  
  const messageStr = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(messageStr);
    }
  });
}

// 发送消息到特定频道的客户端
export function broadcastToChannel(channel, message) {
  if (!wss) {
    console.warn('WebSocket服务器未初始化');
    return;
  }
  
  const messageStr = JSON.stringify({
    ...message,
    channel,
    timestamp: new Date().toISOString()
  });
  
  wss.clients.forEach((client) => {
    if (client.readyState === 1 && client.channel === channel) {
      client.send(messageStr);
    }
  });
}

// 获取当前连接数
export function getConnectionCount() {
  if (!wss) return 0;
  return wss.clients.size;
}
