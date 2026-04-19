/** Mock 规则记录 */
export interface MockRule {
  id: string;
  pattern: string;
  method?: string;
  status: number;
  headers?: Record<string, string>;
  body?: string;
  createdAt: number;
}

/**
 * 存储每个设备的 Mock 规则（服务端跟踪）
 * 用于 PC 面板展示当前生效的规则列表
 */
export class MockStore {
  private rules: Map<string, MockRule[]> = new Map();

  add(deviceId: string, rule: Omit<MockRule, 'id' | 'createdAt'>): MockRule {
    if (!this.rules.has(deviceId)) {
      this.rules.set(deviceId, []);
    }
    const fullRule: MockRule = {
      ...rule,
      id: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: Date.now(),
    };
    this.rules.get(deviceId)!.push(fullRule);
    return fullRule;
  }

  remove(deviceId: string, mockId: string): boolean {
    const list = this.rules.get(deviceId);
    if (!list) return false;
    const idx = list.findIndex((r) => r.id === mockId);
    if (idx === -1) return false;
    list.splice(idx, 1);
    return true;
  }

  clear(deviceId: string): void {
    this.rules.delete(deviceId);
  }

  list(deviceId: string): MockRule[] {
    return this.rules.get(deviceId) || [];
  }

  /** 设备断开时清理 */
  cleanup(deviceId: string): void {
    this.rules.delete(deviceId);
  }
}
