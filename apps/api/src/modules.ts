import { Module, Injectable, Controller, Get, Post, Body, Req, Res, Query, HttpException } from '@nestjs/common';
import { RagQuerySchema, ThingworxVerifySchema } from '@packages/shared';
import { randomUUID } from 'crypto';

const users = new Map<string, any>();
const usageEvents: any[] = [];
const docs = [{ id: 'd1', source: 'sample_docs/guide.md', text: 'ThingWorx entities and services basics.', version: 1 }];

@Injectable()
class QuotaService {
  check(orgId: string): { blocked: boolean; reason?: string } {
    const total = usageEvents.filter((e) => e.org_id === orgId).reduce((a, e) => a + e.total_tokens, 0);
    if (total > 100000) return { blocked: true, reason: 'hard_limit_exceeded' };
    return { blocked: false };
  }
}

@Controller('auth')
class AuthController {
  @Get('login') login(): any { return { authorizationUrl: '/auth/callback?code=mock' }; }
  @Get('callback') callback(@Res({ passthrough: true }) res: any): any {
    const sid = randomUUID();
    users.set(sid, { id: 'u1', orgId: 'org1', plan: 'pro', limits: { soft: 50000, hard: 100000 }, billingStatus: 'active' });
    res.cookie('sid', sid, { httpOnly: true, sameSite: 'lax' });
    return { ok: true };
  }
  @Post('logout') logout(@Req() req: any, @Res({ passthrough: true }) res: any): any { users.delete(req.cookies.sid); res.clearCookie('sid'); return { ok: true }; }
}

@Controller()
class MeController {
  @Get('me') me(@Req() req: any): any {
    const u = users.get(req.cookies.sid);
    if (!u) throw new HttpException('Unauthorized', 401);
    return { user: { id: u.id }, org: { id: u.orgId }, plan: u.plan, limits: u.limits, billingStatus: u.billingStatus };
  }
}

@Controller('thingworx')
class ThingworxController {
  @Post('verify') verify(@Body() body: unknown): any {
    const parsed = ThingworxVerifySchema.parse(body);
    return { ok: parsed.baseUrl.includes('mock-thingworx'), info: { platform: 'mock', version: '1.0' } };
  }
}

@Controller('mock-thingworx')
class MockThingworxController { @Get('ping') ping(): any { return { ok: true }; } }

@Controller('billing')
class BillingController {
  @Get('status') status(): any { return { status: 'active', plan: 'pro', limits: { soft: 50000, hard: 100000 } }; }
  @Post('checkout') checkout(): any { return { url: 'https://billing.example/checkout' }; }
  @Post('portal') portal(): any { return { url: 'https://billing.example/portal' }; }
}

@Controller('rag')
class RagController {
  constructor(private readonly quota: QuotaService) {}
  @Post('query') query(@Req() req: any, @Body() body: unknown): any {
    const q = RagQuerySchema.parse(body);
    const user = users.get(req.cookies.sid) ?? { id: 'anon', orgId: 'org1' };
    const block = this.quota.check(user.orgId);
    if (block.blocked) throw new HttpException(block.reason, 402);
    const retrieved = docs.slice(0, q.topK).map((d) => ({ ...d, score: 0.9 }));
    const answer = `Answer for: ${q.query}`;
    usageEvents.push({ event_id: randomUUID(), timestamp: new Date().toISOString(), org_id: user.orgId, user_id: user.id, feature: 'rag', provider: 'stub', model: 'stub', prompt_tokens: 10, completion_tokens: 15, total_tokens: 25, cost_estimate: 0.001, request_id: randomUUID(), trace_id: randomUUID(), latency_ms: 8, cache_hit: false });
    return { answer, citations: retrieved.map((r) => r.source), retrievedChunks: retrieved, cache_hit: false };
  }
}

@Controller('admin')
class AdminController {
  @Get('usage') usage(@Query('org') org: string): any { return usageEvents.filter((e) => !org || e.org_id === org); }
  @Get('invoices') invoices(): any { return { month: '2026-01', totalTokens: usageEvents.reduce((a, e) => a + e.total_tokens, 0), totalCost: usageEvents.reduce((a, e) => a + e.cost_estimate, 0) }; }
}

@Controller('telemetry')
class TelemetryController {
  @Post('crash') crash(@Body() body: any): any {
    const payload = JSON.stringify(body).replace(/[A-Za-z0-9_\-]{16,}/g, '[REDACTED]');
    return { accepted: true, scrubbed: payload };
  }
}

@Controller('eval')
class EvalController {
  @Get('metrics') metrics(): any { return { successRate: 1, hallucinationProxy: 0, avgTokens: 25, p95Latency: 10, citationPresence: 1 }; }
}

@Module({ controllers: [AuthController, MeController, ThingworxController, MockThingworxController, BillingController, RagController, AdminController, TelemetryController, EvalController], providers: [QuotaService] })
export class AppModule {}
