import type {
  ConsoleLogEntry,
  NetworkRequestEntry,
  StorageSnapshot,
  DOMSnapshot,
  PerformanceReport,
  ScreenshotData,
  PerfRunSession,
} from '../types/index.js';

/** DataBus 上的 console 事件包含 args，供本地展示层（Eruda）使用 */
export interface DataBusConsoleEntry extends Omit<ConsoleLogEntry, 'deviceId' | 'tabId'> {
  /** 原始参数，供 Eruda 等本地展示层做富文本渲染，不通过 WebSocket 传输 */
  args: unknown[];
}

export type DataBusEventMap = {
  console: DataBusConsoleEntry;
  network: Omit<NetworkRequestEntry, 'deviceId' | 'tabId'>;
  storage: Omit<StorageSnapshot, 'deviceId' | 'tabId'>;
  dom: Omit<DOMSnapshot, 'deviceId' | 'tabId'>;
  performance: Omit<PerformanceReport, 'deviceId' | 'tabId'>;
  screenshot: ScreenshotData;
  perf_run: PerfRunSession;
};

type Listener<T> = (data: T) => void;

/**
 * 同步事件总线 — 所有数据采集的唯一来源
 *
 * 设计原则：
 *  - 同步 emit：保证采集发生在第一时间，任何订阅者延迟不影响数据完整性
 *  - 容错：单个订阅者抛错不会中断其余订阅者的接收
 *  - 多消费者：本地展示（Eruda）和远程传输（WebSocket）均可订阅，互不干扰
 */
export class DataBus {
  private listeners = new Map<string, Set<Listener<unknown>>>();

  emit<K extends keyof DataBusEventMap>(event: K, data: DataBusEventMap[K]): void {
    const handlers = this.listeners.get(event as string);
    if (!handlers || handlers.size === 0) return;
    for (const handler of handlers) {
      try {
        handler(data);
      } catch {
        // 静默忽略订阅者错误，保护采集链路
      }
    }
  }

  /** 订阅事件，返回取消订阅函数 */
  on<K extends keyof DataBusEventMap>(
    event: K,
    cb: Listener<DataBusEventMap[K]>
  ): () => void {
    if (!this.listeners.has(event as string)) {
      this.listeners.set(event as string, new Set());
    }
    this.listeners.get(event as string)!.add(cb as Listener<unknown>);
    return () => this.off(event, cb);
  }

  off<K extends keyof DataBusEventMap>(
    event: K,
    cb: Listener<DataBusEventMap[K]>
  ): void {
    this.listeners.get(event as string)?.delete(cb as Listener<unknown>);
  }

  /** 清除所有监听器（用于 destroy） */
  clear(): void {
    this.listeners.clear();
  }
}
