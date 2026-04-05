export interface PerformanceSample {
  timestamp: number;
  fps: number;
  heapUsed?: number;
  heapTotal?: number;
}

export interface WebVital {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export interface LongTask {
  startTime: number;
  duration: number;
  name: string;
}

export interface ResourceTiming {
  name: string;
  initiatorType: string;
  duration: number;
  transferSize: number;
  startTime: number;
}

export interface InteractionTiming {
  type: string;
  duration: number;
  startTime: number;
  target?: string;
}

export interface PerformanceReport {
  deviceId: string;
  tabId: string;
  vitals: WebVital[];
  samples: PerformanceSample[];
  longTasks: LongTask[];
  resources: ResourceTiming[];
  interactions: InteractionTiming[];
}

export class PerformanceStore {
  private reports: Map<string, PerformanceReport> = new Map();

  update(deviceId: string, report: PerformanceReport): void {
    this.reports.set(deviceId, report);
  }

  get(deviceId: string): PerformanceReport | undefined {
    return this.reports.get(deviceId);
  }

  clear(deviceId: string): void {
    this.reports.delete(deviceId);
  }
}
