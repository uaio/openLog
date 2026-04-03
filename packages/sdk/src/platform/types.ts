/** 平台适配器接口，所有平台必须实现 */

/** WebSocket 连接抽象 */
export interface WSConnection {
  send(data: string): void;
  close(): void;
}

/** WebSocket 事件回调 */
export interface WSEvents {
  onOpen: () => void;
  onMessage: (data: unknown) => void;
  onClose: () => void;
  onError: (error: Error) => void;
}

/** 存储接口 */
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** 设备信息获取接口 */
export interface DeviceAdapter {
  getUserAgent(): string;
  getScreen(): string;
  getPixelRatio(): number;
  getLanguage(): string;
  getUrl(): string;
}

/** 定时器接口 */
export interface TimerAdapter {
  setTimeout(fn: () => void, ms: number): number;
  clearTimeout(id: number): void;
  setInterval(fn: () => void, ms: number): number;
  clearInterval(id: number): void;
}

/** 平台适配器 - 平台相关的所有 API 封装 */
export interface PlatformAdapter {
  storage: StorageAdapter;
  device: DeviceAdapter;
  timer: TimerAdapter;
  createWebSocket(url: string, events: WSEvents): WSConnection;
}
