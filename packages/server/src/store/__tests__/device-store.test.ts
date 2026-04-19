import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DeviceStore, type Device } from '../devices.js';

function makeDeviceInfo(
  overrides: Partial<Omit<Device, 'deviceId' | 'online' | 'activeTabs'>> = {},
) {
  return {
    projectId: 'proj-1',
    ua: 'Mozilla/5.0',
    screen: '1920x1080',
    pixelRatio: 2,
    language: 'en-US',
    connectTime: Date.now(),
    lastActiveTime: Date.now(),
    ...overrides,
  };
}

describe('DeviceStore', () => {
  let store: DeviceStore;

  beforeEach(() => {
    vi.useFakeTimers();
    store = new DeviceStore();
  });

  afterEach(() => {
    store.destroy();
    vi.useRealTimers();
  });

  it('register new device', () => {
    const info = makeDeviceInfo();
    store.register('d1', info);

    const device = store.get('d1');
    expect(device).toBeDefined();
    expect(device!.deviceId).toBe('d1');
    expect(device!.online).toBe(true);
    expect(device!.activeTabs).toBe(1);
    expect(device!.projectId).toBe('proj-1');
  });

  it('register same device increments activeTabs', () => {
    const info = makeDeviceInfo();
    store.register('d1', info);
    store.register('d1', info);
    store.register('d1', info);

    const device = store.get('d1');
    expect(device!.activeTabs).toBe(3);
    expect(device!.online).toBe(true);
  });

  it('unregister decrements activeTabs', () => {
    const info = makeDeviceInfo();
    store.register('d1', info);
    store.register('d1', info);
    expect(store.get('d1')!.activeTabs).toBe(2);

    store.unregister('d1');
    expect(store.get('d1')!.activeTabs).toBe(1);
    expect(store.get('d1')!.online).toBe(true);
  });

  it('unregister sets offline when activeTabs reaches 0', () => {
    store.register('d1', makeDeviceInfo());
    store.unregister('d1');

    const device = store.get('d1');
    expect(device!.activeTabs).toBe(0);
    expect(device!.online).toBe(false);
  });

  it('unregister unknown device is a no-op', () => {
    expect(() => store.unregister('nonexistent')).not.toThrow();
  });

  it('get returns undefined for unknown device', () => {
    expect(store.get('nonexistent')).toBeUndefined();
  });

  it('list all devices', () => {
    store.register('d1', makeDeviceInfo({ projectId: 'p1' }));
    store.register('d2', makeDeviceInfo({ projectId: 'p2' }));
    store.register('d3', makeDeviceInfo({ projectId: 'p1' }));

    const all = store.list();
    expect(all).toHaveLength(3);
  });

  it('list filtered by projectId', () => {
    store.register('d1', makeDeviceInfo({ projectId: 'p1' }));
    store.register('d2', makeDeviceInfo({ projectId: 'p2' }));
    store.register('d3', makeDeviceInfo({ projectId: 'p1' }));

    const p1Devices = store.list('p1');
    expect(p1Devices).toHaveLength(2);
    expect(p1Devices.every((d) => d.projectId === 'p1')).toBe(true);

    const p2Devices = store.list('p2');
    expect(p2Devices).toHaveLength(1);
    expect(p2Devices[0].deviceId).toBe('d2');
  });

  it('list with unknown projectId returns empty', () => {
    store.register('d1', makeDeviceInfo({ projectId: 'p1' }));
    expect(store.list('unknown')).toEqual([]);
  });

  it('updateActiveTime updates lastActiveTime and sets online=true', () => {
    store.register('d1', makeDeviceInfo());
    store.unregister('d1');
    expect(store.get('d1')!.online).toBe(false);

    const before = Date.now();
    vi.advanceTimersByTime(5000);
    store.updateActiveTime('d1');

    const device = store.get('d1')!;
    expect(device.online).toBe(true);
    expect(device.lastActiveTime).toBeGreaterThan(before);
  });

  it('updateActiveTime on unknown device is a no-op', () => {
    expect(() => store.updateActiveTime('nonexistent')).not.toThrow();
  });

  it('cleanup removes offline devices inactive for >10 minutes', () => {
    const now = Date.now();
    store.register('d1', makeDeviceInfo({ lastActiveTime: now }));
    store.unregister('d1'); // goes offline, lastActiveTime set to Date.now()

    // advance past 10 minute threshold
    vi.advanceTimersByTime(11 * 60 * 1000);

    store.cleanup();
    expect(store.get('d1')).toBeUndefined();
  });

  it('cleanup does NOT remove online devices', () => {
    store.register('d1', makeDeviceInfo({ lastActiveTime: Date.now() - 20 * 60 * 1000 }));
    // device is still online (activeTabs = 1)

    store.cleanup();
    expect(store.get('d1')).toBeDefined();
  });

  it('cleanup does NOT remove recently-offline devices', () => {
    store.register('d1', makeDeviceInfo());
    store.unregister('d1');
    // just went offline, within 10 min threshold

    store.cleanup();
    expect(store.get('d1')).toBeDefined();
  });

  it('automatic cleanup runs via interval timer', () => {
    store.register('d1', makeDeviceInfo());
    store.unregister('d1');

    // Advance past 10 min threshold + 1 min interval
    vi.advanceTimersByTime(11 * 60 * 1000);

    // The interval should have triggered cleanup
    expect(store.get('d1')).toBeUndefined();
  });

  it('destroy clears interval timer', () => {
    store.register('d1', makeDeviceInfo());
    store.unregister('d1');
    store.destroy();

    // Advance time — cleanup should NOT run since timer was cleared
    vi.advanceTimersByTime(20 * 60 * 1000);

    // Device still exists because interval was cleared
    expect(store.get('d1')).toBeDefined();
  });
});
