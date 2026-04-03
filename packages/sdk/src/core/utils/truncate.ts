/** 截断字符串到指定字节大小 */
export function truncateToSize(str: string, maxSize: number): string {
  if (!str) return str;
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  if (bytes.length <= maxSize) {
    return str;
  }
  return str.slice(0, Math.floor(maxSize / 2)) + '...[truncated]';
}
