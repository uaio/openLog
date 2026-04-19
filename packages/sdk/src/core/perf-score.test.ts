import { describe, it, expect } from 'vitest';
import { scorePerfRun } from './perf-score.js';

function makeSnapshot(overrides: Partial<{
  vitals: Array<{ name: string; value: number; rating: string }>;
  longTasks: Array<{ startTime: number; duration: number }>;
  resources: Array<{ name: string; duration: number; size: number; type: string }>;
  samples: Array<{ timestamp: number; fps: number; memory: number | null }>;
}> = {}) {
  return {
    vitals: overrides.vitals ?? [],
    longTasks: overrides.longTasks ?? [],
    resources: overrides.resources ?? [],
    samples: overrides.samples ?? [],
    timestamp: Date.now(),
  } as any;
}

describe('scorePerfRun', () => {
  it('should return perfect score for empty snapshot', () => {
    const result = scorePerfRun(makeSnapshot());
    expect(result.total).toBe(100);
    expect(result.grade).toBe('A');
    expect(result.issues).toEqual([]);
  });

  it('should degrade score for high LCP', () => {
    const result = scorePerfRun(makeSnapshot({
      vitals: [{ name: 'LCP', value: 5000, rating: 'poor' }],
    }));
    expect(result.total).toBeLessThan(100);
    const lcpItem = result.items.find(i => i.name === 'LCP');
    expect(lcpItem!.score).toBeLessThan(50);
  });

  it('should degrade score for high CLS', () => {
    const result = scorePerfRun(makeSnapshot({
      vitals: [{ name: 'CLS', value: 0.4, rating: 'poor' }],
    }));
    const clsItem = result.items.find(i => i.name === 'CLS');
    expect(clsItem!.score).toBeLessThan(50);
  });

  it('should degrade score for low FPS', () => {
    const samples = Array.from({ length: 10 }, (_, i) => ({
      timestamp: Date.now() + i * 1000,
      fps: 20,
      memory: null,
    }));
    const result = scorePerfRun(makeSnapshot({ samples }));
    const fpsItem = result.items.find(i => i.name === 'FPS');
    expect(fpsItem!.score).toBeLessThan(75);
    expect(fpsItem!.rating).not.toBe('good');
  });

  it('should penalize many long tasks', () => {
    const longTasks = Array.from({ length: 15 }, (_, i) => ({
      startTime: i * 100,
      duration: 100,
    }));
    const result = scorePerfRun(makeSnapshot({ longTasks }));
    const ltItem = result.items.find(i => i.name === 'LongTasks');
    expect(ltItem!.score).toBeLessThanOrEqual(25);
    expect(ltItem!.rating).toBe('poor');
  });

  it('should give good rating for fast resources', () => {
    const resources = [
      { name: 'script.js', duration: 100, size: 5000, type: 'script' },
      { name: 'style.css', duration: 80, size: 3000, type: 'stylesheet' },
    ];
    const result = scorePerfRun(makeSnapshot({ resources }));
    const resItem = result.items.find(i => i.name === 'Resources');
    expect(resItem!.score).toBe(100);
    expect(resItem!.rating).toBe('good');
  });

  it('should return correct grade boundaries', () => {
    // Perfect => A
    expect(scorePerfRun(makeSnapshot()).grade).toBe('A');

    // Bad FPS + several issues => lower grade
    const badSamples = Array.from({ length: 10 }, (_, i) => ({
      timestamp: i * 1000,
      fps: 5,
      memory: null,
    }));
    const result = scorePerfRun(makeSnapshot({
      samples: badSamples,
      vitals: [
        { name: 'LCP', value: 10000, rating: 'poor' },
        { name: 'CLS', value: 0.5, rating: 'poor' },
        { name: 'FCP', value: 8000, rating: 'poor' },
        { name: 'TTFB', value: 5000, rating: 'poor' },
        { name: 'INP', value: 1000, rating: 'poor' },
      ],
      longTasks: Array.from({ length: 20 }, (_, i) => ({ startTime: i * 50, duration: 100 })),
      resources: Array.from({ length: 5 }, (_, i) => ({
        name: `r${i}.js`,
        duration: 2000,
        size: 10000,
        type: 'script',
      })),
    }));
    expect(result.grade).toBe('F');
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it('should populate issues for poor metrics', () => {
    const result = scorePerfRun(makeSnapshot({
      vitals: [{ name: 'LCP', value: 10000, rating: 'poor' }],
    }));
    expect(result.issues.some(i => i.includes('LCP'))).toBe(true);
  });
});
