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

  update(deviceId: string, snapshot: ScreenshotSnapshot): void {
    this.snapshots.set(deviceId, snapshot);
  }

  get(deviceId: string): ScreenshotSnapshot | undefined {
    return this.snapshots.get(deviceId);
  }

  clear(deviceId: string): void {
    this.snapshots.delete(deviceId);
  }
}
