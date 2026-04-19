import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DeviceSelector, type Device } from '../device-selector.js';

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

function mockFetchDevices(devices: Device[]) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(devices),
    }),
  );
}

describe('DeviceSelector', () => {
  let selector: DeviceSelector;

  beforeEach(() => {
    selector = new DeviceSelector(30_000);
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ───────── setFocusedDevice / getFocusedDevice ─────────

  describe('setFocusedDevice / getFocusedDevice', () => {
    it('round-trips a device id', () => {
      selector.setFocusedDevice('abc');
      expect(selector.getFocusedDevice()).toBe('abc');
    });

    it('clears focus with null', () => {
      selector.setFocusedDevice('abc');
      selector.setFocusedDevice(null);
      expect(selector.getFocusedDevice()).toBeNull();
    });
  });

  // ───────── selectDevice with explicit deviceId ─────────

  describe('selectDevice with explicit deviceId', () => {
    it('returns deviceId when device exists', async () => {
      const devices = [makeDevice({ deviceId: 'dev-1' }), makeDevice({ deviceId: 'dev-2' })];
      mockFetchDevices(devices);

      const result = await selector.selectDevice('dev-2');
      expect(result).toBe('dev-2');
    });

    it('throws when device not found and lists available devices', async () => {
      const devices = [makeDevice({ deviceId: 'dev-1' }), makeDevice({ deviceId: 'dev-2' })];
      mockFetchDevices(devices);

      await expect(selector.selectDevice('missing')).rejects.toThrow('missing');
      await expect(selector.selectDevice('missing')).rejects.toThrow('dev-1');
    });
  });

  // ───────── selectDevice with focused device ─────────

  describe('selectDevice with focused device', () => {
    it('uses focused device when it is online', async () => {
      const devices = [
        makeDevice({ deviceId: 'focused', online: true, lastActiveTime: 100 }),
        makeDevice({ deviceId: 'other', online: true, lastActiveTime: 9999 }),
      ];
      mockFetchDevices(devices);

      selector.setFocusedDevice('focused');
      const result = await selector.selectDevice();
      expect(result).toBe('focused');
    });

    it('clears focus and falls back when focused device is offline', async () => {
      const devices = [
        makeDevice({ deviceId: 'focused', online: false, lastActiveTime: 100 }),
        makeDevice({ deviceId: 'other', online: true, lastActiveTime: 9999 }),
      ];
      mockFetchDevices(devices);

      selector.setFocusedDevice('focused');
      const result = await selector.selectDevice();

      expect(selector.getFocusedDevice()).toBeNull();
      expect(result).toBe('other');
    });

    it('clears focus when focused device no longer in list', async () => {
      const devices = [makeDevice({ deviceId: 'other', online: true })];
      mockFetchDevices(devices);

      selector.setFocusedDevice('gone');
      const result = await selector.selectDevice();

      expect(selector.getFocusedDevice()).toBeNull();
      expect(result).toBe('other');
    });
  });

  // ───────── selectDevice auto-selection ─────────

  describe('selectDevice auto-selection', () => {
    it('throws when no devices connected', async () => {
      mockFetchDevices([]);

      await expect(selector.selectDevice()).rejects.toThrow(/没有连接的设备/);
    });

    it('auto-selects when single device exists', async () => {
      mockFetchDevices([makeDevice({ deviceId: 'only-one' })]);

      expect(await selector.selectDevice()).toBe('only-one');
    });

    it('picks most-recently-active online device', async () => {
      const devices = [
        makeDevice({ deviceId: 'old-online', online: true, lastActiveTime: 100 }),
        makeDevice({ deviceId: 'new-online', online: true, lastActiveTime: 9999 }),
        makeDevice({ deviceId: 'new-offline', online: false, lastActiveTime: 99999 }),
      ];
      mockFetchDevices(devices);

      expect(await selector.selectDevice()).toBe('new-online');
    });

    it('picks most-recently-active device when all are offline', async () => {
      const devices = [
        makeDevice({ deviceId: 'old-offline', online: false, lastActiveTime: 100 }),
        makeDevice({ deviceId: 'new-offline', online: false, lastActiveTime: 9999 }),
      ];
      mockFetchDevices(devices);

      expect(await selector.selectDevice()).toBe('new-offline');
    });
  });

  // ───────── Cache behavior ─────────

  describe('cache behavior', () => {
    it('uses cached devices within TTL', async () => {
      const devices = [makeDevice({ deviceId: 'dev-1' })];
      mockFetchDevices(devices);

      await selector.listDevices();
      await selector.listDevices();

      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('re-fetches after TTL expires', async () => {
      const shortTTL = new DeviceSelector(0); // 0ms TTL — always stale
      const devices = [makeDevice({ deviceId: 'dev-1' })];
      mockFetchDevices(devices);

      await shortTTL.listDevices();
      await shortTTL.listDevices();

      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('forceRefresh bypasses cache', async () => {
      const devices = [makeDevice({ deviceId: 'dev-1' })];
      mockFetchDevices(devices);

      await selector.listDevices();
      await selector.listDevices(true);

      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('clearCache causes next call to fetch', async () => {
      const devices = [makeDevice({ deviceId: 'dev-1' })];
      mockFetchDevices(devices);

      await selector.listDevices();
      selector.clearCache();
      await selector.listDevices();

      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  // ───────── listDevices error handling ─────────

  describe('listDevices error handling', () => {
    it('throws on non-ok response', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

      await expect(selector.listDevices()).rejects.toThrow('500');
    });
  });

  // ───────── getDevice ─────────

  describe('getDevice', () => {
    it('returns device when found', async () => {
      const device = makeDevice({ deviceId: 'dev-1' });
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(device) }),
      );

      const result = await selector.getDevice('dev-1');
      expect(result).toEqual(device);
    });

    it('returns null on 404', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));

      expect(await selector.getDevice('missing')).toBeNull();
    });

    it('throws on other HTTP errors', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

      await expect(selector.getDevice('dev-1')).rejects.toThrow('500');
    });
  });
});
