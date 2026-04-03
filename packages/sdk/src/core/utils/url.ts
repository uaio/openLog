/** 检查 URL 是否匹配忽略模式 */
export function shouldIgnoreUrl(url: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    try {
      const regex = new RegExp(pattern);
      if (regex.test(url)) {
        return true;
      }
    } catch {
      // 忽略无效的正则表达式
    }
  }
  return false;
}
