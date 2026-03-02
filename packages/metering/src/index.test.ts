import { describe, expect, it } from 'vitest';
import { OfflineQueue } from './index';

const event = {
  event_id: '11111111-1111-1111-1111-111111111111',
  timestamp: new Date().toISOString(),
  org_id: 'o1', user_id: 'u1', feature: 'rag', provider: 'stub', model: 'stub',
  prompt_tokens: 1, completion_tokens: 1, total_tokens: 2, cost_estimate: 0.01,
  request_id: 'r1', trace_id: 't1', latency_ms: 10, cache_hit: false
} as const;

describe('OfflineQueue', () => {
  it('retries and flushes', async () => {
    let attempts = 0;
    const q = new OfflineQueue(async () => {
      attempts += 1;
      if (attempts < 2) throw new Error('fail');
    });
    q.enqueue(event as any);
    const sent = await q.flush();
    expect(sent).toBe(1);
    expect(q.size()).toBe(0);
  });
});
