import { API_BASE_URL } from '../config.js';
import { DeviceSelector } from '../lib/device-selector.js';

const deviceSelector = new DeviceSelector();

export const takeScreenshot = {
  name: 'take_screenshot',
  description: `对指定手机 H5 页面进行截图，返回 base64 图片 URL。
可用于：
  - 检查当前页面视觉状态
  - 发现 UI 异常或布局错误
  - 记录某一时刻的页面快照
截图会自动推送到 PC 端显示。`,

  inputSchema: {
    type: 'object' as const,
    properties: {
      deviceId: {
        type: 'string' as const,
        description: '设备 ID（可选，不填则自动选择最近活跃设备）'
      }
    },
    required: []
  },

  async execute(args: { deviceId?: string }): Promise<{ dataUrl: string; width: number; height: number; timestamp: number }> {
    const selectedDeviceId = await deviceSelector.selectDevice(args.deviceId);

    // trigger capture
    const triggerRes = await fetch(`${API_BASE_URL}/api/devices/${selectedDeviceId}/screenshot`, {
      method: 'POST',
    });
    if (!triggerRes.ok) {
      const err = await triggerRes.json().catch(() => ({ error: triggerRes.statusText }));
      throw new Error(`take_screenshot trigger failed: ${err.error || triggerRes.statusText}`);
    }

    // wait for device to capture and send back
    await new Promise(r => setTimeout(r, 3000));

    const getRes = await fetch(`${API_BASE_URL}/api/devices/${selectedDeviceId}/screenshot`);
    if (!getRes.ok) {
      throw new Error('Screenshot not yet available. Try again in a moment.');
    }
    return getRes.json();
  }
};
