import { UsageEvent } from '@packages/shared';

export class OfflineQueue {
  private queue: UsageEvent[] = [];
  constructor(private readonly sender: (e: UsageEvent) => Promise<void>) {}

  enqueue(event: UsageEvent): void {
    this.queue.push(event);
  }

  async flush(retries = 3): Promise<number> {
    let sent = 0;
    const remain: UsageEvent[] = [];
    for (const event of this.queue) {
      let ok = false;
      for (let i = 0; i < retries; i += 1) {
        try {
          await this.sender(event);
          ok = true;
          sent += 1;
          break;
        } catch {
          await new Promise((r) => setTimeout(r, (i + 1) * 50));
        }
      }
      if (!ok) remain.push(event);
    }
    this.queue = remain;
    return sent;
  }

  size(): number {
    return this.queue.length;
  }
}
