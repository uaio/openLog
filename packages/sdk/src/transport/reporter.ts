import type { DeviceInfo, ConsoleLogEntry, NetworkRequestEntry, StorageSnapshot } from '../types/index.js';
import type { PlatformAdapter } from '../platform/types.js';
import { WebSocketTransport } from './websocket.js';
import { RateLimiter } from '../core/rate-limiter.js';

export class Reporter {
  private transport: WebSocketTransport | null = null;
  private deviceInfo: DeviceInfo;
  private tabId: string;
  private platform: PlatformAdapter;
  private remoteEnabled = true;
  private onRefreshStorageCallback: (() => void) | null = null;
  private rateLimiter = new RateLimiter(100);
  private serverUrl: string | undefined;

  constructor(deviceInfo: DeviceInfo, tabId: string, platform: PlatformAdapter) {
    this.deviceInfo = deviceInfo;
    this.tabId = tabId;
    this.platform = platform;
  }

  connect(serverUrl?: string): void {
    if (!this.remoteEnabled) return;

    this.serverUrl = serverUrl ?? this.serverUrl;

    this.transport = new WebSocketTransport(
      { projectId: this.deviceInfo.projectId, server: this.serverUrl },
      {
        onConnect: () => {
          this.sendRegisterMessage();
        },
        onMessage: (data) => {
          if (data.type === 'refresh_storage') {
            this.onRefreshStorageCallback?.();
          }
        }
      },
      this.platform
    );

    this.transport.connect();
  }

  onRefreshStorage(callback: () => void): void {
    this.onRefreshStorageCallback = callback;
  }

  disconnect(): void {
    this.transport?.disconnect();
  }

  enableRemote(): void {
    this.remoteEnabled = true;
    this.platform.storage.setItem(`aiconsole_remote_${this.deviceInfo.projectId}`, 'true');
    if (!this.transport || this.transport.getState() === 'disconnected') {
      this.connect();
    }
  }

  disableRemote(): void {
    this.remoteEnabled = false;
    this.platform.storage.setItem(`aiconsole_remote_${this.deviceInfo.projectId}`, 'false');
    this.transport?.disconnect();
  }

  isRemoteEnabled(): boolean {
    return this.remoteEnabled;
  }

  reportConsole(entry: Omit<ConsoleLogEntry, 'deviceId' | 'tabId'>): void {
    if (!this.remoteEnabled || !this.transport) return;

    if (!this.rateLimiter.check()) {
      return;
    }

    const logEntry: ConsoleLogEntry = {
      ...entry,
      deviceId: this.deviceInfo.deviceId,
      tabId: this.tabId
    };

    this.send({
      type: 'console',
      ...logEntry
    });
  }

  reportNetwork(entry: Omit<NetworkRequestEntry, 'deviceId' | 'tabId'>): void {
    if (!this.remoteEnabled || !this.transport) return;

    if (!this.rateLimiter.check()) {
      return;
    }

    const networkEntry: NetworkRequestEntry = {
      ...entry,
      deviceId: this.deviceInfo.deviceId,
      tabId: this.tabId
    };

    this.send({
      ...networkEntry,
      type: 'network'
    });
  }

  reportStorage(snapshot: Omit<StorageSnapshot, 'deviceId' | 'tabId'>): void {
    if (!this.remoteEnabled || !this.transport) return;

    const storageEntry: StorageSnapshot = {
      ...snapshot,
      deviceId: this.deviceInfo.deviceId,
      tabId: this.tabId
    };

    this.send({
      ...storageEntry,
      type: 'storage'
    });
  }

  updateDeviceInfo(): void {
    this.deviceInfo.lastActiveTime = Date.now();
    this.send({
      type: 'heartbeat',
      deviceId: this.deviceInfo.deviceId,
      timestamp: Date.now()
    });
  }

  private sendRegisterMessage(): void {
    this.send({
      type: 'register',
      projectId: this.deviceInfo.projectId,
      deviceId: this.deviceInfo.deviceId,
      deviceInfo: {
        ua: this.deviceInfo.ua,
        screen: this.deviceInfo.screen,
        pixelRatio: this.deviceInfo.pixelRatio,
        language: this.deviceInfo.language
      }
    });
  }

  private send(data: any): void {
    this.transport?.send(JSON.stringify(data));
  }
}
