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
  private originalXHROpen: typeof XMLHttpRequest.prototype.open | null = null;
  private originalXHRSend: typeof XMLHttpRequest.prototype.send | null = null;
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
    this.patchFetch();
    this.patchXHR();
  }

  private patchFetch(): void {
    this.originalFetch = window.fetch.bind(window);
    const self = this;
    window.fetch = async function (
      input: RequestInfo | URL,
      init?: RequestInit,
    ): Promise<Response> {
      const config = PRESETS[self.preset];
      if (config.downloadKbps === 0) {
        throw new TypeError('Failed to fetch: Network offline (throttled)');
      }
      if (config.latency > 0) {
        await new Promise((r) => setTimeout(r, config.latency));
      }
      return self.originalFetch!(input, init);
    };
  }

  private patchXHR(): void {
    const self = this;
    this.originalXHROpen = XMLHttpRequest.prototype.open;
    this.originalXHRSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
      const config = PRESETS[self.preset];
      const xhr = this;

      if (config.downloadKbps === 0) {
        // Simulate offline
        setTimeout(() => {
          Object.defineProperty(xhr, 'status', { value: 0, writable: false });
          xhr.dispatchEvent(new Event('error'));
        }, 0);
        return;
      }

      if (config.latency > 0) {
        setTimeout(() => {
          self.originalXHRSend!.call(xhr, body);
        }, config.latency);
      } else {
        self.originalXHRSend!.call(xhr, body);
      }
    };
  }

  stop(): void {
    if (!this.active || typeof window === 'undefined') return;
    this.active = false;
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
      this.originalFetch = null;
    }
    if (this.originalXHROpen) {
      XMLHttpRequest.prototype.open = this.originalXHROpen;
      this.originalXHROpen = null;
    }
    if (this.originalXHRSend) {
      XMLHttpRequest.prototype.send = this.originalXHRSend;
      this.originalXHRSend = null;
    }
  }

  destroy(): void {
    this.stop();
  }
}
