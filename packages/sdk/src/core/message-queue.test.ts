import { describe, it, expect } from 'vitest';
import { MessageQueue } from './message-queue.js';

describe('MessageQueue', () => {
  it('should enqueue and dequeue messages', () => {
    const q = new MessageQueue();
    q.enqueue('msg1');
    q.enqueue('msg2');
    expect(q.length).toBe(2);

    const msgs = q.dequeueAll();
    expect(msgs).toEqual(['msg1', 'msg2']);
    expect(q.length).toBe(0);
  });

  it('should respect max size limit', () => {
    const q = new MessageQueue(3);
    q.enqueue('a');
    q.enqueue('b');
    q.enqueue('c');
    q.enqueue('d'); // should be dropped

    expect(q.length).toBe(3);
    expect(q.dequeueAll()).toEqual(['a', 'b', 'c']);
  });

  it('should return empty array when queue is empty', () => {
    const q = new MessageQueue();
    expect(q.dequeueAll()).toEqual([]);
  });

  it('should default to 100 max size', () => {
    const q = new MessageQueue();
    for (let i = 0; i < 110; i++) {
      q.enqueue(`msg-${i}`);
    }
    expect(q.length).toBe(100);
  });

  it('should allow new messages after dequeue', () => {
    const q = new MessageQueue(2);
    q.enqueue('a');
    q.enqueue('b');
    q.dequeueAll();
    q.enqueue('c');
    expect(q.length).toBe(1);
    expect(q.dequeueAll()).toEqual(['c']);
  });
});
