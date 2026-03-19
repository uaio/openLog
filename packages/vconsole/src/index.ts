import { getDeviceInfo, generateTabId, updateDeviceActiveTime } from './core/device.js';
import { Reporter } from './transport/reporter.js';
import type { RemoteConfig } from './types/index.js';

export const version = '0.1.0';

export interface AIConsoleOptions extends RemoteConfig {
  defaultPlugins?: string[];
}

export class AIConsole {
  private reporter: Reporter;
  private deviceInfo: ReturnType<typeof getDeviceInfo>;
  private tabId: string;
  private projectId: string;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor(options: AIConsoleOptions) {
    if (!options.projectId) {
      throw new Error('projectId is required');
    }

    this.projectId = options.projectId;
    this.deviceInfo = getDeviceInfo(options.projectId);
    this.tabId = generateTabId();

    this.reporter = new Reporter(this.deviceInfo, this.tabId);

    // 检查用户是否之前关闭了远程监控
    const remoteDisabled = localStorage.getItem(`aiconsole_remote_${this.projectId}`) === 'false';
    if (!remoteDisabled) {
      this.reporter.connect(options.server);
    }

    // 拦截 console
    this.interceptConsole();

    // 定期更新活跃时间
    this.heartbeatInterval = setInterval(() => {
      updateDeviceActiveTime(this.projectId);
      this.reporter.updateDeviceInfo();
    }, 30000);
  }

  private interceptConsole(): void {
    const original = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info
    };

    const self = this;

    console.log = function (...args: any[]) {
      original.log.apply(console, args);
      self.reporter.reportConsole({
        timestamp: Date.now(),
        level: 'log',
        message: args.map(a => String(a)).join(' ')
      });
    };

    console.warn = function (...args: any[]) {
      original.warn.apply(console, args);
      self.reporter.reportConsole({
        timestamp: Date.now(),
        level: 'warn',
        message: args.map(a => String(a)).join(' ')
      });
    };

    console.error = function (...args: any[]) {
      original.error.apply(console, args);
      const message = args.map(a => String(a)).join(' ');
      self.reporter.reportConsole({
        timestamp: Date.now(),
        level: 'error',
        message,
        stack: new Error().stack
      });
    };

    console.info = function (...args: any[]) {
      original.info.apply(console, args);
      self.reporter.reportConsole({
        timestamp: Date.now(),
        level: 'info',
        message: args.map(a => String(a)).join(' ')
      });
    };
  }

  enableRemote(): void {
    this.reporter.enableRemote();
  }

  disableRemote(): void {
    this.reporter.disableRemote();
  }

  isRemoteEnabled(): boolean {
    return this.reporter.isRemoteEnabled();
  }

  destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.reporter.disconnect();
  }
}

// 默认导出
export default AIConsole;
