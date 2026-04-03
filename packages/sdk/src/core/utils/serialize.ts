/** 将参数序列化为字符串，正确处理对象 */
export function serializeArgs(args: unknown[]): string {
  return args.map(arg => {
    if (arg === undefined) {
      return 'undefined';
    }
    if (arg === null) {
      return 'null';
    }
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    }
    return String(arg);
  }).join(' ');
}

/** 清理堆栈跟踪，移除拦截器帧 */
export function cleanStackTrace(stack: string | undefined): string | undefined {
  if (!stack) return undefined;

  const lines = stack.split('\n');
  const cleanedLines = lines.filter(line =>
    !line.includes('interceptConsole') &&
    !line.includes('serializeArgs') &&
    !line.includes('cleanStackTrace')
  );

  return cleanedLines.join('\n');
}
