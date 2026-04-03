/** 速率限制器 */
export class RateLimiter {
  private count = 0;
  private resetTime = 0;

  constructor(private readonly maxPerSecond: number = 100) {}

  /** 检查是否超过速率限制，返回 true 表示允许 */
  check(): boolean {
    const now = Date.now();
    if (now > this.resetTime + 1000) {
      this.count = 0;
      this.resetTime = now;
    }

    if (this.count >= this.maxPerSecond) {
      return false;
    }

    this.count++;
    return true;
  }
}
