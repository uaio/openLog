export interface ScreenshotSnapshot {
  deviceId: string;
  tabId: string;
  timestamp: number;
  dataUrl: string; // base64 PNG
  width: number;
  height: number;
}

export class ScreenshotStore {
  private snapshots: Map<string, ScreenshotSnapshot> = new Map();
  private cleanupTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private readonly maxAge = 30 * 60 * 1000; // 30 minutes

  update(deviceId: string, snapshot: ScreenshotSnapshot): void {
    this.snapshots.set(deviceId, snapshot);
    this.cancelCleanup(deviceId);
  }

  get(deviceId: string): ScreenshotSnapshot | undefined {
    return this.snapshots.get(deviceId);
  }

  clear(deviceId: string): void {
    this.snapshots.delete(deviceId);
    this.cancelCleanup(deviceId);
  }

  /** Schedule cleanup when device disconnects */
  cleanup(deviceId: string): void {
    this.cancelCleanup(deviceId);
    const timer = setTimeout(() => {
      this.snapshots.delete(deviceId);
      this.cleanupTimers.delete(deviceId);
    }, this.maxAge);
    this.cleanupTimers.set(deviceId, timer);
  }

  cancelCleanup(deviceId: string): void {
    const timer = this.cleanupTimers.get(deviceId);
    if (timer) {
      clearTimeout(timer);
      this.cleanupTimers.delete(deviceId);
    }
  }
}
