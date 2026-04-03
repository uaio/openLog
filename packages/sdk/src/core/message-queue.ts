/** 消息队列，连接未建立时缓存消息 */
export class MessageQueue {
  private queue: string[] = [];

  constructor(private readonly maxSize: number = 100) {}

  /** 添加消息到队列 */
  enqueue(message: string): void {
    if (this.queue.length < this.maxSize) {
      this.queue.push(message);
    }
  }

  /** 取出所有待发送消息并清空队列 */
  dequeueAll(): string[] {
    const messages = this.queue;
    this.queue = [];
    return messages;
  }

  /** 队列长度 */
  get length(): number {
    return this.queue.length;
  }
}
