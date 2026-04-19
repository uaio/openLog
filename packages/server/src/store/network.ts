/** 网络请求记录 */
export interface NetworkRequest {
  deviceId: string;
  tabId: string;
  id: string;
  timestamp: number;
  method: string;
  url: string;
  status?: number;
  statusText?: string;
  requestHeaders?: Record<string, string>;
  requestBody?: string;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  duration?: number;
  type: 'xhr' | 'fetch';
  error?: string;
}

export interface NetworkQueryOptions {
  limit?: number;
  method?: string;
  urlPattern?: string;
  status?: number;
}

export class NetworkStore {
  private requests: Map<string, NetworkRequest[]> = new Map();
  private readonly maxRequestsPerDevice: number;
  private cleanupTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  constructor(maxRequestsPerDevice = 500) {
    this.maxRequestsPerDevice = maxRequestsPerDevice;
  }

  push(deviceId: string, request: NetworkRequest): void {
    if (!this.requests.has(deviceId)) {
      this.requests.set(deviceId, []);
    }

    const deviceRequests = this.requests.get(deviceId)!;

    // 取消之前的清理计时器
    const existingTimer = this.cleanupTimers.get(deviceId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.cleanupTimers.delete(deviceId);
    }

    // 添加新请求
    deviceRequests.push(request);

    // 限制数量（FIFO）
    if (deviceRequests.length > this.maxRequestsPerDevice) {
      deviceRequests.splice(0, deviceRequests.length - this.maxRequestsPerDevice);
    }
  }

  get(deviceId: string, options?: NetworkQueryOptions): NetworkRequest[] {
    let requests = this.requests.get(deviceId);

    if (!requests) {
      return [];
    }

    // 应用过滤
    if (options) {
      requests = requests.filter((req) => {
        if (options.method && req.method.toUpperCase() !== options.method.toUpperCase()) {
          return false;
        }
        if (options.status !== undefined && req.status !== options.status) {
          return false;
        }
        if (options.urlPattern) {
          try {
            const regex = new RegExp(options.urlPattern, 'i');
            if (!regex.test(req.url)) {
              return false;
            }
          } catch {
            // 忽略无效的正则表达式
          }
        }
        return true;
      });
    }

    // 应用限制
    if (options?.limit && options.limit > 0) {
      requests = requests.slice(-options.limit);
    }

    return requests;
  }

  clear(deviceId: string): void {
    this.requests.delete(deviceId);

    // 取消清理计时器
    const timer = this.cleanupTimers.get(deviceId);
    if (timer) {
      clearTimeout(timer);
      this.cleanupTimers.delete(deviceId);
    }
  }

  /** 设备断开后延迟清理 */
  cleanup(deviceId: string): void {
    // 30 分钟后清理
    const timer = setTimeout(
      () => {
        this.requests.delete(deviceId);
        this.cleanupTimers.delete(deviceId);
      },
      30 * 60 * 1000,
    );

    this.cleanupTimers.set(deviceId, timer);
  }

  /** 取消清理计时器（设备重新连接时调用） */
  cancelCleanup(deviceId: string): void {
    const timer = this.cleanupTimers.get(deviceId);
    if (timer) {
      clearTimeout(timer);
      this.cleanupTimers.delete(deviceId);
    }
  }

  /** 获取所有设备的请求总数 */
  getTotalCount(): number {
    let total = 0;
    for (const requests of this.requests.values()) {
      total += requests.length;
    }
    return total;
  }
}
