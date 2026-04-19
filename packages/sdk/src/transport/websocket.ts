import type { RemoteConfig } from '../types/index.js';
import type { PlatformAdapter, WSConnection } from '../platform/types.js';
import { MessageQueue } from '../core/message-queue.js';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface TransportEvents {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onMessage?: (data: any) => void;
}

export class WebSocketTransport {
  private conn: WSConnection | null = null;
  private serverUrl: string;
  private state: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private readonly reconnectDelay = 3000;
  private events: TransportEvents;
  private messageQueue: MessageQueue;
  private shouldReconnect = true;
  private platform: PlatformAdapter;
  private reconnectTimer: number | null = null;

  constructor(config: RemoteConfig, events: TransportEvents, platform: PlatformAdapter) {
    this.serverUrl = config.server || '';
    this.events = events;
    this.messageQueue = new MessageQueue(100);
    this.platform = platform;
  }

  connect(): void {
    if (!this.shouldReconnect || !this.serverUrl) return;

    if (this.state === 'connecting' || this.state === 'connected') {
      return;
    }

    this.state = 'connecting';
    this.reconnectAttempts++;

    try {
      this.conn = this.platform.createWebSocket(this.serverUrl, {
        onOpen: () => {
          this.state = 'connected';
          this.reconnectAttempts = 0;
          this.events.onConnect?.();

          // 发送队列中的消息
          const pending = this.messageQueue.dequeueAll();
          for (const msg of pending) {
            this.conn?.send(msg);
          }
        },
        onMessage: (data) => {
          this.events.onMessage?.(data);
        },
        onClose: () => {
          this.state = 'disconnected';
          this.events.onDisconnect?.();

          if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectTimer = this.platform.timer.setTimeout(() => {
              this.reconnectTimer = null;
              this.connect();
            }, this.reconnectDelay);
          }
        },
        onError: (error: Error) => {
          this.state = 'error';
          this.events.onError?.(error);
        },
      });
    } catch (error) {
      this.state = 'error';
      this.events.onError?.(error as Error);
    }
  }

  send(data: string): void {
    if (this.state === 'connected' && this.conn) {
      try {
        this.conn.send(data);
      } catch (error) {
        this.state = 'error';
        this.events.onError?.(error as Error);
      }
    } else {
      this.messageQueue.enqueue(data);
    }
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer !== null) {
      this.platform.timer.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.conn) {
      this.conn.close();
      this.conn = null;
    }
    this.state = 'disconnected';
  }

  getState(): ConnectionState {
    return this.state;
  }

  getServerUrl(): string {
    return this.serverUrl;
  }
}
