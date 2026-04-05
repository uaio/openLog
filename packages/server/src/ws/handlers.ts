import { WebSocket } from 'ws';
import { DeviceStore, LogStore, NetworkStore, StorageStore, DOMStore, PerformanceStore, ScreenshotStore, PerfRunStore } from '../store/index.js';

export interface MessageContext {
  ws: WebSocket;
  deviceStore: DeviceStore;
  logStore: LogStore;
  networkStore: NetworkStore;
  storageStore: StorageStore;
  domStore: DOMStore;
  performanceStore: PerformanceStore;
  screenshotStore: ScreenshotStore;
  perfRunStore: PerfRunStore;
  deviceIds: Map<WebSocket, string>;
}

export type MessageHandler = (data: any, context: MessageContext) => void | Promise<void>;

export const handlers: Record<string, MessageHandler> = {
  register: (data, context) => {
    const { ws, deviceStore, deviceIds } = context;
    const { projectId, deviceId, deviceInfo } = data;

    if (!deviceId) {
      console.error('Missing deviceId in register message');
      return;
    }

    // 输入验证
    if (!deviceInfo || typeof deviceInfo !== 'object') {
      console.error('Missing or invalid deviceInfo in register message');
      return;
    }

    const validatedDeviceInfo = {
      ua: String(deviceInfo.ua || ''),
      screen: String(deviceInfo.screen || ''),
      pixelRatio: Number(deviceInfo.pixelRatio) || 1,
      language: String(deviceInfo.language || '')
    };

    deviceStore.register(deviceId, {
      projectId,
      ...validatedDeviceInfo,
      connectTime: Date.now(),
      lastActiveTime: Date.now()
    });

    deviceIds.set(ws, deviceId);
    registerDeviceClient(ws, deviceId);
    broadcastDeviceList(context);
  },

  console: (data, context) => {
    console.log('[Server] 收到 console 消息:', data);
    const { logStore } = context;
    logStore.push(data.deviceId, data);
    broadcastLog(data, context);
  },

  heartbeat: (data, context) => {
    const { deviceStore, deviceIds } = context;
    const deviceId = deviceIds.get(context.ws);
    if (deviceId) {
      deviceStore.updateActiveTime(deviceId);
    }
  },

  network: (data, context) => {
    const { networkStore } = context;
    networkStore.push(data.deviceId, data);
    broadcastNetwork(data, context);
  },

  storage: (data, context) => {
    const { storageStore } = context;
    storageStore.update(data.deviceId, data);
    broadcastStorage(data, context);
  },

  dom: (data, context) => {
    const { domStore } = context;
    domStore.update(data.deviceId, data);
    broadcastDOM(data, context);
  },

  performance: (data, context) => {
    const { performanceStore } = context;
    performanceStore.update(data.deviceId, data);
    broadcastPerformance(data, context);
  },

  screenshot: (data, context) => {
    const { screenshotStore } = context;
    screenshotStore.update(data.deviceId, data);
    broadcastScreenshot(data, context);
  },

  perf_run: (data, context) => {
    const { perfRunStore } = context;
    perfRunStore.add(data);
    broadcastPerfRun(data, context);
  },
};

const pcClients = new Set<WebSocket>();
const deviceClients = new Map<WebSocket, string>();

export function registerDeviceClient(ws: WebSocket, deviceId: string): void {
  deviceClients.set(ws, deviceId);
  ws.on('close', () => deviceClients.delete(ws));
}

function broadcastDeviceList(context: MessageContext): void {
  const devices = context.deviceStore.list();
  const message = JSON.stringify({ type: 'devices', data: devices });

  for (const client of pcClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

function broadcastLog(log: any, context: MessageContext): void {
  const message = JSON.stringify({ type: 'log', data: log });
  console.log(`[Server] 广播日志到 ${pcClients.size} 个 PC 客户端`);

  for (const client of pcClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

function broadcastNetwork(request: any, context: MessageContext): void {
  const message = JSON.stringify({ type: 'network', data: request });

  for (const client of pcClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

function broadcastStorage(snapshot: any, context: MessageContext): void {
  const message = JSON.stringify({ type: 'storage', data: snapshot });

  for (const client of pcClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

function broadcastDOM(snapshot: any, context: MessageContext): void {
  const message = JSON.stringify({ type: 'dom', data: snapshot });

  for (const client of pcClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

function broadcastPerformance(report: any, _context: MessageContext): void {
  const message = JSON.stringify({ type: 'performance', data: report });

  for (const client of pcClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

function broadcastScreenshot(data: any, _context: MessageContext): void {
  const message = JSON.stringify({ type: 'screenshot', data });

  for (const client of pcClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

function broadcastPerfRun(data: any, _context: MessageContext): void {
  const message = JSON.stringify({ type: 'perf_run', data });
  for (const client of pcClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

export function sendToDevice(deviceId: string, message: any): void {
  const msg = JSON.stringify(message);
  for (const [client, id] of deviceClients) {
    if (id === deviceId && client.readyState === WebSocket.OPEN) {
      client.send(msg);
      return;
    }
  }
}

export function registerPCClient(ws: WebSocket): void {
  console.log('[Server] 注册 PC 客户端，当前总数:', pcClients.size + 1);
  pcClients.add(ws);
  ws.on('close', () => {
    console.log('[Server] PC 客户端断开，剩余:', pcClients.size - 1);
    pcClients.delete(ws);
  });
}

// 定期清理无效的 PC 客户端连接（每 5 分钟）
setInterval(() => {
  for (const client of pcClients) {
    if (client.readyState !== WebSocket.OPEN) {
      pcClients.delete(client);
    }
  }
}, 5 * 60 * 1000);
