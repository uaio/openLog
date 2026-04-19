export interface DOMNode {
  tag: string;
  id?: string;
  className?: string;
  attrs?: Record<string, string>;
  text?: string;
  children?: DOMNode[];
  childCount?: number;
}

export interface DOMSnapshot {
  deviceId: string;
  tabId: string;
  timestamp: number;
  url: string;
  title: string;
  dom: DOMNode;
}

export class DOMStore {
  private snapshots: Map<string, DOMSnapshot> = new Map();
  private cleanupTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  update(deviceId: string, snapshot: DOMSnapshot): void {
    const existingTimer = this.cleanupTimers.get(deviceId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.cleanupTimers.delete(deviceId);
    }
    this.snapshots.set(deviceId, snapshot);
  }

  get(deviceId: string): DOMSnapshot | undefined {
    return this.snapshots.get(deviceId);
  }

  cleanup(deviceId: string): void {
    const timer = setTimeout(
      () => {
        this.snapshots.delete(deviceId);
        this.cleanupTimers.delete(deviceId);
      },
      30 * 60 * 1000,
    );
    this.cleanupTimers.set(deviceId, timer);
  }

  clear(deviceId: string): void {
    this.snapshots.delete(deviceId);
    const timer = this.cleanupTimers.get(deviceId);
    if (timer) {
      clearTimeout(timer);
      this.cleanupTimers.delete(deviceId);
    }
  }
}
