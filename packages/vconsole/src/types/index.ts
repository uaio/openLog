export interface DeviceInfo {
  deviceId: string;
  projectId: string;
  ua: string;
  screen: string;
  pixelRatio: number;
  language: string;
  url: string;
  connectTime: number;
  lastActiveTime: number;
}

export interface ConsoleLogEntry {
  deviceId: string;
  tabId: string;
  timestamp: number;
  level: 'log' | 'warn' | 'error' | 'info';
  message: string;
  stack?: string;
}

export interface RemoteConfig {
  projectId: string;
  server?: string;
}
