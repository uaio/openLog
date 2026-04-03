import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateDeviceId, generateTabId, getDeviceInfo } from './device.js';
import type { PlatformAdapter } from '../platform/types.js';

// 创建测试用的 mock platform
function createMockPlatform(overrides?: Partial<PlatformAdapter['device']>): PlatformAdapter {
  return {
    storage: {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
    },
    device: {
      getUserAgent: () => 'Mozilla/5.0 Test Browser',
      getScreen: () => '1920x1080',
      getPixelRatio: () => 2,
      getLanguage: () => 'en-US',
      getUrl: () => 'https://example.com/test',
      ...overrides,
    },
    timer: {
      setTimeout: vi.fn().mockReturnValue(1),
      clearTimeout: vi.fn(),
      setInterval: vi.fn().mockReturnValue(1),
      clearInterval: vi.fn(),
    },
    createWebSocket: vi.fn() as any,
  };
}

describe('device', () => {
  let platform: PlatformAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    platform = createMockPlatform();
  });

  it('should generate consistent device ID for same inputs', () => {
    const id1 = generateDeviceId('test-app', platform);
    const id2 = generateDeviceId('test-app', platform);
    expect(id1).toBe(id2);
  });

  it('should generate different device IDs for different projects', () => {
    const id1 = generateDeviceId('app1', platform);
    const id2 = generateDeviceId('app2', platform);
    expect(id1).not.toBe(id2);
  });

  it('should generate unique tab IDs', () => {
    const id1 = generateTabId();
    const id2 = generateTabId();
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^tab-/);
  });

  it('should return correct device info', () => {
    const projectId = 'test-project';
    const info = getDeviceInfo(projectId, platform);

    expect(info.projectId).toBe(projectId);
    expect(info.ua).toBe('Mozilla/5.0 Test Browser');
    expect(info.screen).toBe('1920x1080');
    expect(info.pixelRatio).toBe(2);
    expect(info.language).toBe('en-US');
    expect(info.url).toBe('https://example.com/test');
  });
});
