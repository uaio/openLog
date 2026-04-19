import type {
  Device,
  ConsoleLog,
  StorageSnapshot,
  DOMSnapshot,
  PerformanceReport,
} from '../types/index.js';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:38291/api';

interface ApiError {
  message: string;
  status?: number;
  url?: string;
}

class ApiClientError extends Error implements ApiError {
  status?: number;
  url?: string;

  constructor(message: string, status?: number, url?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.url = url;
  }
}

async function handleResponse(res: Response, url: string): Promise<any> {
  if (!res.ok) {
    let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const contentType = res.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const errorData = await res.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      }
    } catch {
      // 如果无法解析错误响应，使用默认消息
    }
    throw new ApiClientError(errorMessage, res.status, url);
  }

  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return res.json();
  }
  return res.text();
}

export const api = {
  async listDevices(projectId?: string): Promise<Device[]> {
    const url = projectId ? `${API_BASE}/devices?projectId=${projectId}` : `${API_BASE}/devices`;
    const res = await fetch(url);
    return handleResponse(res, url);
  },

  async getLogs(deviceId: string, limit?: number, level?: string): Promise<ConsoleLog[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (level) params.append('level', level);

    const url = `${API_BASE}/devices/${deviceId}/logs?${params}`;
    const res = await fetch(url);
    return handleResponse(res, url);
  },

  async getDevice(deviceId: string): Promise<Device> {
    const url = `${API_BASE}/devices/${deviceId}`;
    const res = await fetch(url);
    return handleResponse(res, url);
  },

  async deleteLogs(deviceId: string): Promise<{ success: boolean; count: number }> {
    const url = `${API_BASE}/devices/${deviceId}/logs`;
    const res = await fetch(url, {
      method: 'DELETE',
    });
    return handleResponse(res, url);
  },

  async getStorage(deviceId: string): Promise<StorageSnapshot | null> {
    const url = `${API_BASE}/devices/${deviceId}/storage`;
    const res = await fetch(url);
    if (res.status === 404) return null;
    return handleResponse(res, url);
  },

  async getNetworkRequests(deviceId: string, limit?: number): Promise<any[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    const url = `${API_BASE}/devices/${deviceId}/network?${params}`;
    const res = await fetch(url);
    return handleResponse(res, url);
  },

  async getDOM(deviceId: string): Promise<DOMSnapshot | null> {
    const url = `${API_BASE}/devices/${deviceId}/dom`;
    const res = await fetch(url);
    if (res.status === 404) return null;
    return handleResponse(res, url);
  },

  async getPerformance(deviceId: string): Promise<PerformanceReport | null> {
    const url = `${API_BASE}/devices/${deviceId}/performance`;
    const res = await fetch(url);
    if (res.status === 404) return null;
    return handleResponse(res, url);
  },

  async get(path: string): Promise<any> {
    const url = path.startsWith('http') ? path : `${API_BASE.replace('/api', '')}${path}`;
    const res = await fetch(url);
    return handleResponse(res, url);
  },

  async post(path: string, body?: any): Promise<any> {
    const url = path.startsWith('http') ? path : `${API_BASE.replace('/api', '')}${path}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse(res, url);
  },

  async delete(path: string): Promise<any> {
    const url = path.startsWith('http') ? path : `${API_BASE.replace('/api', '')}${path}`;
    const res = await fetch(url, { method: 'DELETE' });
    return handleResponse(res, url);
  },
};

export { ApiClientError };
