/** 存储快照 */
export interface StorageSnapshot {
  deviceId: string;
  tabId: string;
  timestamp: number;
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  cookies: string;
  localStorageSize: number;
  sessionStorageSize: number;
}

export class StorageStore {
  private snapshots: Map<string, StorageSnapshot> = new Map();
  private cleanupTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  update(deviceId: string, snapshot: StorageSnapshot): void {
    // 取消之前的清理计时器
    const existingTimer = this.cleanupTimers.get(deviceId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.cleanupTimers.delete(deviceId);
    }

    this.snapshots.set(deviceId, snapshot);
  }

  get(deviceId: string): StorageSnapshot | undefined {
    return this.snapshots.get(deviceId);
  }

  clear(deviceId: string): void {
    this.snapshots.delete(deviceId);

    const timer = this.cleanupTimers.get(deviceId);
    if (timer) {
      clearTimeout(timer);
      this.cleanupTimers.delete(deviceId);
    }
  }

  /** 设备断开后延迟清理 */
  cleanup(deviceId: string): void {
    // 30 分钟后清理
    const timer = setTimeout(
      () => {
        this.snapshots.delete(deviceId);
        this.cleanupTimers.delete(deviceId);
      },
      30 * 60 * 1000,
    );

    this.cleanupTimers.set(deviceId, timer);
  }

  /** 取消清理计时器 */
  cancelCleanup(deviceId: string): void {
    const timer = this.cleanupTimers.get(deviceId);
    if (timer) {
      clearTimeout(timer);
      this.cleanupTimers.delete(deviceId);
    }
  }
}
