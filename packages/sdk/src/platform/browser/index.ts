import type { PlatformAdapter, WSConnection, WSEvents } from '../types.js';

/** 浏览器 WebSocket 连接封装 */
class BrowserWSConnection implements WSConnection {
  private ws: WebSocket;

  constructor(url: string, events: WSEvents) {
    this.ws = new WebSocket(url);

    this.ws.onopen = () => events.onOpen();
    this.ws.onmessage = (e) => {
      try {
        events.onMessage(JSON.parse(e.data));
      } catch {
        // 忽略无效消息
      }
    };
    this.ws.onclose = () => events.onClose();
    this.ws.onerror = () => events.onError(new Error('WebSocket connection failed'));
  }

  send(data: string): void {
    this.ws.send(data);
  }

  close(): void {
    this.ws.close();
  }
}

/** 浏览器平台适配器 */
export class BrowserAdapter implements PlatformAdapter {
  storage = {
    getItem(key: string): string | null {
      return localStorage.getItem(key);
    },
    setItem(key: string, value: string): void {
      localStorage.setItem(key, value);
    },
  };

  device = {
    getUserAgent(): string {
      return navigator.userAgent;
    },
    getScreen(): string {
      return `${window.screen.width}x${window.screen.height}`;
    },
    getPixelRatio(): number {
      return window.devicePixelRatio;
    },
    getLanguage(): string {
      return navigator.language;
    },
    getUrl(): string {
      return window.location.origin + window.location.pathname;
    },
  };

  timer = {
    setTimeout(fn: () => void, ms: number): number {
      return window.setTimeout(fn, ms);
    },
    clearTimeout(id: number): void {
      window.clearTimeout(id);
    },
    setInterval(fn: () => void, ms: number): number {
      return window.setInterval(fn, ms);
    },
    clearInterval(id: number): void {
      window.clearInterval(id);
    },
  };

  createWebSocket(url: string, events: WSEvents): WSConnection {
    return new BrowserWSConnection(url, events);
  }
}
