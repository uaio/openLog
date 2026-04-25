import type { MockRule } from '../types/index.js';

export class MockAPI {
  private rules: MockRule[] = [];
  private originalFetch: typeof fetch | null = null;
  private originalXHROpen: typeof XMLHttpRequest.prototype.open | null = null;
  private originalXHRSend: typeof XMLHttpRequest.prototype.send | null = null;
  private active = false;

  start(): void {
    if (this.active || typeof window === 'undefined') return;
    this.active = true;
    this.patchFetch();
    this.patchXHR();
  }

  private matchRule(url: string, method: string): MockRule | undefined {
    return this.rules.find((r) => {
      const patternMatch = (() => {
        try {
          return new RegExp(r.pattern).test(url);
        } catch {
          return url.includes(r.pattern);
        }
      })();
      const methodMatch = !r.method || r.method.toUpperCase() === method.toUpperCase();
      return patternMatch && methodMatch;
    });
  }

  private patchFetch(): void {
    this.originalFetch = window.fetch.bind(window);
    const self = this;
    window.fetch = async function (
      input: RequestInfo | URL,
      init?: RequestInit,
    ): Promise<Response> {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : (input as Request).url;
      const method = (init?.method ?? 'GET').toUpperCase();
      const matched = self.matchRule(url, method);
      if (matched) {
        return new Response(matched.body, {
          status: matched.status,
          headers: { 'Content-Type': 'application/json', ...matched.headers },
        });
      }
      return self.originalFetch!(input, init);
    };
  }

  private patchXHR(): void {
    const self = this;
    this.originalXHROpen = XMLHttpRequest.prototype.open;
    this.originalXHRSend = XMLHttpRequest.prototype.send;

    // Store URL/method on XHR instance via open patch
    const origOpen = this.originalXHROpen;
    XMLHttpRequest.prototype.open = function (
      method: string,
      url: string | URL,
      ...rest: unknown[]
    ) {
      (this as unknown as Record<string, string>).__mockUrl =
        typeof url === 'string' ? url : url.href;
      (this as unknown as Record<string, string>).__mockMethod = method;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (origOpen as any).call(this, method, url, ...rest);
    };

    const origSend = this.originalXHRSend;
    XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
      const xhrUrl = (this as unknown as Record<string, string>).__mockUrl || '';
      const xhrMethod = (this as unknown as Record<string, string>).__mockMethod || 'GET';
      const matched = self.matchRule(xhrUrl, xhrMethod);

      if (matched) {
        // Simulate a mock response
        Object.defineProperty(this, 'status', {
          value: matched.status,
          writable: false,
          configurable: true,
        });
        Object.defineProperty(this, 'statusText', {
          value: 'OK',
          writable: false,
          configurable: true,
        });
        Object.defineProperty(this, 'responseText', {
          value: matched.body,
          writable: false,
          configurable: true,
        });
        Object.defineProperty(this, 'response', {
          value: matched.body,
          writable: false,
          configurable: true,
        });
        Object.defineProperty(this, 'readyState', {
          value: 4,
          writable: false,
          configurable: true,
        });

        const headerStr = Object.entries({ 'Content-Type': 'application/json', ...matched.headers })
          .map(([k, v]) => `${k}: ${v}`)
          .join('\r\n');
        Object.defineProperty(this, 'getAllResponseHeaders', {
          value: () => headerStr,
          configurable: true,
        });

        setTimeout(() => {
          this.dispatchEvent(new Event('readystatechange'));
          this.dispatchEvent(new Event('load'));
          this.dispatchEvent(new Event('loadend'));
        }, 0);
        return;
      }
      origSend.call(this, body);
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

  addRule(rule: Omit<MockRule, 'id'>): string {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    this.rules.push({ ...rule, id });
    return id;
  }

  removeRule(id: string): void {
    this.rules = this.rules.filter((r) => r.id !== id);
  }

  clearRules(): void {
    this.rules = [];
  }

  getRules(): MockRule[] {
    return [...this.rules];
  }
}
