import { WebSocketMessage } from '../hooks/useWebSocket.js';

type MessageHandler = (message: WebSocketMessage) => void;
type StateChangeHandler = (state: 'connecting' | 'connected' | 'disconnected') => void;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private reconnectCount = 0;
  private maxReconnectAttempts = Infinity;
  private handlers = new Set<MessageHandler>();
  private stateHandlers = new Set<StateChangeHandler>();
  private connectionState: 'connecting' | 'connected' | 'disconnected' = 'disconnected';

  constructor(url = 'ws://localhost:38291') {
    this.url = url;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    if (this.reconnectCount >= this.maxReconnectAttempts) {
      return;
    }

    this.connectionState = 'connecting';
    this.notifyStateChange();

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
        this.handlers.forEach((handler) => handler(message));
      } catch {
        // ignore parse errors
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

    ws.onerror = () => {
      // error is followed by close event
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

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connect();
    }

    return () => {
      this.handlers.delete(handler);
      if (this.handlers.size === 0) {
        this.disconnect();
      }
    };
  }

  onStateChange(handler: StateChangeHandler): () => void {
    this.stateHandlers.add(handler);
    return () => {
      this.stateHandlers.delete(handler);
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
    this.stateHandlers.forEach((handler) => handler(this.connectionState));
  }
}

// 导出单例
export const websocketManager = new WebSocketManager();
