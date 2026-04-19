import { describe, it, expect, vi } from 'vitest';
import { DataBus } from './DataBus.js';

describe('DataBus', () => {
  it('should emit events to registered listeners', () => {
    const bus = new DataBus();
    const handler = vi.fn();
    bus.on('console', handler);

    const entry = { id: '1', level: 'log' as const, message: 'hello', timestamp: Date.now() };
    bus.emit('console', entry as any);

    expect(handler).toHaveBeenCalledWith(entry);
  });

  it('should support multiple listeners on same event', () => {
    const bus = new DataBus();
    const h1 = vi.fn();
    const h2 = vi.fn();
    bus.on('console', h1);
    bus.on('console', h2);

    bus.emit('console', { id: '1', level: 'log', message: 'x', timestamp: 0 } as any);

    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
  });

  it('should not call listeners for different events', () => {
    const bus = new DataBus();
    const handler = vi.fn();
    bus.on('network', handler);

    bus.emit('console', { id: '1', level: 'log', message: 'x', timestamp: 0 } as any);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should unsubscribe via returned function', () => {
    const bus = new DataBus();
    const handler = vi.fn();
    const unsub = bus.on('console', handler);

    unsub();
    bus.emit('console', { id: '1', level: 'log', message: 'x', timestamp: 0 } as any);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should unsubscribe via off()', () => {
    const bus = new DataBus();
    const handler = vi.fn();
    bus.on('console', handler);
    bus.off('console', handler);

    bus.emit('console', { id: '1', level: 'log', message: 'x', timestamp: 0 } as any);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should isolate listener errors (fault tolerance)', () => {
    const bus = new DataBus();
    const badHandler = vi.fn(() => {
      throw new Error('boom');
    });
    const goodHandler = vi.fn();
    bus.on('console', badHandler);
    bus.on('console', goodHandler);

    bus.emit('console', { id: '1', level: 'log', message: 'x', timestamp: 0 } as any);

    expect(badHandler).toHaveBeenCalled();
    expect(goodHandler).toHaveBeenCalled();
  });

  it('should clear all listeners', () => {
    const bus = new DataBus();
    const handler = vi.fn();
    bus.on('console', handler);
    bus.on('network', handler);
    bus.clear();

    bus.emit('console', { id: '1', level: 'log', message: 'x', timestamp: 0 } as any);
    bus.emit('network', {} as any);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle emit with no listeners gracefully', () => {
    const bus = new DataBus();
    expect(() => {
      bus.emit('console', { id: '1', level: 'log', message: 'x', timestamp: 0 } as any);
    }).not.toThrow();
  });
});
