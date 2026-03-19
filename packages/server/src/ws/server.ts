import { WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer } from 'http';
import { DeviceStore, LogStore } from '../store/index.js';
import { handlers, type MessageContext, registerPCClient } from './handlers.js';

export function createWebSocketServer(httpServer: HTTPServer) {
  const deviceStore = new DeviceStore();
  const logStore = new LogStore();
  const deviceIds = new Map<WebSocket, string>();

  const wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws: WebSocket) => {
    let isViewer = false;

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === 'viewer') {
          isViewer = true;
          registerPCClient(ws);
          return;
        }

        if (!isViewer) {
          const handler = handlers[message.type];
          if (handler) {
            const context: MessageContext = {
              ws,
              deviceStore,
              logStore,
              deviceIds
            };
            handler(message, context);
          }
        }
      } catch (error) {
        console.error('Failed to handle message:', error);
      }
    });

    ws.on('close', () => {
      if (!isViewer) {
        const deviceId = deviceIds.get(ws);
        if (deviceId) {
          deviceStore.unregister(deviceId);
          // P0-1: 清理设备日志（延迟 30 分钟后删除）
          logStore.cleanup(deviceId);
          deviceIds.delete(ws);
        }
      }
    });
  });

  return { wss, deviceStore, logStore };
}

// P0-2: 导出清理函数，用于服务器关闭时清理资源
export function cleanupWebSocketServer(
  deviceStore: DeviceStore,
  logStore: LogStore,
  wss: WebSocketServer
): void {
  // 关闭 WebSocket 服务器
  wss.close((err) => {
    if (err) {
      console.error('Error closing WebSocket server:', err);
    }
  });

  // 清理设备存储
  deviceStore.destroy();

  // 清理所有日志
  // 注意：LogStore 没有 destroy 方法，因为它的定时器是在 cleanup 中管理的
  // 当所有设备断开连接后，定时器会自动清理
}
