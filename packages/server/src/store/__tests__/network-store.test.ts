import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NetworkStore, type NetworkRequest } from '../network.js';

function makeRequest(overrides: Partial<NetworkRequest> = {}): NetworkRequest {
  return {
    deviceId: 'device-1',
    tabId: 'tab-1',
    id: `req-${Math.random().toString(36).slice(2)}`,
    timestamp: Date.now(),
    method: 'GET',
    url: 'https://api.example.com/data',
    type: 'fetch',
    ...overrides,
  };
}

describe('NetworkStore', () => {
  let store: NetworkStore;

  beforeEach(() => {
    store = new NetworkStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('push and get network requests', () => {
    const req = makeRequest();
    store.push('d1', req);

    const result = store.get('d1');
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(req);
  });

  it('returns empty array for unknown device', () => {
    expect(store.get('nonexistent')).toEqual([]);
  });

  it('FIFO eviction at default max 500', () => {
    for (let i = 0; i < 505; i++) {
      store.push('d1', makeRequest({ url: `https://api.example.com/${i}` }));
    }

    const result = store.get('d1');
    expect(result).toHaveLength(500);
    expect(result[0].url).toBe('https://api.example.com/5');
    expect(result[499].url).toBe('https://api.example.com/504');
  });

  it('custom max capacity via constructor', () => {
    const smallStore = new NetworkStore(3);

    smallStore.push('d1', makeRequest({ url: '/a' }));
    smallStore.push('d1', makeRequest({ url: '/b' }));
    smallStore.push('d1', makeRequest({ url: '/c' }));
    smallStore.push('d1', makeRequest({ url: '/d' }));

    const result = smallStore.get('d1');
    expect(result).toHaveLength(3);
    expect(result[0].url).toBe('/b');
    expect(result[2].url).toBe('/d');
  });

  it('get with method filter (case-insensitive)', () => {
    store.push('d1', makeRequest({ method: 'GET' }));
    store.push('d1', makeRequest({ method: 'POST' }));
    store.push('d1', makeRequest({ method: 'get' }));

    const result = store.get('d1', { method: 'get' });
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.method.toUpperCase() === 'GET')).toBe(true);
  });

  it('get with method filter - POST', () => {
    store.push('d1', makeRequest({ method: 'GET' }));
    store.push('d1', makeRequest({ method: 'POST' }));
    store.push('d1', makeRequest({ method: 'POST' }));

    const result = store.get('d1', { method: 'POST' });
    expect(result).toHaveLength(2);
  });

  it('get with status filter (exact match)', () => {
    store.push('d1', makeRequest({ status: 200 }));
    store.push('d1', makeRequest({ status: 404 }));
    store.push('d1', makeRequest({ status: 200 }));
    store.push('d1', makeRequest({ status: 500 }));

    const result = store.get('d1', { status: 200 });
    expect(result).toHaveLength(2);

    const notFound = store.get('d1', { status: 404 });
    expect(notFound).toHaveLength(1);
  });

  it('get with urlPattern regex filter', () => {
    store.push('d1', makeRequest({ url: 'https://api.example.com/users' }));
    store.push('d1', makeRequest({ url: 'https://api.example.com/posts' }));
    store.push('d1', makeRequest({ url: 'https://cdn.example.com/image.png' }));

    const result = store.get('d1', { urlPattern: '/users|/posts' });
    expect(result).toHaveLength(2);

    const images = store.get('d1', { urlPattern: '\\.png$' });
    expect(images).toHaveLength(1);
  });

  it('get with invalid regex does not throw, returns all', () => {
    store.push('d1', makeRequest({ url: '/a' }));
    store.push('d1', makeRequest({ url: '/b' }));

    // Invalid regex should be silently ignored
    const result = store.get('d1', { urlPattern: '[invalid(' });
    expect(result).toHaveLength(2);
  });

  it('get with limit returns last N', () => {
    for (let i = 0; i < 10; i++) {
      store.push('d1', makeRequest({ url: `/item/${i}` }));
    }

    const result = store.get('d1', { limit: 3 });
    expect(result).toHaveLength(3);
    expect(result[0].url).toBe('/item/7');
    expect(result[2].url).toBe('/item/9');
  });

  it('get with combined filters (method + status + limit)', () => {
    store.push('d1', makeRequest({ method: 'GET', status: 200 }));
    store.push('d1', makeRequest({ method: 'POST', status: 200 }));
    store.push('d1', makeRequest({ method: 'GET', status: 404 }));
    store.push('d1', makeRequest({ method: 'GET', status: 200, url: '/last' }));
    store.push('d1', makeRequest({ method: 'GET', status: 200, url: '/final' }));

    const result = store.get('d1', { method: 'GET', status: 200, limit: 1 });
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe('/final');
  });

  it('clear removes all requests and cancels timer', () => {
    vi.useFakeTimers();

    store.push('d1', makeRequest());
    store.cleanup('d1');
    store.clear('d1');

    expect(store.get('d1')).toEqual([]);

    // Re-add after clear
    store.push('d1', makeRequest({ url: '/after-clear' }));

    // Timer should have been cancelled, so data persists
    vi.advanceTimersByTime(60 * 60 * 1000);
    expect(store.get('d1')).toHaveLength(1);
    expect(store.get('d1')[0].url).toBe('/after-clear');
  });

  it('cleanup sets 30-minute delayed deletion', () => {
    vi.useFakeTimers();

    store.push('d1', makeRequest());
    store.cleanup('d1');

    // Not yet deleted
    vi.advanceTimersByTime(29 * 60 * 1000);
    expect(store.get('d1')).toHaveLength(1);

    // After 30 minutes
    vi.advanceTimersByTime(2 * 60 * 1000);
    expect(store.get('d1')).toEqual([]);
  });

  it('cancelCleanup prevents deletion', () => {
    vi.useFakeTimers();

    store.push('d1', makeRequest());
    store.cleanup('d1');
    store.cancelCleanup('d1');

    vi.advanceTimersByTime(60 * 60 * 1000);
    expect(store.get('d1')).toHaveLength(1);
  });

  it('cancelCleanup on device with no timer is a no-op', () => {
    expect(() => store.cancelCleanup('nonexistent')).not.toThrow();
  });

  it('getTotalCount counts all devices', () => {
    expect(store.getTotalCount()).toBe(0);

    store.push('d1', makeRequest());
    store.push('d1', makeRequest());
    store.push('d2', makeRequest());

    expect(store.getTotalCount()).toBe(3);
  });

  it('per-device isolation', () => {
    store.push('d1', makeRequest({ url: '/d1-only' }));
    store.push('d2', makeRequest({ url: '/d2-only' }));

    const d1 = store.get('d1');
    const d2 = store.get('d2');
    expect(d1).toHaveLength(1);
    expect(d1[0].url).toBe('/d1-only');
    expect(d2).toHaveLength(1);
    expect(d2[0].url).toBe('/d2-only');
  });

  it('push cancels existing cleanup timer for device', () => {
    vi.useFakeTimers();

    store.push('d1', makeRequest({ url: '/first' }));
    store.cleanup('d1');

    // Push again before timer fires — should cancel the cleanup
    vi.advanceTimersByTime(15 * 60 * 1000);
    store.push('d1', makeRequest({ url: '/second' }));

    // Advance past original 30 min mark
    vi.advanceTimersByTime(20 * 60 * 1000);
    expect(store.get('d1')).toHaveLength(2);
  });
});
