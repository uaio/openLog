import type {
  ConsolePayload,
  NetworkPayload,
  StoragePayload,
  DOMPayload,
  DOMNode as TypesDOMNode,
  PerformancePayload,
  PerformanceSample as TypesPerformanceSample,
  ScreenshotPayload,
  PerfScoreItem,
  MockRule as TypesMockRule,
  WebVital,
  LongTask,
  ResourceTiming,
  InteractionTiming,
  ErrorPayload,
  LifecyclePayload,
  CustomPayload,
} from '@openlogs/types';

// ─── SDK 特有的配置类型（@openlogs/types 未定义） ───────────────────────

export interface DeviceInfo {
  deviceId: string;
  projectId: string;
  ua: string;
  screen: string;
  pixelRatio: number;
  language: string;
  url: string;
  connectTime: number;
  lastActiveTime: number;
}

export interface RemoteConfig {
  projectId: string;
  server?: string;
  port?: number;
  lang?: 'zh' | 'en';
}

export interface ErudaConfig {
  enabled?: boolean;
  tool?: string[];
  autoScale?: boolean;
  useShadowDom?: boolean;
  defaults?: {
    transparency?: number;
    displaySize?: number;
    theme?: string;
    overrideConsole?: boolean;
  };
}

export interface NetworkInterceptorConfig {
  enabled?: boolean;
  maxRequestBodySize?: number;
  maxResponseBodySize?: number;
  ignoreUrls?: string[];
}

export interface AuditItem {
  id: string;
  title: string;
  score: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  value: string;
  details?: any;
}

export interface PageAuditReport {
  timestamp: number;
  url: string;
  audits: AuditItem[];
  summary: { good: number; warning: number; poor: number };
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
  snapshot: PerformancePayload;
  score: PerfRunScore;
  audit?: PageAuditReport;
}

// ─── 统一类型（Payload + Transport 字段） ───────────────────────────────────

/** Transport 标识字段（SDK 发送 Envelope 时携带） */
interface TransportFields {
  deviceId: string;
  tabId: string;
  timestamp: number;
}

/** 控制台日志 */
export interface ConsoleLogEntry extends Omit<ConsolePayload, 'args'>, TransportFields {
  args: unknown[];
}

/** 网络请求记录 */
export interface NetworkRequestEntry extends NetworkPayload, TransportFields {
  id: string;
}

/** 存储快照 */
export interface StorageSnapshot extends StoragePayload, TransportFields {}

/** DOM 节点 — 直接使用 @openlogs/types 定义 */
export type DOMNode = TypesDOMNode;

/** DOM 快照 */
export interface DOMSnapshot extends DOMPayload, TransportFields {}

/** 截图数据 */
export interface ScreenshotData extends ScreenshotPayload, TransportFields {}

/** 性能上报数据 */
export interface PerformanceReport extends PerformancePayload, TransportFields {}

/** 直接 re-export @openlogs/types 中的共享类型 */
export type {
  PerfScoreItem,
  TypesMockRule as MockRuleType,
  TypesMockRule as MockRule,
  TypesPerformanceSample as PerformanceSample,
  PerformancePayload,
  WebVital,
  LongTask,
  ResourceTiming,
  InteractionTiming,
  ErrorPayload,
  LifecyclePayload,
  CustomPayload,
};
