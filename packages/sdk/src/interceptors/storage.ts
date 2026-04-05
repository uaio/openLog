import type { StorageSnapshot } from '../types/index.js';

export type StorageReportCallback = (snapshot: Omit<StorageSnapshot, 'deviceId' | 'tabId'>) => void;

/** 需要拦截的 Storage 写方法 */
const WRITE_METHODS = ['setItem', 'removeItem', 'clear'] as const;

/**
 * Storage 读取器 + 实时写入监听
 *
 * 监听策略：
 *  - localStorage / sessionStorage: 拦截 setItem / removeItem / clear
 *  - document.cookie: 拦截 setter（通过 Object.defineProperty，失败时静默降级）
 *
 * 任意写入触发防抖（200ms）自动快照上报 → DataBus → PC 端实时同步
 * （包含 Eruda 面板的手动操作、业务代码写入等所有来源）
 */
export class StorageReader {
  private onReport: StorageReportCallback;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  // 保存原始方法，用于恢复
  private origLocalSetItem: typeof localStorage.setItem | null = null;
  private origLocalRemoveItem: typeof localStorage.removeItem | null = null;
  private origLocalClear: typeof localStorage.clear | null = null;
  private origSessionSetItem: typeof sessionStorage.setItem | null = null;
  private origSessionRemoveItem: typeof sessionStorage.removeItem | null = null;
  private origSessionClear: typeof sessionStorage.clear | null = null;
  private cookieDescriptor: PropertyDescriptor | null = null;
  private watching = false;

  constructor(onReport: StorageReportCallback) {
    this.onReport = onReport;
  }

  /** 读取并上报存储快照（可手动触发） */
  readAndReport(): void {
    try {
      const snapshot = this.readStorage();
      this.onReport(snapshot);
    } catch (error) {
      console.error('[openLog] Failed to read storage:', error);
    }
  }

  /** 开始监听所有存储写操作，任何写入都会自动触发防抖上报 */
  watch(): void {
    if (this.watching || typeof window === 'undefined') return;
    this.watching = true;

    this.patchStorageObject(localStorage, 'local');
    this.patchStorageObject(sessionStorage, 'session');
    this.patchCookie();
  }

  /** 停止监听，恢复原始 API */
  unwatch(): void {
    if (!this.watching) return;
    this.watching = false;

    this.restoreStorageObject(localStorage, 'local');
    this.restoreStorageObject(sessionStorage, 'session');
    this.restoreCookie();

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  /** 读取存储数据 */
  readStorage(): Omit<StorageSnapshot, 'deviceId' | 'tabId'> {
    const localStorageData: Record<string, string> = {};
    const sessionStorageData: Record<string, string> = {};
    let localStorageSize = 0;
    let sessionStorageSize = 0;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key) || '';
          localStorageData[key] = value;
          localStorageSize += key.length + value.length;
        }
      }
    } catch {
      // 沙盒环境可能禁止访问
    }

    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          const value = sessionStorage.getItem(key) || '';
          sessionStorageData[key] = value;
          sessionStorageSize += key.length + value.length;
        }
      }
    } catch {
      // ignore
    }

    let cookies = '';
    try {
      cookies = document.cookie;
    } catch {
      // ignore
    }

    return {
      timestamp: Date.now(),
      localStorage: localStorageData,
      sessionStorage: sessionStorageData,
      cookies,
      localStorageSize,
      sessionStorageSize
    };
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private debouncedReport(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.readAndReport();
    }, 200);
  }

  private patchStorageObject(storage: Storage, type: 'local' | 'session'): void {
    const self = this;

    try {
      // setItem
      const origSetItem = storage.setItem.bind(storage);
      if (type === 'local') this.origLocalSetItem = origSetItem;
      else this.origSessionSetItem = origSetItem;
      storage.setItem = function (key: string, value: string) {
        origSetItem(key, value);
        self.debouncedReport();
      };

      // removeItem
      const origRemoveItem = storage.removeItem.bind(storage);
      if (type === 'local') this.origLocalRemoveItem = origRemoveItem;
      else this.origSessionRemoveItem = origRemoveItem;
      storage.removeItem = function (key: string) {
        origRemoveItem(key);
        self.debouncedReport();
      };

      // clear
      const origClear = storage.clear.bind(storage);
      if (type === 'local') this.origLocalClear = origClear;
      else this.origSessionClear = origClear;
      storage.clear = function () {
        origClear();
        self.debouncedReport();
      };
    } catch {
      // 某些浏览器/框架可能不允许覆盖 Storage 方法，静默降级
    }
  }

  private restoreStorageObject(storage: Storage, type: 'local' | 'session'): void {
    try {
      if (type === 'local') {
        if (this.origLocalSetItem) storage.setItem = this.origLocalSetItem;
        if (this.origLocalRemoveItem) storage.removeItem = this.origLocalRemoveItem;
        if (this.origLocalClear) storage.clear = this.origLocalClear;
      } else {
        if (this.origSessionSetItem) storage.setItem = this.origSessionSetItem;
        if (this.origSessionRemoveItem) storage.removeItem = this.origSessionRemoveItem;
        if (this.origSessionClear) storage.clear = this.origSessionClear;
      }
    } catch {
      // ignore
    }
  }

  private patchCookie(): void {
    try {
      const self = this;
      // 优先尝试在 Document.prototype 上获取原始 descriptor
      const proto = Document.prototype;
      const desc = Object.getOwnPropertyDescriptor(proto, 'cookie')
        ?? Object.getOwnPropertyDescriptor(document, 'cookie');

      if (!desc || !desc.configurable || !desc.set) return;

      this.cookieDescriptor = desc;

      Object.defineProperty(document, 'cookie', {
        configurable: true,
        enumerable: true,
        get() {
          return desc.get!.call(document);
        },
        set(val: string) {
          desc.set!.call(document, val);
          self.debouncedReport();
        }
      });
    } catch {
      // cookie 拦截失败时静默降级，不影响其他功能
    }
  }

  private restoreCookie(): void {
    try {
      if (this.cookieDescriptor) {
        Object.defineProperty(document, 'cookie', this.cookieDescriptor);
        this.cookieDescriptor = null;
      }
    } catch {
      // ignore
    }
  }
}
