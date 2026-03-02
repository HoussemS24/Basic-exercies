import { describe, expect, it } from 'vitest';
import { RagQuerySchema } from './index';

describe('schemas', () => {
  it('validates rag query', () => {
    expect(RagQuerySchema.parse({ query: 'abc', topK: 2 }).topK).toBe(2);
  });
});
