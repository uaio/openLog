export type ThrottlePreset = 'none' | '3g' | '2g' | 'offline';

interface ThrottleConfig {
  latency: number;
  downloadKbps: number;
}

const PRESETS: Record<ThrottlePreset, ThrottleConfig> = {
  none: { latency: 0, downloadKbps: Infinity },
  '3g': { latency: 300, downloadKbps: 750 },
  '2g': { latency: 600, downloadKbps: 250 },
  offline: { latency: 0, downloadKbps: 0 },
};

export class NetworkThrottle {
  private preset: ThrottlePreset = 'none';
  private originalFetch: typeof fetch | null = null;
  private active = false;

  setPreset(preset: ThrottlePreset): void {
    this.preset = preset;
    if (preset === 'none') {
      this.stop();
    } else {
      if (!this.active) this.start();
    }
  }

  start(): void {
    if (this.active || typeof window === 'undefined') return;
    this.active = true;
    this.originalFetch = window.fetch.bind(window);
    const self = this;
    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const config = PRESETS[self.preset];
      if (config.downloadKbps === 0) {
        throw new TypeError('Failed to fetch: Network offline (throttled)');
      }
      if (config.latency > 0) {
        await new Promise(r => setTimeout(r, config.latency));
      }
      return self.originalFetch!(input, init);
    };
  }

  stop(): void {
    if (!this.active || typeof window === 'undefined') return;
    this.active = false;
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
      this.originalFetch = null;
    }
  }

  destroy(): void {
    this.stop();
  }
}
