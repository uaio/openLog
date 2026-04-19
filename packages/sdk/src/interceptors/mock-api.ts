export interface MockRule {
  id: string;
  pattern: string;
  method?: string;
  status: number;
  headers: Record<string, string>;
  body: string;
}

export class MockAPI {
  private rules: MockRule[] = [];
  private originalFetch: typeof fetch | null = null;
  private active = false;

  start(): void {
    if (this.active || typeof window === 'undefined') return;
    this.active = true;
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
      const matched = self.rules.find((r) => {
        const patternMatch = (() => {
          try {
            return new RegExp(r.pattern).test(url);
          } catch {
            return url.includes(r.pattern);
          }
        })();
        const methodMatch = !r.method || r.method.toUpperCase() === method;
        return patternMatch && methodMatch;
      });
      if (matched) {
        return new Response(matched.body, {
          status: matched.status,
          headers: { 'Content-Type': 'application/json', ...matched.headers },
        });
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
