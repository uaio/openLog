import { WebSocketMessage } from '../hooks/useWebSocket.js';

type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private reconnectCount = 0;
  private maxReconnectAttempts = Infinity;
  private handlers = new Set<MessageHandler>();
  private connectionState: 'connecting' | 'connected' | 'disconnected' = 'disconnected';

  constructor(url = 'ws://localhost:38291') {
    this.url = url;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    if (this.reconnectCount >= this.maxReconnectAttempts) {
      console.error('WebSocket: 达到最大重连次数，停止重连');
      return;
    }

    this.connectionState = 'connecting';

    const ws = new WebSocket(this.url);
    this.ws = ws;

    ws.onopen = () => {
      this.reconnectCount = 0;
      this.connectionState = 'connected';
      ws.send(JSON.stringify({ type: 'viewer' }));
      this.notifyStateChange();
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        this.handlers.forEach(handler => handler(message));
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      this.connectionState = 'disconnected';
      this.notifyStateChange();
      this.reconnectCount++;
      if (this.reconnectCount < this.maxReconnectAttempts) {
        this.reconnectTimeout = setTimeout(() => {
          this.connect();
        }, 3000);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.ws?.close();
    this.ws = null;
    this.reconnectCount = 0;
    this.connectionState = 'disconnected';
    this.notifyStateChange();
  }

  subscribe(handler: MessageHandler) {
    this.handlers.add(handler);

    // 如果还没有连接，自动连接
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connect();
    }

    // 返回取消订阅函数
    return () => {
      this.handlers.delete(handler);
      // 如果没有订阅者了，断开连接
      if (this.handlers.size === 0) {
        this.disconnect();
      }
    };
  }

  send(message: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  getConnectionState() {
    return this.connectionState;
  }

  private notifyStateChange() {
    // 可以在这里添加状态变化通知逻辑
  }
}

// 导出单例
export const websocketManager = new WebSocketManager();
