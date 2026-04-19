export interface Device {
  deviceId: string;
  projectId: string;
  ua: string;
  screen: string;
  pixelRatio: number;
  language: string;
  connectTime: number;
  lastActiveTime: number;
  activeTabs: number;
  online: boolean;
}

export class DeviceStore {
  private devices: Map<string, Device> = new Map();
  private cleanupTimer?: NodeJS.Timeout;

  constructor() {
    // 每 1 分钟清理一次离线设备（更快响应）
    this.cleanupTimer = setInterval(
      () => {
        this.cleanup();
      },
      1 * 60 * 1000,
    );
  }

  register(deviceId: string, info: Omit<Device, 'deviceId' | 'online' | 'activeTabs'>): void {
    const existing = this.devices.get(deviceId);
    this.devices.set(deviceId, {
      ...info,
      deviceId,
      online: true,
      activeTabs: existing ? existing.activeTabs + 1 : 1,
    });
  }

  unregister(deviceId: string): void {
    const device = this.devices.get(deviceId);
    if (device) {
      device.activeTabs--;
      if (device.activeTabs <= 0) {
        device.online = false;
        device.lastActiveTime = Date.now();
      }
    }
  }

  get(deviceId: string): Device | undefined {
    return this.devices.get(deviceId);
  }

  list(projectId?: string): Device[] {
    const all = Array.from(this.devices.values());
    if (projectId) {
      return all.filter((d) => d.projectId === projectId);
    }
    return all;
  }

  updateActiveTime(deviceId: string): void {
    const device = this.devices.get(deviceId);
    if (device) {
      device.lastActiveTime = Date.now();
      device.online = true;
    }
  }

  // 清理 10 分钟未活跃的设备
  cleanup(): void {
    const threshold = Date.now() - 10 * 60 * 1000;
    const deletedIds: string[] = [];

    for (const [id, device] of this.devices.entries()) {
      if (!device.online && device.lastActiveTime < threshold) {
        deletedIds.push(id);
        this.devices.delete(id);
      }
    }

    // 记录删除的设备
    if (deletedIds.length > 0) {
      console.log(
        `[DeviceStore] 清理了 ${deletedIds.length} 个离线设备 (10分钟未活跃):`,
        deletedIds,
      );
    }
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }
}
