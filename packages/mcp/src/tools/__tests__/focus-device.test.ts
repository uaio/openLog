import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Device } from '../../lib/device-selector.js';

function makeDevice(overrides: Partial<Device> = {}): Device {
  return {
    deviceId: 'dev-1',
    projectId: 'proj-1',
    ua: 'Mozilla/5.0',
    screen: '1920x1080',
    pixelRatio: 2,
    language: 'en-US',
    connectTime: 1000,
    lastActiveTime: 2000,
    activeTabs: 1,
    online: true,
    ...overrides,
  };
}

// Mock the shared singleton before importing focusDevice
const mockListDevices = vi.fn<() => Promise<Device[]>>();
const mockSetFocusedDevice = vi.fn<(id: string | null) => void>();

vi.mock('../../lib/device-selector.js', () => ({
  sharedDeviceSelector: {
    listDevices: (...args: unknown[]) => mockListDevices(...(args as [])),
    setFocusedDevice: (id: string | null) => mockSetFocusedDevice(id),
  },
}));

// Import after mocking
const { focusDevice } = await import('../../tools/focus_device.js');

describe('focusDevice tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('focuses a valid device', async () => {
    const device = makeDevice({ deviceId: 'phone-1', ua: 'iPhone/16', online: true });
    mockListDevices.mockResolvedValue([device]);

    const result = await focusDevice.execute({ deviceId: 'phone-1' });

    expect(mockSetFocusedDevice).toHaveBeenCalledWith('phone-1');
    expect(result.focused).toBe(true);
    expect(result.deviceId).toBe('phone-1');
    expect(result.message).toContain('phone-1');
  });

  it('throws when focusing a non-existent device', async () => {
    const device = makeDevice({ deviceId: 'phone-1', ua: 'iPhone/16', online: true });
    mockListDevices.mockResolvedValue([device]);

    await expect(focusDevice.execute({ deviceId: 'missing' })).rejects.toThrow('missing');
    expect(mockSetFocusedDevice).not.toHaveBeenCalled();
  });

  it('clears focus with empty string', async () => {
    const result = await focusDevice.execute({ deviceId: '' });

    expect(mockSetFocusedDevice).toHaveBeenCalledWith(null);
    expect(result.focused).toBe(false);
    expect(result.deviceId).toBeNull();
  });

  it('clears focus when no arg provided', async () => {
    const result = await focusDevice.execute({});

    expect(mockSetFocusedDevice).toHaveBeenCalledWith(null);
    expect(result.focused).toBe(false);
    expect(result.deviceId).toBeNull();
  });
});
