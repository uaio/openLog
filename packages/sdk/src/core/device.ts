import type { DeviceInfo } from '../types/index.js';
import type { PlatformAdapter } from '../platform/types.js';
import { hashString } from './utils/hash.js';
import { generateTabId } from './utils/id.js';

export { generateTabId };

/** 生成设备 ID */
export function generateDeviceId(projectId: string, platform: PlatformAdapter): string {
  const urlPart = platform.device.getUrl();
  const ua = platform.device.getUserAgent();
  return hashString(urlPart + ua + projectId);
}

/** 获取设备信息 */
export function getDeviceInfo(projectId: string, platform: PlatformAdapter): DeviceInfo {
  const deviceId = generateDeviceId(projectId, platform);

  const cachedId = platform.storage.getItem(`openlog_device_id_${projectId}`);
  const isNew = !cachedId || cachedId !== deviceId;

  if (isNew) {
    platform.storage.setItem(`openlog_device_id_${projectId}`, deviceId);
  }

  return {
    deviceId,
    projectId,
    ua: platform.device.getUserAgent(),
    screen: platform.device.getScreen(),
    pixelRatio: platform.device.getPixelRatio(),
    language: platform.device.getLanguage(),
    url: platform.device.getUrl(),
    connectTime: isNew
      ? Date.now()
      : parseInt(platform.storage.getItem(`openlog_connect_time_${projectId}`) || '0'),
    lastActiveTime: Date.now(),
  };
}

/** 更新设备活跃时间 */
export function updateDeviceActiveTime(projectId: string, platform: PlatformAdapter): void {
  platform.storage.setItem(`openlog_last_active_${projectId}`, Date.now().toString());
}
