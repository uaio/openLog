import type { DOMNode, DOMSnapshot } from '../types/index.js';
import type { PlatformAdapter } from '../platform/types.js';

export type DOMReportCallback = (snapshot: Omit<DOMSnapshot, 'deviceId' | 'tabId'>) => void;

/** 忽略的 tag（不采集内容） */
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'SVG', 'CANVAS']);

/** 忽略的属性名前缀/名称 */
const SKIP_ATTRS = new Set([
  'onclick',
  'onload',
  'onerror',
  'onchange',
  'onsubmit',
  'onfocus',
  'onblur',
  'onkeydown',
  'onkeyup',
  'onkeypress',
  'onmousedown',
  'onmouseup',
  'onmouseover',
  'onmouseout',
  'onmousemove',
]);

const MAX_DEPTH = 8;
const MAX_CHILDREN = 30;
const MAX_TEXT_LEN = 150;
const MAX_ATTRS = 8;

function serializeNode(el: Element, depth: number): DOMNode | null {
  const tag = el.tagName;

  if (SKIP_TAGS.has(tag)) return null;

  const node: DOMNode = { tag: tag.toLowerCase() };

  // id / className
  if (el.id) node.id = el.id;
  if (el.className && typeof el.className === 'string' && el.className.trim()) {
    node.className = el.className.trim();
  }

  // 其他属性（过滤事件监听、限制数量）
  const attrs: Record<string, string> = {};
  let attrCount = 0;
  for (const attr of Array.from(el.attributes)) {
    if (attr.name === 'id' || attr.name === 'class') continue;
    if (SKIP_ATTRS.has(attr.name.toLowerCase())) continue;
    if (attr.name.startsWith('on')) continue;
    if (attrCount >= MAX_ATTRS) break;
    attrs[attr.name] = attr.value.slice(0, 200);
    attrCount++;
  }
  if (attrCount > 0) node.attrs = attrs;

  // 文本内容（仅叶子节点或浅节点）
  if (depth >= MAX_DEPTH - 2 || el.children.length === 0) {
    const text = el.textContent?.trim().slice(0, MAX_TEXT_LEN);
    if (text) node.text = text;
  }

  // 子节点
  if (depth < MAX_DEPTH) {
    const children: DOMNode[] = [];
    const childElements = Array.from(el.children);
    const totalChildren = childElements.length;

    for (const child of childElements.slice(0, MAX_CHILDREN)) {
      const childNode = serializeNode(child as Element, depth + 1);
      if (childNode) children.push(childNode);
    }

    if (children.length > 0) node.children = children;
    if (totalChildren > MAX_CHILDREN) node.childCount = totalChildren;
  } else {
    node.childCount = el.children.length;
  }

  return node;
}

/**
 * DOM 快照采集器
 * 序列化当前页面的 DOM 结构供远程查看和 AI 分析
 */
export class DOMCollector {
  private platform: PlatformAdapter;
  private callback: DOMReportCallback;
  private refreshHandler: (() => void) | null = null;

  constructor(platform: PlatformAdapter, callback: DOMReportCallback) {
    this.platform = platform;
    this.callback = callback;
  }

  /** 采集并上报一次 DOM 快照 */
  collect(): void {
    if (typeof document === 'undefined') return;

    try {
      const root = document.documentElement;
      const dom = serializeNode(root, 0);
      if (!dom) return;

      this.callback({
        timestamp: Date.now(),
        url: window.location.href,
        title: document.title,
        dom,
      });
    } catch (err) {
      console.warn('[openLog] DOM 快照采集失败', err);
    }
  }

  /** 注册外部触发刷新的回调 */
  onRefresh(handler: () => void): void {
    this.refreshHandler = handler;
  }

  triggerRefresh(): void {
    this.refreshHandler?.();
  }

  destroy(): void {
    this.refreshHandler = null;
  }
}
