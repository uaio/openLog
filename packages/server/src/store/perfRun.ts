export interface PerfScoreItem {
  name: string;
  score: number;
  weight: number;
  value: number | null;
  unit: string;
  rating: 'good' | 'needs-improvement' | 'poor' | 'unknown';
}

export interface PerfRunScore {
  total: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  items: PerfScoreItem[];
  issues: string[];
  summary: string;
}

export interface PerfRunSession {
  sessionId: string;
  deviceId: string;
  tabId: string;
  startTime: number;
  endTime: number;
  duration: number;
  snapshot: any;
  score: PerfRunScore;
  audit?: any;
}

export class PerfRunStore {
  private sessions: Map<string, PerfRunSession[]> = new Map();

  add(session: PerfRunSession): void {
    const existing = this.sessions.get(session.deviceId) ?? [];
    existing.push(session);
    this.sessions.set(session.deviceId, existing);
  }

  getAll(deviceId: string): PerfRunSession[] {
    return this.sessions.get(deviceId) ?? [];
  }

  get(deviceId: string, sessionId: string): PerfRunSession | undefined {
    return this.sessions.get(deviceId)?.find(s => s.sessionId === sessionId);
  }

  clear(deviceId: string): void {
    this.sessions.delete(deviceId);
  }
}
