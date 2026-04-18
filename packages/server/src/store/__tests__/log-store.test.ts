import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LogStore, type ConsoleLog } from '../logs.js';

function makeLog(overrides: Partial<ConsoleLog> = {}): ConsoleLog {
  return {
    deviceId: 'device-1',
    tabId: 'tab-1',
    timestamp: Date.now(),
    level: 'log',
    message: 'hello',
    ...overrides,
  };
}

describe('LogStore', () => {
  let store: LogStore;

  beforeEach(() => {
    store = new LogStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('push and get basic logs', () => {
    const log = makeLog();
    store.push('d1', log);

    const result = store.get('d1');
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(log);
  });

  it('returns empty array for unknown device', () => {
    expect(store.get('nonexistent')).toEqual([]);
  });

  it('FIFO eviction at max 1000 logs', () => {
    for (let i = 0; i < 1005; i++) {
      store.push('d1', makeLog({ message: `msg-${i}` }));
    }

    const result = store.get('d1');
    expect(result).toHaveLength(1000);
    // oldest 5 should have been evicted
    expect(result[0].message).toBe('msg-5');
    expect(result[999].message).toBe('msg-1004');
  });

  it('get with level filter returns only matching level', () => {
    store.push('d1', makeLog({ level: 'log', message: 'a' }));
    store.push('d1', makeLog({ level: 'error', message: 'b' }));
    store.push('d1', makeLog({ level: 'warn', message: 'c' }));
    store.push('d1', makeLog({ level: 'error', message: 'd' }));

    const errors = store.get('d1', undefined, 'error');
    expect(errors).toHaveLength(2);
    expect(errors.every(l => l.level === 'error')).toBe(true);
  });

  it('get with level filter - warn only', () => {
    store.push('d1', makeLog({ level: 'warn', message: 'w1' }));
    store.push('d1', makeLog({ level: 'info', message: 'i1' }));
    store.push('d1', makeLog({ level: 'warn', message: 'w2' }));

    const warns = store.get('d1', undefined, 'warn');
    expect(warns).toHaveLength(2);
    expect(warns[0].message).toBe('w1');
    expect(warns[1].message).toBe('w2');
  });

  it('get with limit returns last N logs', () => {
    for (let i = 0; i < 10; i++) {
      store.push('d1', makeLog({ message: `msg-${i}` }));
    }

    const result = store.get('d1', 3);
    expect(result).toHaveLength(3);
    expect(result[0].message).toBe('msg-7');
    expect(result[2].message).toBe('msg-9');
  });

  it('get with limit AND level combined', () => {
    store.push('d1', makeLog({ level: 'error', message: 'e1' }));
    store.push('d1', makeLog({ level: 'log', message: 'l1' }));
    store.push('d1', makeLog({ level: 'error', message: 'e2' }));
    store.push('d1', makeLog({ level: 'error', message: 'e3' }));
    store.push('d1', makeLog({ level: 'log', message: 'l2' }));
    store.push('d1', makeLog({ level: 'error', message: 'e4' }));

    // filter to errors first (e1, e2, e3, e4), then take last 2
    const result = store.get('d1', 2, 'error');
    expect(result).toHaveLength(2);
    expect(result[0].message).toBe('e3');
    expect(result[1].message).toBe('e4');
  });

  it('clear removes all logs for device', () => {
    store.push('d1', makeLog());
    store.push('d1', makeLog());
    expect(store.get('d1')).toHaveLength(2);

    store.clear('d1');
    expect(store.get('d1')).toEqual([]);
  });

  it('per-device isolation', () => {
    store.push('d1', makeLog({ message: 'from-d1' }));
    store.push('d2', makeLog({ message: 'from-d2' }));

    const d1Logs = store.get('d1');
    const d2Logs = store.get('d2');
    expect(d1Logs).toHaveLength(1);
    expect(d1Logs[0].message).toBe('from-d1');
    expect(d2Logs).toHaveLength(1);
    expect(d2Logs[0].message).toBe('from-d2');
  });

  it('cleanup sets a 30-minute delayed deletion', () => {
    vi.useFakeTimers();

    store.push('d1', makeLog());
    expect(store.get('d1')).toHaveLength(1);

    store.cleanup('d1');

    // Not yet deleted
    vi.advanceTimersByTime(29 * 60 * 1000);
    expect(store.get('d1')).toHaveLength(1);

    // After 30 minutes, deleted
    vi.advanceTimersByTime(2 * 60 * 1000);
    expect(store.get('d1')).toEqual([]);
  });

  it('cancelCleanup prevents deletion', () => {
    vi.useFakeTimers();

    store.push('d1', makeLog());
    store.cleanup('d1');
    store.cancelCleanup('d1');

    vi.advanceTimersByTime(60 * 60 * 1000);
    expect(store.get('d1')).toHaveLength(1);
  });

  it('clear also cancels pending cleanup timer', () => {
    vi.useFakeTimers();

    store.push('d1', makeLog());
    store.cleanup('d1');
    store.clear('d1');

    // Re-add logs after clear
    store.push('d1', makeLog({ message: 'after-clear' }));

    // Advance past cleanup time — logs should still be there because timer was cancelled
    vi.advanceTimersByTime(60 * 60 * 1000);
    expect(store.get('d1')).toHaveLength(1);
    expect(store.get('d1')[0].message).toBe('after-clear');
  });

  it('cancelCleanup on device with no timer is a no-op', () => {
    expect(() => store.cancelCleanup('nonexistent')).not.toThrow();
  });
});
