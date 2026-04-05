import { API_BASE_URL } from '../config.js';
import { DeviceSelector } from '../lib/device-selector.js';

const deviceSelector = new DeviceSelector();

export const networkThrottle = {
  name: 'network_throttle',
  description: '设置手机端网络节流。可模拟 3G/2G/离线 网络环境，用于测试应用在弱网下的表现。',
  inputSchema: {
    type: 'object' as const,
    properties: {
      preset: { type: 'string' as const, enum: ['none', '3g', '2g', 'offline'], description: '节流预设' },
      deviceId: { type: 'string' as const, description: '设备 ID（可选）' }
    },
    required: ['preset']
  },
  async execute(args: { preset: string; deviceId?: string }): Promise<{ ok: boolean; preset: string }> {
    const id = await deviceSelector.selectDevice(args.deviceId);
    const res = await fetch(`${API_BASE_URL}/api/devices/${id}/network-throttle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preset: args.preset })
    });
    if (!res.ok) throw new Error(`network_throttle failed: ${res.statusText}`);
    return res.json();
  }
};
