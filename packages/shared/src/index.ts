import { z } from 'zod';

export const UsageEventSchema = z.object({
  event_id: z.string().uuid(),
  timestamp: z.string().datetime(),
  org_id: z.string(),
  user_id: z.string(),
  feature: z.enum(['chat', 'rag', 'thingworx', 'embedding']),
  provider: z.string(),
  model: z.string(),
  prompt_tokens: z.number().int().nonnegative(),
  completion_tokens: z.number().int().nonnegative(),
  total_tokens: z.number().int().nonnegative(),
  cost_estimate: z.number().nonnegative(),
  request_id: z.string(),
  trace_id: z.string(),
  latency_ms: z.number().nonnegative(),
  cache_hit: z.boolean(),
  blocked_reason: z.string().optional()
});

export const ThingworxVerifySchema = z.object({
  baseUrl: z.string().url(),
  appKey: z.string().min(8)
});

export const RagQuerySchema = z.object({
  query: z.string().min(3),
  topK: z.number().int().min(1).max(20).default(5)
});

export const CapabilityMap = {
  read: ['run_service'],
  write: ['create_entity', 'update_entity']
};

export const CreateEntitySchemaV1 = z.object({
  version: z.literal('1.0.0'),
  entityType: z.string(),
  name: z.string(),
  fields: z.record(z.any())
});

export const UpdateEntitySchemaV1 = z.object({
  version: z.literal('1.0.0'),
  entityType: z.string(),
  id: z.string(),
  patch: z.record(z.any())
});

export const RunServiceSchemaV1 = z.object({
  version: z.literal('1.0.0'),
  service: z.string(),
  input: z.record(z.any())
});

export type UsageEvent = z.infer<typeof UsageEventSchema>;
