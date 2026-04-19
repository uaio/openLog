import { Request, Response } from 'express';
import {
  DeviceStore,
  LogStore,
  NetworkStore,
  StorageStore,
  DOMStore,
  PerformanceStore,
  ScreenshotStore,
  PerfRunStore,
  MockStore,
} from '../store/index.js';
import { sendToDevice } from '../ws/handlers.js';

export function createDeviceRoutes(
  deviceStore: DeviceStore,
  logStore: LogStore,
  networkStore: NetworkStore,
  storageStore: StorageStore,
  domStore: DOMStore,
  performanceStore: PerformanceStore,
  screenshotStore: ScreenshotStore,
  perfRunStore: PerfRunStore,
  mockStore: MockStore,
) {
  return {
    listDevices: (req: Request, res: Response) => {
      const projectId = req.query.projectId as string;
      const devices = deviceStore.list(projectId);
      res.json(devices);
    },

    getLogs: (req: Request, res: Response) => {
      const { deviceId } = req.params;

      // 验证并处理 limit 参数
      const MAX_LOGS_LIMIT = 1000;
      let limit: number | undefined;
      if (req.query.limit) {
        const parsedLimit = parseInt(req.query.limit as string, 10);
        // 检查是否为有效数字且在合理范围内
        if (!isNaN(parsedLimit) && parsedLimit > 0) {
          limit = Math.min(parsedLimit, MAX_LOGS_LIMIT);
        }
        // 如果 limit 无效，默认使用 undefined（返回所有日志）
      }

      // 验证 level 参数（白名单检查）
      const validLevels = ['log', 'warn', 'error', 'info'];
      const level = req.query.level as string;
      const validatedLevel =
        level && validLevels.includes(level)
          ? (level as 'log' | 'warn' | 'error' | 'info')
          : undefined;

      const logs = logStore.get(deviceId, limit, validatedLevel);

      // 如果设备不存在，返回空数组（保持一致性）
      if (!logs) {
        return res.status(404).json({ error: 'Device not found' });
      }

      res.json(logs);
    },

    getDevice: (req: Request, res: Response) => {
      const { deviceId } = req.params;
      const device = deviceStore.get(deviceId);

      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }

      res.json(device);
    },

    deleteLogs: (req: Request, res: Response) => {
      const { deviceId } = req.params;

      console.log(`[Server] 收到删除日志请求，设备 ID: ${deviceId}`);

      // 检查设备是否存在
      const device = deviceStore.get(deviceId);
      if (!device) {
        console.log(`[Server] 设备不存在: ${deviceId}`);
        return res.status(404).json({ error: 'Device not found' });
      }

      // 获取删除前的日志数量
      const logsBefore = logStore.get(deviceId);
      const count = logsBefore ? logsBefore.length : 0;

      console.log(`[Server] 准备删除 ${count} 条日志`);

      // 清除日志
      logStore.clear(deviceId);

      console.log(`[Server] 已清除设备 ${deviceId} 的 ${count} 条日志`);

      res.json({
        success: true,
        count,
      });
    },

    getNetworkRequests: (req: Request, res: Response) => {
      const { deviceId } = req.params;

      // 验证并处理 limit 参数
      const MAX_LIMIT = 500;
      let limit: number | undefined;
      if (req.query.limit) {
        const parsedLimit = parseInt(req.query.limit as string, 10);
        if (!isNaN(parsedLimit) && parsedLimit > 0) {
          limit = Math.min(parsedLimit, MAX_LIMIT);
        }
      }

      // 获取过滤参数
      const method = req.query.method as string | undefined;
      const urlPattern = req.query.urlPattern as string | undefined;
      const statusStr = req.query.status as string | undefined;
      let status: number | undefined;
      if (statusStr) {
        const parsedStatus = parseInt(statusStr, 10);
        if (!isNaN(parsedStatus)) {
          status = parsedStatus;
        }
      }

      const requests = networkStore.get(deviceId, { limit, method, urlPattern, status });
      res.json(requests);
    },

    getStorage: (req: Request, res: Response) => {
      const { deviceId } = req.params;
      const snapshot = storageStore.get(deviceId);

      if (!snapshot) {
        return res.status(404).json({ error: 'No storage data available for this device' });
      }

      res.json(snapshot);
    },

    getDOM: (req: Request, res: Response) => {
      const { deviceId } = req.params;
      const snapshot = domStore.get(deviceId);

      if (!snapshot) {
        return res.status(404).json({ error: 'No DOM snapshot available for this device' });
      }

      res.json(snapshot);
    },

    getPerformance: (req: Request, res: Response) => {
      const { deviceId } = req.params;
      const report = performanceStore.get(deviceId);

      if (!report) {
        return res.status(404).json({ error: 'No performance data available for this device' });
      }

      res.json(report);
    },

    executeJs: (req: Request, res: Response) => {
      const { deviceId } = req.params;
      const { code } = req.body as { code?: string };

      if (!code || typeof code !== 'string' || !code.trim()) {
        return res.status(400).json({ error: 'code is required' });
      }

      const device = deviceStore.get(deviceId);
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }

      sendToDevice(deviceId, { type: 'execute_js', code });
      res.json({ ok: true, message: 'Command sent. Results will appear in console logs.' });
    },

    takeScreenshot: (req: Request, res: Response) => {
      const { deviceId } = req.params;
      const device = deviceStore.get(deviceId);
      if (!device) return res.status(404).json({ error: 'Device not found' });
      sendToDevice(deviceId, { type: 'take_screenshot' });
      res.json({ ok: true });
    },

    getScreenshot: (req: Request, res: Response) => {
      const { deviceId } = req.params;
      const snapshot = screenshotStore.get(deviceId);
      if (!snapshot)
        return res.status(404).json({ error: 'No screenshot available for this device' });
      res.json(snapshot);
    },

    reloadPage: (req: Request, res: Response) => {
      const { deviceId } = req.params;
      const device = deviceStore.get(deviceId);
      if (!device) return res.status(404).json({ error: 'Device not found' });
      sendToDevice(deviceId, { type: 'reload_page' });
      res.json({ ok: true });
    },

    setStorage: (req: Request, res: Response) => {
      const { deviceId } = req.params;
      const { key, value, storageType } = req.body as {
        key?: string;
        value?: string;
        storageType?: string;
      };
      if (!key) return res.status(400).json({ error: 'key is required' });
      const device = deviceStore.get(deviceId);
      if (!device) return res.status(404).json({ error: 'Device not found' });
      sendToDevice(deviceId, {
        type: 'set_storage',
        key,
        value: value ?? '',
        storageType: storageType || 'local',
      });
      res.json({ ok: true });
    },

    clearStorage: (req: Request, res: Response) => {
      const { deviceId } = req.params;
      const { storageType } = req.body as { storageType?: string };
      const device = deviceStore.get(deviceId);
      if (!device) return res.status(404).json({ error: 'Device not found' });
      sendToDevice(deviceId, { type: 'clear_storage', storageType: storageType || 'all' });
      res.json({ ok: true });
    },

    highlightElement: (req: Request, res: Response) => {
      const { deviceId } = req.params;
      const { selector, duration } = req.body as { selector?: string; duration?: number };
      if (!selector) return res.status(400).json({ error: 'selector is required' });
      const device = deviceStore.get(deviceId);
      if (!device) return res.status(404).json({ error: 'Device not found' });
      sendToDevice(deviceId, { type: 'highlight_element', selector, duration: duration ?? 3000 });
      res.json({ ok: true });
    },

    setZenMode: (req: Request, res: Response) => {
      const { deviceId } = req.params;
      const { enabled } = req.body as { enabled?: boolean };
      const device = deviceStore.get(deviceId);
      if (!device) return res.status(404).json({ error: 'Device not found' });
      sendToDevice(deviceId, { type: 'zen_mode', enabled: !!enabled });
      res.json({ ok: true, zenMode: !!enabled });
    },

    startPerfRun: (req: Request, res: Response) => {
      const { deviceId } = req.params;
      const device = deviceStore.get(deviceId);
      if (!device) return res.status(404).json({ error: 'Device not found' });
      sendToDevice(deviceId, { type: 'start_perf_run' });
      res.json({ ok: true });
    },

    stopPerfRun: (req: Request, res: Response) => {
      const { deviceId } = req.params;
      const device = deviceStore.get(deviceId);
      if (!device) return res.status(404).json({ error: 'Device not found' });
      sendToDevice(deviceId, { type: 'stop_perf_run' });
      res.json({ ok: true });
    },

    listPerfRunSessions: (req: Request, res: Response) => {
      const { deviceId } = req.params;
      res.json(perfRunStore.getAll(deviceId));
    },

    getPerfRunSession: (req: Request, res: Response) => {
      const { deviceId, sessionId } = req.params;
      const session = perfRunStore.get(deviceId, sessionId);
      if (!session) return res.status(404).json({ error: 'Session not found' });
      res.json(session);
    },

    setNetworkThrottle: (req: Request, res: Response) => {
      const { deviceId } = req.params;
      const { preset } = req.body as { preset?: string };
      if (!preset) return res.status(400).json({ error: 'preset is required' });
      const device = deviceStore.get(deviceId);
      if (!device) return res.status(404).json({ error: 'Device not found' });
      sendToDevice(deviceId, { type: 'set_network_throttle', preset });
      res.json({ ok: true, preset });
    },

    listMocks: (req: Request, res: Response) => {
      const { deviceId } = req.params;
      const device = deviceStore.get(deviceId);
      if (!device) return res.status(404).json({ error: 'Device not found' });
      res.json(mockStore.list(deviceId));
    },

    addMock: (req: Request, res: Response) => {
      const { deviceId } = req.params;
      const device = deviceStore.get(deviceId);
      if (!device) return res.status(404).json({ error: 'Device not found' });
      const rule = req.body;
      if (!rule?.pattern) return res.status(400).json({ error: 'pattern is required' });
      const stored = mockStore.add(deviceId, rule);
      sendToDevice(deviceId, { type: 'add_mock', rule: { ...rule, id: stored.id } });
      res.json({ ok: true, rule: stored });
    },

    removeMock: (req: Request, res: Response) => {
      const { deviceId } = req.params;
      const { mockId } = req.params;
      const device = deviceStore.get(deviceId);
      if (!device) return res.status(404).json({ error: 'Device not found' });
      mockStore.remove(deviceId, mockId);
      sendToDevice(deviceId, { type: 'remove_mock', id: mockId });
      res.json({ ok: true });
    },

    clearMocks: (req: Request, res: Response) => {
      const { deviceId } = req.params;
      const device = deviceStore.get(deviceId);
      if (!device) return res.status(404).json({ error: 'Device not found' });
      mockStore.clear(deviceId);
      sendToDevice(deviceId, { type: 'clear_mocks' });
      res.json({ ok: true });
    },

    getHealthCheck: (req: Request, res: Response) => {
      const { deviceId } = req.params;
      const device = deviceStore.get(deviceId);
      if (!device) return res.status(404).json({ error: 'Device not found' });

      const logs = logStore.get(deviceId) ?? [];
      const now = Date.now();
      const fiveMinAgo = now - 5 * 60 * 1000;
      const recentErrors = logs.filter(
        (l: any) => l.level === 'error' && l.timestamp > fiveMinAgo,
      ).length;

      const perfReport = performanceStore.get(deviceId);
      const longTaskDuration =
        (perfReport as any)?.longTasks?.reduce((s: number, t: any) => s + t.duration, 0) ?? 0;
      const latestSample = (perfReport as any)?.samples?.[(perfReport as any)?.samples?.length - 1];
      const memoryMB = latestSample?.heapUsed ?? null;

      const resources = (perfReport as any)?.resources ?? [];
      const uncompressedResources = resources.filter((r: any) => r.transferSize > 102400).length;
      const uncachedResources = resources.filter((r: any) => r.transferSize > 0).length;

      const vitals = (perfReport as any)?.vitals ?? [];
      const vitalRatings = vitals.reduce((acc: Record<string, string>, v: any) => {
        acc[v.name] = v.rating;
        return acc;
      }, {});

      const score = Math.max(
        0,
        100 - recentErrors * 5 - Math.min(50, longTaskDuration / 100) - uncompressedResources * 3,
      );

      res.json({
        deviceId,
        timestamp: now,
        score: Math.round(score),
        recentErrors,
        longTaskDurationMs: Math.round(longTaskDuration),
        memoryMB,
        uncompressedResources,
        uncachedResources,
        vitalRatings,
        status: score >= 80 ? 'healthy' : score >= 50 ? 'warning' : 'critical',
      });
    },
  };
}
