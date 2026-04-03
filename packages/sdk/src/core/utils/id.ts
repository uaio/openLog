/** 生成标签页 ID */
export function generateTabId(): string {
  return 'tab-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
}

/** 生成网络请求 ID */
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
